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
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>LBP Coin on Arc Network Marketplace</h1>
          <p style={styles.subtitle}>
            Claim Lebanese Pound Coin once every 24 hours and use LBP to mint
            NFTs and community assets on Arc Network.
          </p>
        </div>

        <ConnectButton client={client} chain={arcTestnet} />
      </div>

      <div style={styles.infoBox}>
        <p style={styles.wallet}>
          Wallet: {account?.address || "Not connected"}
        </p>

        {status && <p style={styles.status}>{status}</p>}
      </div>

      <section style={styles.coinSection}>
        <h2 style={styles.sectionTitle}>Lebanese Pound Coin</h2>

        <p style={styles.coinText}>
          Claim 1,000 LBP once every 24 hours. You can use LBP to mint items in
          this marketplace.
        </p>

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

      {CATEGORIES.map((category) => (
        <section key={category.title} style={styles.categorySection}>
          <h2 style={styles.sectionTitle}>{category.title}</h2>
          <p style={styles.categoryDescription}>{category.description}</p>

          <div style={styles.grid}>
            {category.items.map((item) => (
              <div key={item.id} style={styles.card}>
                <div style={styles.imagePlaceholder}>✝️</div>

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
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 24,
    background: "#0b0b0b",
    color: "white",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 24,
  },

  title: {
    margin: 0,
    fontSize: 34,
  },

  subtitle: {
    marginTop: 8,
    opacity: 0.75,
    maxWidth: 720,
    lineHeight: 1.5,
  },

  infoBox: {
    border: "1px solid #222",
    background: "#111",
    borderRadius: 10,
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
    borderRadius: 12,
    padding: 18,
    marginBottom: 32,
  },

  categorySection: {
    marginBottom: 36,
  },

  sectionTitle: {
    marginBottom: 10,
  },

  coinText: {
    opacity: 0.75,
    marginBottom: 14,
  },

  categoryDescription: {
    opacity: 0.7,
    marginBottom: 16,
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

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },

  card: {
    border: "1px solid #333",
    padding: 16,
    borderRadius: 12,
    background: "#111",
  },

  imagePlaceholder: {
    height: 140,
    borderRadius: 10,
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
};