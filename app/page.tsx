"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ConnectButton, ClaimButton, useActiveAccount } from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
  readContract,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: "b00ba2253c78cfcb0dade8473d97b262",
});

const CHAINS = {
  arc: {
    name: "Arc Testnet",
    chain: defineChain(5042002),
    tokenAddress: "0x900AfE961d723c8159841530Cf794030E2A6Ff62",
    stakingAddress: "0x580f176386994b5243fFB184aE2d88784949427C",
    explorer: "https://testnet.arcscan.app/address/",
  },
  sepolia: {
    name: "Ethereum Sepolia",
    chain: defineChain(11155111),
    tokenAddress: "0x024Dc70698b0F80b559921Cd6aA9E7591298dA48",
    stakingAddress: "0x0210455a8ee8B968967034D1777adcF7C1cBcE60",
    explorer: "https://sepolia.etherscan.io/address/",
  },
};

const CHURCH_NFT_ADDRESS = "0xb3A3d9F98CC050D56f4325C86A46152fba6f599f";
const CONTACT_EMAIL = "management@lbpcoin.com";
const ONE_THOUSAND_LBPC_WEI = BigInt(1000) * BigInt(10) ** BigInt(18);

const CHURCHES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  name: `Church ${i + 1}`,
  description: `Catholic Church collectible #${i + 1}`,
}));

type ChainKey = keyof typeof CHAINS;

export default function Page() {
  const account = useActiveAccount();

  const [selectedChainKey, setSelectedChainKey] = useState<ChainKey>("arc");
  const selectedChain = CHAINS[selectedChainKey];

  const lbpcTokenContract = getContract({
    client,
    chain: selectedChain.chain,
    address: selectedChain.tokenAddress,
  });

  const stakingContract = getContract({
    client,
    chain: selectedChain.chain,
    address: selectedChain.stakingAddress,
  });

  const [status, setStatus] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<
    "about" | "claim" | "stake" | "marketplace"
  >("about");

  const [stats, setStats] = useState({
    walletBalance: "0",
    totalSupply: "0",
    totalStaked: "0",
    myStaked: "0",
    pendingRewards: "0",
    apy: "Unavailable",
  });

  const toWei = (amount: string) => {
    const clean = amount.trim();
    if (!clean || Number(clean) <= 0) return BigInt(0);

    const [whole, decimal = ""] = clean.split(".");
    const paddedDecimal = decimal.padEnd(18, "0").slice(0, 18);

    return (
      BigInt(whole || "0") * BigInt(10) ** BigInt(18) +
      BigInt(paddedDecimal || "0")
    );
  };

  const formatWei = (value: bigint) => {
    const whole = value / BigInt(10) ** BigInt(18);
    const decimal = value % (BigInt(10) ** BigInt(18));
    const decimalText = decimal.toString().padStart(18, "0").slice(0, 4);
    return `${whole.toLocaleString()}${decimalText !== "0000" ? "." + decimalText : ""}`;
  };

  const loadStats = async () => {
    try {
      let walletBalance = BigInt(0);
      let totalSupply = BigInt(0);
      let totalStaked = BigInt(0);
      let myStaked = BigInt(0);
      let pendingRewards = BigInt(0);
      let apyText = "Unavailable";

      totalSupply = await readContract({
        contract: lbpcTokenContract,
        method: "function totalSupply() view returns (uint256)",
        params: [],
      });

      totalStaked = await readContract({
        contract: stakingContract,
        method: "function totalSupply() view returns (uint256)",
        params: [],
      });

      try {
        const apy = await readContract({
          contract: stakingContract,
          method: "function targetApyBps() view returns (uint256)",
          params: [],
        });

        apyText = `${Number(apy) / 100}%`;
      } catch {
        apyText = "Not available";
      }

      if (account?.address) {
        walletBalance = await readContract({
          contract: lbpcTokenContract,
          method: "function balanceOf(address account) view returns (uint256)",
          params: [account.address],
        });

        myStaked = await readContract({
          contract: stakingContract,
          method: "function balanceOf(address account) view returns (uint256)",
          params: [account.address],
        });

        try {
          pendingRewards = await readContract({
            contract: stakingContract,
            method: "function earned(address account) view returns (uint256)",
            params: [account.address],
          });
        } catch {
          pendingRewards = BigInt(0);
        }
      }

      setStats({
        walletBalance: formatWei(walletBalance),
        totalSupply: formatWei(totalSupply),
        totalStaked: formatWei(totalStaked),
        myStaked: formatWei(myStaked),
        pendingRewards: formatWei(pendingRewards),
        apy: apyText,
      });

      setStatus(`Stats refreshed on ${selectedChain.name}`);
    } catch (err: any) {
      console.error(err);
      setStatus("Could not load stats. Check wallet network and contract addresses.");
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedChainKey, account?.address]);

  const stakeLBPC = async () => {
    try {
      if (!account?.address) {
        setStatus("Connect wallet first");
        return;
      }

      const amountWei = toWei(stakeAmount);

      if (amountWei <= BigInt(0)) {
        setStatus("Enter an amount to stake");
        return;
      }

      setStatus("Approving LBPC...");

      const approveTx = prepareContractCall({
        contract: lbpcTokenContract,
        method: "function approve(address spender, uint256 amount)",
        params: [selectedChain.stakingAddress, amountWei],
      });

      await sendTransaction({ transaction: approveTx, account });

      setStatus("Staking LBPC...");

      const stakeTx = prepareContractCall({
        contract: stakingContract,
        method: "function stake(uint256 amount)",
        params: [amountWei],
      });

      await sendTransaction({ transaction: stakeTx, account });

      setStakeAmount("");
      setStatus(`Successfully staked ${stakeAmount} LBPC`);
      await loadStats();
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Stake failed");
    }
  };

  const withdrawLBPC = async () => {
    try {
      if (!account?.address) {
        setStatus("Connect wallet first");
        return;
      }

      const amountWei = toWei(withdrawAmount);

      if (amountWei <= BigInt(0)) {
        setStatus("Enter an amount to withdraw");
        return;
      }

      const tx = prepareContractCall({
        contract: stakingContract,
        method: "function withdraw(uint256 amount)",
        params: [amountWei],
      });

      await sendTransaction({ transaction: tx, account });

      setWithdrawAmount("");
      setStatus(`Successfully withdrew ${withdrawAmount} LBPC`);
      await loadStats();
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Withdraw failed");
    }
  };

  const claimStakingRewards = async () => {
    try {
      if (!account?.address) {
        setStatus("Connect wallet first");
        return;
      }

      const tx = prepareContractCall({
        contract: stakingContract,
        method: "function getRewardSafe()",
        params: [],
      });

      await sendTransaction({ transaction: tx, account });

      setStatus("Rewards claimed successfully");
      await loadStats();
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Claim rewards failed");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.badgeRow}>
          <span style={styles.flagBadge}>🇱🇧 LBPC</span>
          <span style={styles.arcBadge}>{selectedChain.name}</span>
          <span style={styles.futureBadge}>Ethereum Mainnet + XRPL Planned</span>
        </div>

        <div style={styles.header}>
          <div style={styles.brandSection}>
            <Image
              src="/lbp-logov2.png"
              alt="LBPC Logo"
              width={82}
              height={82}
              style={styles.logo}
              priority
            />

            <div>
              <h1 style={styles.title}>LBPC Marketplace & Staking</h1>
              <p style={styles.subtitle}>
                Claim, stake, and use LBPC across supported networks. Currently
                live on Arc Testnet and Ethereum Sepolia, with Ethereum mainnet
                and XRPL expansion planned.
              </p>
            </div>
          </div>

          <ConnectButton client={client} chain={selectedChain.chain} />
        </div>

        <div style={styles.selectorBox}>
          <label style={styles.label}>Select Network</label>
          <select
            value={selectedChainKey}
            onChange={(e) => setSelectedChainKey(e.target.value as ChainKey)}
            style={styles.input}
          >
            <option value="arc">Arc Testnet</option>
            <option value="sepolia">Ethereum Sepolia</option>
          </select>
        </div>

        <div style={styles.tabs}>
          {(["about", "claim", "stake", "marketplace"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? styles.activeTab : styles.tab}
            >
              {tab === "about"
                ? "About"
                : tab === "claim"
                ? "Claim LBPC"
                : tab === "stake"
                ? "Stake LBPC"
                : "Marketplace"}
            </button>
          ))}
        </div>
      </section>

      <div style={styles.infoBox}>
        <p style={styles.wallet}>Wallet: {account?.address || "Not connected"}</p>
        <p style={styles.wallet}>Current Network: {selectedChain.name}</p>
        {status && <p style={styles.status}>{status}</p>}
      </div>

      <section style={styles.tokenomicsSection}>
        <h2 style={styles.sectionTitle}>Live Protocol Stats</h2>

        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <strong>Wallet Balance</strong>
            <span>{stats.walletBalance} LBPC</span>
          </div>

          <div style={styles.statCard}>
            <strong>Total Supply</strong>
            <span>{stats.totalSupply} LBPC</span>
          </div>

          <div style={styles.statCard}>
            <strong>Total Staked</strong>
            <span>{stats.totalStaked} LBPC</span>
          </div>

          <div style={styles.statCard}>
            <strong>My Staked</strong>
            <span>{stats.myStaked} LBPC</span>
          </div>

          <div style={styles.statCard}>
            <strong>Pending Rewards</strong>
            <span>{stats.pendingRewards} LBPC</span>
          </div>

          <div style={styles.statCard}>
            <strong>Target APY</strong>
            <span>{stats.apy}</span>
          </div>
        </div>

        <button onClick={loadStats} style={styles.secondaryButton}>
          Refresh Stats
        </button>
      </section>

      {activeTab === "about" && (
        <>
          <section style={styles.aboutSection}>
            <h2 style={styles.sectionTitle}>About LBPC</h2>
            <p style={styles.aboutText}>
              LBPC is a community digital asset built for marketplace utility,
              staking rewards, and future cross-chain expansion.
            </p>
            <p style={styles.aboutText}>
              The project is currently active on Arc Testnet and Ethereum
              Sepolia. The roadmap includes Ethereum mainnet and XRPL.
            </p>
          </section>

          <section style={styles.roadmapSection}>
            <h2 style={styles.sectionTitle}>Roadmap</h2>

            <div style={styles.roadmapGrid}>
              <div style={styles.roadmapCard}>
                <h3>✓ Arc Testnet</h3>
                <p>LBPC token, staking, and marketplace testing.</p>
              </div>

              <div style={styles.roadmapCard}>
                <h3>✓ Ethereum Sepolia</h3>
                <p>Ethereum test deployment and staking verification.</p>
              </div>

              <div style={styles.roadmapCard}>
                <h3>Next: Ethereum Mainnet</h3>
                <p>Mainnet ERC20 deployment after testing.</p>
              </div>

              <div style={styles.roadmapCard}>
                <h3>Future: XRPL</h3>
                <p>Native XRPL token issuance and ecosystem expansion.</p>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "claim" && (
        <section style={styles.coinSection}>
          <h2 style={styles.sectionTitle}>Claim LBPC</h2>
          <p style={styles.coinText}>
            Claim 1,000 LBPC on the selected network if claim conditions are active.
          </p>

          <ClaimButton
            client={client}
            chain={selectedChain.chain}
            contractAddress={selectedChain.tokenAddress}
            claimParams={{
              type: "ERC20",
              quantityInWei: ONE_THOUSAND_LBPC_WEI,
            }}
            onTransactionSent={() => setStatus("Claiming LBPC...")}
            onTransactionConfirmed={async () => {
              setStatus("LBPC claimed successfully");
              await loadStats();
            }}
            onError={(err) => setStatus(err?.message || "LBPC claim failed")}
            style={styles.coinButton}
          >
            Claim 1,000 LBPC
          </ClaimButton>
        </section>
      )}

      {activeTab === "stake" && (
        <section style={styles.coinSection}>
          <h2 style={styles.sectionTitle}>Stake LBPC</h2>

          <p style={styles.coinText}>
            Stake LBPC to earn reward emissions. Rewards depend on funding in
            the selected staking contract.
          </p>

          <div style={styles.formBox}>
            <h3>Stake</h3>
            <input
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Amount of LBPC to stake"
              style={styles.input}
            />
            <button onClick={stakeLBPC} style={styles.coinButton}>
              Approve + Stake
            </button>
          </div>

          <div style={styles.formBox}>
            <h3>Withdraw</h3>
            <input
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount of LBPC to withdraw"
              style={styles.input}
            />
            <button onClick={withdrawLBPC} style={styles.secondaryButton}>
              Withdraw
            </button>
          </div>

          <button onClick={claimStakingRewards} style={styles.rewardButton}>
            Claim Staking Rewards
          </button>
        </section>
      )}

      {activeTab === "marketplace" && (
        <section style={styles.categorySection}>
          <h2 style={styles.sectionTitle}>Marketplace</h2>
          <p style={styles.categoryDescription}>
            Use LBPC to mint digital collectibles. More collections are planned.
          </p>

          <div style={styles.grid}>
            {CHURCHES.map((church) => (
              <div key={church.id} style={styles.card}>
                <div style={styles.imagePlaceholder}>✝️</div>
                <h3 style={styles.cardTitle}>{church.name}</h3>
                <p style={styles.cardDescription}>{church.description}</p>

                <ClaimButton
                  client={client}
                  chain={selectedChain.chain}
                  contractAddress={CHURCH_NFT_ADDRESS}
                  claimParams={{
                    type: "ERC721",
                    quantity: BigInt(1),
                  }}
                  onTransactionSent={() => setStatus(`Minting ${church.name}...`)}
                  onTransactionConfirmed={() =>
                    setStatus(`${church.name} minted successfully`)
                  }
                  onError={(err) => setStatus(err?.message || "NFT mint failed")}
                  style={styles.button}
                >
                  Mint with LBPC
                </ClaimButton>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={styles.contractSection}>
        <h2 style={styles.sectionTitle}>Official Contracts</h2>

        <div style={styles.contractGrid}>
          <a
            style={styles.contractCard}
            href={`${selectedChain.explorer}${selectedChain.tokenAddress}`}
            target="_blank"
            rel="noreferrer"
          >
            <strong>LBPC Token Contract</strong>
            <span>{selectedChain.tokenAddress}</span>
          </a>

          <a
            style={styles.contractCard}
            href={`${selectedChain.explorer}${selectedChain.stakingAddress}`}
            target="_blank"
            rel="noreferrer"
          >
            <strong>LBPC Staking Contract</strong>
            <span>{selectedChain.stakingAddress}</span>
          </a>
        </div>
      </section>

      <section style={styles.contactSection}>
        <h2 style={styles.sectionTitle}>Contact Us</h2>
        <p style={styles.contactText}>
          For partnerships, marketplace listings, token inquiries, or business
          opportunities, contact the LBPC team.
        </p>
        <a style={styles.emailButton} href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </section>

      <footer style={styles.footer}>
        <p>🇱🇧 LBPC Marketplace & Staking</p>
        <p style={styles.disclaimer}>
          LBPC is experimental. Not affiliated with the Central Bank of Lebanon
          or the official Lebanese Pound currency.
        </p>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, background: "linear-gradient(180deg, #050505 0%, #101010 100%)", color: "white", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
  hero: { border: "1px solid #222", background: "linear-gradient(135deg, #111 0%, #171717 55%, #0b2a1a 100%)", borderRadius: 20, padding: 26, marginBottom: 24 },
  badgeRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 },
  flagBadge: { background: "#1a1a1a", border: "1px solid #333", padding: "8px 12px", borderRadius: 999, fontWeight: "bold" },
  arcBadge: { background: "#111827", border: "1px solid #2563eb", color: "#93c5fd", padding: "8px 12px", borderRadius: 999, fontWeight: "bold" },
  futureBadge: { background: "#111", border: "1px solid #7c3aed", color: "#c4b5fd", padding: "8px 12px", borderRadius: 999, fontWeight: "bold" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 22, flexWrap: "wrap" },
  brandSection: { display: "flex", alignItems: "center", gap: 16 },
  logo: { borderRadius: "50%", border: "2px solid #333", background: "#111" },
  title: { margin: 0, fontSize: 40, lineHeight: 1.08 },
  subtitle: { marginTop: 10, opacity: 0.82, maxWidth: 780, lineHeight: 1.5 },
  selectorBox: { marginTop: 22 },
  label: { display: "block", marginBottom: 8, opacity: 0.75 },
  tabs: { display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" },
  tab: { padding: "10px 15px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "white", cursor: "pointer", fontWeight: "bold" },
  activeTab: { padding: "10px 15px", borderRadius: 10, border: "1px solid #16a34a", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: "bold" },
  infoBox: { border: "1px solid #222", background: "#111", borderRadius: 14, padding: 14, marginBottom: 24 },
  wallet: { opacity: 0.75, margin: 0, wordBreak: "break-all" },
  status: { color: "#7dd3fc", marginTop: 10, marginBottom: 0 },
  coinSection: { border: "1px solid #333", background: "#111", borderRadius: 16, padding: 22, marginBottom: 28 },
  aboutSection: { border: "1px solid #222", background: "#0f0f0f", borderRadius: 16, padding: 22, marginBottom: 32 },
  tokenomicsSection: { border: "1px solid #222", background: "#0f0f0f", borderRadius: 16, padding: 22, marginBottom: 32 },
  roadmapSection: { border: "1px solid #222", background: "#0f0f0f", borderRadius: 16, padding: 22, marginBottom: 32 },
  roadmapGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  roadmapCard: { border: "1px solid #333", background: "#151515", borderRadius: 12, padding: 16 },
  sectionTitle: { marginBottom: 10 },
  coinText: { opacity: 0.75, marginBottom: 16 },
  aboutText: { opacity: 0.8, lineHeight: 1.65, maxWidth: 920 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18, marginBottom: 18 },
  statCard: { border: "1px solid #2a2a2a", background: "#151515", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 6 },
  input: { width: "100%", maxWidth: 380, padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#151515", color: "white", marginBottom: 12, display: "block" },
  formBox: { border: "1px solid #2a2a2a", background: "#151515", borderRadius: 12, padding: 16, marginTop: 18 },
  coinButton: { padding: "12px 15px", background: "#16a34a", border: "none", color: "white", borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  secondaryButton: { padding: "12px 15px", background: "#334155", border: "none", color: "white", borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  rewardButton: { padding: "12px 15px", background: "#7c3aed", border: "none", color: "white", borderRadius: 10, fontWeight: "bold", cursor: "pointer", marginTop: 12 },
  categorySection: { marginBottom: 36 },
  categoryDescription: { opacity: 0.72, marginBottom: 16, maxWidth: 900, lineHeight: 1.5 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
  card: { border: "1px solid #333", padding: 16, borderRadius: 14, background: "#111" },
  imagePlaceholder: { height: 140, borderRadius: 12, background: "#181818", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, marginBottom: 12 },
  cardTitle: { margin: "0 0 6px 0" },
  cardDescription: { opacity: 0.7, margin: "0 0 12px 0" },
  button: { width: "100%", marginTop: 10, padding: "10px 12px", background: "#2563eb", border: "none", color: "white", borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  contractSection: { border: "1px solid #222", background: "#0f0f0f", borderRadius: 16, padding: 22, marginBottom: 32 },
  contractGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 },
  contractCard: { border: "1px solid #333", background: "#151515", borderRadius: 12, padding: 14, color: "white", textDecoration: "none", display: "flex", flexDirection: "column", gap: 8, overflowWrap: "break-word" },
  contactSection: { border: "1px solid #333", background: "#111", borderRadius: 16, padding: 22, marginTop: 32 },
  contactText: { opacity: 0.75, marginBottom: 14, lineHeight: 1.5 },
  emailButton: { display: "inline-block", padding: "11px 14px", background: "#991b1b", color: "white", borderRadius: 10, textDecoration: "none", fontWeight: "bold" },
  footer: { marginTop: 28, paddingTop: 18, borderTop: "1px solid #222", opacity: 0.75, lineHeight: 1.5 },
  disclaimer: { fontSize: 13, opacity: 0.65, maxWidth: 900 },
};