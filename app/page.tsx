"use client";

import { useState } from "react";
import { ConnectButton, ClaimButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: "b00ba2253c78cfcb0dade8473d97b262",
});

const arcTestnet = defineChain(5042002);

const LBP_COIN_ADDRESS = "0x900AfE961d723c8159841530Cf794030E2A6Ff62";
const CHURCH_NFT_ADDRESS = "0xb3A3d9F98CC050D56f4325C86A46152fba6f599f";

const ONE_THOUSAND_LBP_WEI = BigInt(1000) * BigInt(10) ** BigInt(18);

const CATEGORIES = [
  {
    title: "Catholic Church NFTs",
    description: "Mint collectible Catholic Church NFTs using LBP Coin.",
    icon: "✝️",
    items: Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      name: `Church ${i + 1}`,
      description: `Catholic Church #${i + 1}`,
      contractAddress: CHURCH_NFT_ADDRESS,
      type: "ERC721" as const,
    })),
  },
];

export default function Page() {
  const account = useActiveAccount();
  const [status, setStatus] = useState("");

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.badgeRow}>
          <span style={styles.flagBadge}>🇱🇧 Lebanese Pound Coin</span>
          <span style={styles.arcBadge}>Arc Network</span>
        </div>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>LBP Coin on Arc Network Marketplace</h1>
            <p style={styles.subtitle}>
              A Lebanese-themed digital marketplace on Arc Network. Claim LBP
              every 24 hours and use it to mint NFTs, collectibles, and future
              community assets.
            </p>
          </div>

          <ConnectButton client={client} chain={arcTestnet} />
        </div>
      </section>

      <div style={styles.infoBox}>
        <p style={styles.wallet}>
          Wallet: {account?.address || "Not connected"}
        </p>

        {status && <p style={styles.status}>{status}</p>}
      </div>

      <section style={styles.coinSection}>
        <div>
          <h2 style={styles.sectionTitle}>🇱🇧 Lebanese Pound Coin</h2>
          <p style={styles.coinText}>
            Claim 1,000 LBP once every 24 hours. LBP is used inside this
            marketplace to mint community assets.
          </p>
        </div>

        <ClaimButton
          client={client}
          chain={arcTestnet}
          contractAddress={LBP_COIN_ADDRESS}
          claimParams={{
            type: "ERC20",
            quantityInWei: ONE_THOUSAND_LBP_WEI,
          }}
          onTransactionSent={() => {
            setStatus("Claiming LBP. Waiting for confirmation...");
          }}
          onTransactionConfirmed={() => {
            setStatus("LBP claimed successfully");
          }}
          onError={(err) => {
            setStatus(err?.message || "LBP claim failed");
          }}
          style={styles.coinButton}
        >
          Claim 1,000 LBP
        </ClaimButton>
      </section>

      <section style={styles.aboutSection}>
        <h2 style={styles.sectionTitle}>About the Marketplace</h2>
        <p style={styles.aboutText}>
          LBP Coin is a community token on Arc Network. This site is designed as
          a simple marketplace where users can collect LBP and spend it on
          digital assets, starting with Catholic Church NFTs and expanding into
          more Lebanese, cultural, and community categories.
        </p>

        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <strong>Network</strong>
            <span>Arc Testnet</span>
          </div>
          <div style={styles.statCard}>
            <strong>Token</strong>
            <span>Lebanese Pound Coin</span>
          </div>
          <div style={styles.statCard}>
            <strong>Claim</strong>
            <span>1,000 LBP / 24h</span>
          </div>
        </div>
      </section>

      {CATEGORIES.map((category) => (
        <section key={category.title} style={styles.categorySection}>
          <h2 style={styles.sectionTitle}>{category.title}</h2>
          <p style={styles.categoryDescription}>{category.description}</p>

          <div style={styles.grid}>
            {category.items.map((item) => (
              <div key={item.id} style={styles.card}>
                <div style={styles.imagePlaceholder}>{category.icon}</div>

                <h3 style={styles.cardTitle}>{item.name}</h3>
                <p style={styles.cardDescription}>{item.description}</p>

                <ClaimButton
                  client={client}
                  chain={arcTestnet}
                  contractAddress={item.contractAddress}
                  claimParams={{
                    type: item.type,
                    quantity: BigInt(1),
                  }}
                  onTransactionSent={() => {
                    setStatus(`Minting ${item.name}...`);
                  }}
                  onTransactionConfirmed={() => {
                    setStatus(`${item.name} minted successfully`);
                  }}
                  onError={(err) => {
                    setStatus(err?.message || "NFT mint failed");
                  }}
                  style={styles.button}
                >
                  Mint with LBP
                </ClaimButton>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section style={styles.contactSection}>
        <h2 style={styles.sectionTitle}>Contact Us</h2>
        <p style={styles.contactText}>
          For partnerships, marketplace listings, or community questions, contact
          the LBP Coin team.
        </p>

        <a style={styles.emailButton} href="mailto:mgjabra@gmail.com">
          mgjabra@gmail.com
        </a>
      </section>

      <footer style={styles.footer}>
        <p>🇱🇧 LBP Coin on Arc Network Marketplace</p>
        <p style={styles.disclaimer}>
          Testnet project. Tokens and NFTs are experimental digital assets.
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
    background: "linear-gradient(135deg, #111 0%, #171717 60%, #0b2a1a 100%)",
    borderRadius: 18,
    padding: 24,
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

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },

  title: {
    margin: 0,
    fontSize: 38,
    lineHeight: 1.1,
  },

  subtitle: {
    marginTop: 10,
    opacity: 0.8,
    maxWidth: 760,
    lineHeight: 1.5,
  },

  infoBox: {
    border: "1px solid #222",
    background: "#111",
    borderRadius: 12,
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
    padding: 20,
    marginBottom: 28,
  },

  aboutSection: {
    border: "1px solid #222",
    background: "#0f0f0f",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },

  sectionTitle: {
    marginBottom: 10,
  },

  coinText: {
    opacity: 0.75,
    marginBottom: 16,
  },

  aboutText: {
    opacity: 0.78,
    lineHeight: 1.6,
    maxWidth: 900,
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
    padding: "11px 14px",
    background: "#16a34a",
    border: "none",
    color: "white",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },

  categorySection: {
    marginBottom: 36,
  },

  categoryDescription: {
    opacity: 0.7,
    marginBottom: 16,
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
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },

  contactSection: {
    border: "1px solid #333",
    background: "#111",
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
  },

  contactText: {
    opacity: 0.75,
    marginBottom: 14,
  },

  emailButton: {
    display: "inline-block",
    padding: "11px 14px",
    background: "#991b1b",
    color: "white",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: "bold",
  },

  footer: {
    marginTop: 28,
    paddingTop: 18,
    borderTop: "1px solid #222",
    opacity: 0.75,
  },

  disclaimer: {
    fontSize: 13,
    opacity: 0.65,
  },
};