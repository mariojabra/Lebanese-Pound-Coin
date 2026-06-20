"use client";

import { useState } from "react";
import Image from "next/image";
import { ConnectButton, ClaimButton, useActiveAccount } from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: "b00ba2253c78cfcb0dade8473d97b262",
});

const arcTestnet = defineChain(5042002);

const LBP_COIN_ADDRESS = "0x900AfE961d723c8159841530Cf794030E2A6Ff62";
const CHURCH_NFT_ADDRESS = "0xb3A3d9F98CC050D56f4325C86A46152fba6f599f";
const LBPC_STAKING_ADDRESS = "0x580f176386994b5243fFB184aE2d88784949427C";
const CONTACT_EMAIL = "management@lbpcoin.com";

const ONE_THOUSAND_LBP_WEI = BigInt(1000) * BigInt(10) ** BigInt(18);

const lbpcTokenContract = getContract({
  client,
  chain: arcTestnet,
  address: LBP_COIN_ADDRESS,
});

const stakingContract = getContract({
  client,
  chain: arcTestnet,
  address: LBPC_STAKING_ADDRESS,
});

const CHURCHES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  name: `Church ${i + 1}`,
  description: `Catholic Church collectible #${i + 1}`,
}));

export default function Page() {
  const account = useActiveAccount();
  const [status, setStatus] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<
    "about" | "claim" | "stake" | "marketplace"
  >("about");

  const toWei = (amount: string) => {
    const clean = amount.trim();
    if (!clean || Number(clean) <= 0) return BigInt(0);

    const [whole, decimal = ""] = clean.split(".");
    const paddedDecimal = decimal.padEnd(18, "0").slice(0, 18);

    return BigInt(whole || "0") * BigInt(10) ** BigInt(18) + BigInt(paddedDecimal);
  };

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

      setStatus("Approving LBPC for staking...");

      const approveTx = prepareContractCall({
        contract: lbpcTokenContract,
        method: "function approve(address spender, uint256 amount)",
        params: [LBPC_STAKING_ADDRESS, amountWei],
      });

      await sendTransaction({
        transaction: approveTx,
        account,
      });

      setStatus("Staking LBPC...");

      const stakeTx = prepareContractCall({
        contract: stakingContract,
        method: "function stake(uint256 amount)",
        params: [amountWei],
      });

      await sendTransaction({
        transaction: stakeTx,
        account,
      });

      setStatus(`Successfully staked ${stakeAmount} LBPC`);
      setStakeAmount("");
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

      setStatus("Withdrawing LBPC...");

      const tx = prepareContractCall({
        contract: stakingContract,
        method: "function withdraw(uint256 amount)",
        params: [amountWei],
      });

      await sendTransaction({
        transaction: tx,
        account,
      });

      setStatus(`Successfully withdrew ${withdrawAmount} LBPC`);
      setWithdrawAmount("");
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

      setStatus("Claiming staking rewards...");

      const tx = prepareContractCall({
        contract: stakingContract,
        method: "function getRewardSafe()",
        params: [],
      });

      await sendTransaction({
        transaction: tx,
        account,
      });

      setStatus("Staking rewards claimed successfully");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Claim rewards failed");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.badgeRow}>
          <span style={styles.flagBadge}>🇱🇧 Lebanese Pound Coin</span>
          <span style={styles.arcBadge}>Arc Network</span>
          <span style={styles.testnetBadge}>Testnet Marketplace</span>
        </div>

        <div style={styles.header}>
          <div style={styles.brandSection}>
            <Image
              src="/lbp-logov2.png"
              alt="LBP Coin Logo"
              width={82}
              height={82}
              style={styles.logo}
              priority
            />

            <div>
              <h1 style={styles.title}>LBP Coin on Arc Network Marketplace</h1>
              <p style={styles.subtitle}>
                Claim LBP, stake LBPC, and use it to mint NFTs and digital
                collectibles on Arc Network.
              </p>
            </div>
          </div>

          <ConnectButton client={client} chain={arcTestnet} />
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
                ? "Claim LBP"
                : tab === "stake"
                ? "Stake LBPC"
                : "Marketplace"}
            </button>
          ))}
        </div>
      </section>

      <div style={styles.infoBox}>
        <p style={styles.wallet}>
          Wallet: {account?.address || "Not connected"}
        </p>
        {status && <p style={styles.status}>{status}</p>}
      </div>

      {activeTab === "about" && (
        <>
          <section style={styles.aboutSection}>
            <h2 style={styles.sectionTitle}>About LBP Coin</h2>
            <p style={styles.aboutText}>
              Lebanese Pound Coin is a community digital asset built on Arc
              Network. Users can claim LBP, stake LBPC for testnet reward
              emissions, and use LBP inside the marketplace to mint NFTs and
              future digital collectibles.
            </p>
          </section>

          <section style={styles.tokenomicsSection}>
            <h2 style={styles.sectionTitle}>Tokenomics</h2>

            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <strong>Token Name</strong>
                <span>Lebanese Pound Coin</span>
              </div>

              <div style={styles.statCard}>
                <strong>Symbol</strong>
                <span>LBP / LBPC</span>
              </div>

              <div style={styles.statCard}>
                <strong>Network</strong>
                <span>Arc Testnet</span>
              </div>

              <div style={styles.statCard}>
                <strong>Decimals</strong>
                <span>18</span>
              </div>

              <div style={styles.statCard}>
                <strong>Daily Claim</strong>
                <span>1,000 LBP / wallet / 24h</span>
              </div>

              <div style={styles.statCard}>
                <strong>Staking Target</strong>
                <span>USDC-style benchmark APY</span>
              </div>
            </div>
          </section>

          <section style={styles.roadmapSection}>
            <h2 style={styles.sectionTitle}>Roadmap</h2>

            <div style={styles.roadmapGrid}>
              <div style={styles.roadmapCard}>
                <h3>Phase 1</h3>
                <p>Launch LBP Coin on Arc Network.</p>
              </div>

              <div style={styles.roadmapCard}>
                <h3>Phase 2</h3>
                <p>Launch marketplace minting with LBP.</p>
              </div>

              <div style={styles.roadmapCard}>
                <h3>Phase 3</h3>
                <p>Launch LBPC staking reward emissions.</p>
              </div>

              <div style={styles.roadmapCard}>
                <h3>Phase 4</h3>
                <p>Expand into Lebanese heritage and creator collections.</p>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "claim" && (
        <section style={styles.coinSection}>
          <div style={styles.coinHeader}>
            <Image
              src="/lbp-logov2.png"
              alt="Lebanese Pound Coin"
              width={54}
              height={54}
              style={styles.smallLogo}
            />

            <div>
              <h2 style={styles.sectionTitle}>Claim Lebanese Pound Coin</h2>
              <p style={styles.coinText}>
                Claim 1,000 LBP once every 24 hours. LBP can be used inside the
                marketplace to mint community assets.
              </p>
            </div>
          </div>

          <ClaimButton
            client={client}
            chain={arcTestnet}
            contractAddress={LBP_COIN_ADDRESS}
            claimParams={{
              type: "ERC20",
              quantityInWei: ONE_THOUSAND_LBP_WEI,
            }}
            onTransactionSent={() =>
              setStatus("Claiming LBP. Waiting for confirmation...")
            }
            onTransactionConfirmed={() => setStatus("LBP claimed successfully")}
            onError={(err) => setStatus(err?.message || "LBP claim failed")}
            style={styles.coinButton}
          >
            Claim 1,000 LBP
          </ClaimButton>
        </section>
      )}

      {activeTab === "stake" && (
        <section style={styles.coinSection}>
          <h2 style={styles.sectionTitle}>Stake LBPC</h2>

          <p style={styles.coinText}>
            Stake LBPC to earn testnet reward emissions designed to track a
            USDC-style benchmark yield. Rewards depend on available funding in
            the staking contract.
          </p>

          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <strong>Target APY</strong>
              <span>5.00%</span>
            </div>

            <div style={styles.statCard}>
              <strong>Staking Contract</strong>
              <span style={styles.breakText}>{LBPC_STAKING_ADDRESS}</span>
            </div>

            <div style={styles.statCard}>
              <strong>Reward Token</strong>
              <span>LBPC</span>
            </div>
          </div>

          <div style={styles.formBox}>
            <h3>Stake</h3>

            <input
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Amount of LBPC to stake"
              style={styles.input}
            />

            <button onClick={stakeLBPC} style={styles.coinButton}>
              Approve + Stake LBPC
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
              Withdraw LBPC
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
            Use LBP to mint digital collectibles. More categories are planned,
            including Lebanese heritage, cities, cedar collections, cuisine, and
            creator assets.
          </p>

          <h3 style={styles.collectionTitle}>Catholic Church NFTs</h3>

          <div style={styles.grid}>
            {CHURCHES.map((church) => (
              <div key={church.id} style={styles.card}>
                <div style={styles.imagePlaceholder}>✝️</div>
                <h3 style={styles.cardTitle}>{church.name}</h3>
                <p style={styles.cardDescription}>{church.description}</p>

                <ClaimButton
                  client={client}
                  chain={arcTestnet}
                  contractAddress={CHURCH_NFT_ADDRESS}
                  claimParams={{
                    type: "ERC721",
                    quantity: BigInt(1),
                  }}
                  onTransactionSent={() =>
                    setStatus(`Minting ${church.name}...`)
                  }
                  onTransactionConfirmed={() =>
                    setStatus(`${church.name} minted successfully`)
                  }
                  onError={(err) => setStatus(err?.message || "NFT mint failed")}
                  style={styles.button}
                >
                  Mint with LBP
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
            href={`https://testnet.arcscan.app/address/${LBP_COIN_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            <strong>LBP Coin Contract</strong>
            <span>{LBP_COIN_ADDRESS}</span>
          </a>

          <a
            style={styles.contractCard}
            href={`https://testnet.arcscan.app/address/${LBPC_STAKING_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            <strong>LBPC Staking Contract</strong>
            <span>{LBPC_STAKING_ADDRESS}</span>
          </a>

          <a
            style={styles.contractCard}
            href={`https://testnet.arcscan.app/address/${CHURCH_NFT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            <strong>Marketplace NFT Contract</strong>
            <span>{CHURCH_NFT_ADDRESS}</span>
          </a>
        </div>
      </section>

      <section style={styles.contactSection}>
        <h2 style={styles.sectionTitle}>Contact Us</h2>

        <p style={styles.contactText}>
          For partnerships, marketplace listings, token inquiries, business
          opportunities, or community questions, contact the LBP Coin team.
        </p>

        <a style={styles.emailButton} href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </section>

      <footer style={styles.footer}>
        <p>🇱🇧 LBP Coin on Arc Network Marketplace</p>
        <p>Contact: {CONTACT_EMAIL}</p>
        <p style={styles.disclaimer}>
          Lebanese Pound Coin is a community digital asset operating on Arc
          Network. This project is experimental and is not affiliated with the
          Central Bank of Lebanon or the official Lebanese Pound currency.
        </p>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 24,
    background: "linear-gradient(180deg, #050505 0%, #101010 100%)",
    color: "white",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    border: "1px solid #222",
    background: "linear-gradient(135deg, #111 0%, #171717 55%, #0b2a1a 100%)",
    borderRadius: 20,
    padding: 26,
    marginBottom: 24,
  },
  badgeRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  flagBadge: {
    background: "#1a1a1a",
    border: "1px solid #333",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: "bold",
  },
  arcBadge: {
    background: "#111827",
    border: "1px solid #2563eb",
    color: "#93c5fd",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: "bold",
  },
  testnetBadge: {
    background: "#1f1308",
    border: "1px solid #f59e0b",
    color: "#fcd34d",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: "bold",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 22,
    flexWrap: "wrap",
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  logo: {
    borderRadius: "50%",
    border: "2px solid #333",
    background: "#111",
  },
  smallLogo: {
    borderRadius: "50%",
    border: "1px solid #333",
    background: "#111",
  },
  title: {
    margin: 0,
    fontSize: 40,
    lineHeight: 1.08,
  },
  subtitle: {
    marginTop: 10,
    opacity: 0.82,
    maxWidth: 780,
    lineHeight: 1.5,
  },
  tabs: {
    display: "flex",
    gap: 10,
    marginTop: 24,
    flexWrap: "wrap",
  },
  tab: {
    padding: "10px 15px",
    borderRadius: 10,
    border: "1px solid #333",
    background: "#111",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  activeTab: {
    padding: "10px 15px",
    borderRadius: 10,
    border: "1px solid #16a34a",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  infoBox: {
    border: "1px solid #222",
    background: "#111",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  wallet: {
    opacity: 0.75,
    margin: 0,
    wordBreak: "break-all",
  },
  status: {
    color: "#7dd3fc",
    marginTop: 10,
    marginBottom: 0,
  },
  coinSection: {
    border: "1px solid #333",
    background: "#111",
    borderRadius: 16,
    padding: 22,
    marginBottom: 28,
  },
  coinHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  aboutSection: {
    border: "1px solid #222",
    background: "#0f0f0f",
    borderRadius: 16,
    padding: 22,
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  collectionTitle: {
    marginTop: 20,
    marginBottom: 14,
  },
  coinText: {
    opacity: 0.75,
    marginBottom: 16,
  },
  aboutText: {
    opacity: 0.8,
    lineHeight: 1.65,
    maxWidth: 920,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  statCard: {
    border: "1px solid #2a2a2a",
    background: "#151515",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  coinButton: {
    padding: "12px 15px",
    background: "#16a34a",
    border: "none",
    color: "white",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 15px",
    background: "#334155",
    border: "none",
    color: "white",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  rewardButton: {
    padding: "12px 15px",
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 12,
  },
  input: {
    width: "100%",
    maxWidth: 380,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #333",
    background: "#151515",
    color: "white",
    marginBottom: 12,
    display: "block",
  },
  formBox: {
    border: "1px solid #2a2a2a",
    background: "#151515",
    borderRadius: 12,
    padding: 16,
    marginTop: 18,
  },
  tokenomicsSection: {
    border: "1px solid #222",
    background: "#0f0f0f",
    borderRadius: 16,
    padding: 22,
    marginBottom: 32,
  },
  roadmapSection: {
    border: "1px solid #222",
    background: "#0f0f0f",
    borderRadius: 16,
    padding: 22,
    marginBottom: 32,
  },
  roadmapGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  roadmapCard: {
    border: "1px solid #333",
    background: "#151515",
    borderRadius: 12,
    padding: 16,
  },
  categorySection: {
    marginBottom: 36,
  },
  categoryDescription: {
    opacity: 0.72,
    marginBottom: 16,
    maxWidth: 900,
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  card: {
    border: "1px solid #333",
    padding: 16,
    borderRadius: 14,
    background: "#111",
  },
  imagePlaceholder: {
    height: 140,
    borderRadius: 12,
    background: "#181818",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 42,
    marginBottom: 12,
  },
  cardTitle: {
    margin: "0 0 6px 0",
  },
  cardDescription: {
    opacity: 0.7,
    margin: "0 0 12px 0",
  },
  button: {
    width: "100%",
    marginTop: 10,
    padding: "10px 12px",
    background: "#2563eb",
    border: "none",
    color: "white",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  contractSection: {
    border: "1px solid #222",
    background: "#0f0f0f",
    borderRadius: 16,
    padding: 22,
    marginBottom: 32,
  },
  contractGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },
  contractCard: {
    border: "1px solid #333",
    background: "#151515",
    borderRadius: 12,
    padding: 14,
    color: "white",
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowWrap: "break-word",
  },
  contactSection: {
    border: "1px solid #333",
    background: "#111",
    borderRadius: 16,
    padding: 22,
    marginTop: 32,
  },
  contactText: {
    opacity: 0.75,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  emailButton: {
    display: "inline-block",
    padding: "11px 14px",
    background: "#991b1b",
    color: "white",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 28,
    paddingTop: 18,
    borderTop: "1px solid #222",
    opacity: 0.75,
    lineHeight: 1.5,
  },
  disclaimer: {
    fontSize: 13,
    opacity: 0.65,
    maxWidth: 900,
  },
  breakText: {
    overflowWrap: "break-word",
  },
};