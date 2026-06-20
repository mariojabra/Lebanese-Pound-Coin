// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LBPCStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public constant PRECISION = 1e18;
    uint256 public constant BPS = 10_000;
    uint256 public constant YEAR = 365 days;

    uint256 public targetApyBps;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event TargetApyUpdated(uint256 newApyBps);
    event RewardsFunded(address indexed funder, uint256 amount);
    event RescueTokens(address indexed token, address indexed to, uint256 amount);

    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _targetApyBps
    ) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        require(_targetApyBps <= 10_000, "APY too high");

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        targetApyBps = _targetApyBps;
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }

        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }

        uint256 timeElapsed = block.timestamp - lastUpdateTime;

        return
            rewardPerTokenStored +
            ((timeElapsed * targetApyBps * PRECISION) / (BPS * YEAR));
    }

    function earned(address account) public view returns (uint256) {
        return
            ((_balances[account] *
                (rewardPerToken() - userRewardPerTokenPaid[account])) /
                PRECISION) + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");

        _totalSupply += amount;
        _balances[msg.sender] += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(_balances[msg.sender] >= amount, "Insufficient balance");

        _totalSupply -= amount;
        _balances[msg.sender] -= amount;

        stakingToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];

        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);

            emit RewardPaid(msg.sender, reward);
        }
    }

    function exit() external {
        withdraw(_balances[msg.sender]);
        getReward();
    }

    function setTargetApyBps(uint256 _targetApyBps)
        external
        onlyOwner
        updateReward(address(0))
    {
        require(_targetApyBps <= 10_000, "APY too high");

        targetApyBps = _targetApyBps;

        emit TargetApyUpdated(_targetApyBps);
    }

    function fundRewards(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot fund 0");

        rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        emit RewardsFunded(msg.sender, amount);
    }

    function availableRewards() public view returns (uint256) {
        uint256 balance = rewardToken.balanceOf(address(this));

        if (address(stakingToken) == address(rewardToken)) {
            if (balance <= _totalSupply) {
                return 0;
            }

            return balance - _totalSupply;
        }

        return balance;
    }

    function getRewardSafe() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        uint256 available = availableRewards();

        require(reward > 0, "No rewards");
        require(available >= reward, "Insufficient reward funding");

        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardPaid(msg.sender, reward);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function rescueRewardTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid receiver");
        require(amount <= availableRewards(), "Amount exceeds available rewards");

        rewardToken.safeTransfer(to, amount);

        emit RescueTokens(address(rewardToken), to, amount);
    }
}