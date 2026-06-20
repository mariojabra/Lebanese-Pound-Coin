"use client";

import { useState } from "react";
import {
  ConnectButton,
  ClaimButton,
  useActiveAccount,
} from "thirdweb/react";
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

const churchNFTContract = getContract({
  client,
  chain: arcTestnet,
  address: "0xb3A3d9F98CC050D56f4325C86A46152fba6f599f",
});

const LEBANESE_POUND_COIN_ADDRESS =
  "0x900AfE961d723c8159841530Cf794030E2A6Ff62";

const CHURCHES = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  name: `Church ${i + 1}`,
  description: `Catholic Church #${i + 1}`,
}));

export default function Page() {
  const account = useActiveAccount();

  const [status, setStatus] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const mintNFT = async (churchId: number) => {
    try {
      if (!account?.address) {
        setStatus("Connect wallet first");
        return;
      }

      setLoadingId(churchId);
      setStatus(`Minting Church ${churchId + 1} NFT...`);

      const tx = prepareContractCall({
        contract: churchNFTContract,
        method: "function claimTo(address _to, uint256 _quantity)",
        params: [account.address, 1n],
      });

      await sendTransaction({
        transaction: tx,
        account,
      });

      setStatus(`Church ${churchId + 1} NFT mint successful`);
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "NFT mint failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Arc Catholic Church NFT</h1>
          <p style={styles.subtitle}>
            Mint a Catholic Church NFT and collect Lebanese Pound Coin on Arc
            Testnet
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
          There is available supply for visitors to collect Lebanese Pound Coin.
        </p>

<ClaimButton
  client={client}
  chain={arcTestnet}
  contractAddress={LEBANESE_POUND_COIN_ADDRESS}
  claimParams={{
    type: "ERC20",
    quantityInWei: 1000n * 10n ** 18n,
  }}
  onTransactionSent={() => {
    setStatus("Transaction sent. Waiting for confirmation...");
  }}
  onTransactionConfirmed={(receipt) => {
    console.log("Confirmed:", receipt);
    setStatus("Lebanese Pound Coin collected successfully");
  }}
  onError={(err) => {
    const message = err?.message || "";

    if (
      message.includes("User rejected") ||
      message.includes("rejected") ||
      message.includes("denied")
    ) {
      setStatus("Transaction was cancelled");
      return;
    }

    setStatus("Transaction submitted. Check MetaMask or your wallet activity.");
  }}
  style={styles.coinButton}
>
  Collect 1,000 Lebanese Pound Coin
</ClaimButton>
      </section>

      <h2 style={styles.sectionTitle}>Church Collection</h2>

      <div style={styles.grid}>
        {CHURCHES.map((church) => {
          const isLoading = loadingId === church.id;

          return (
            <div key={church.id} style={styles.card}>
              <div style={styles.imagePlaceholder}>✝️</div>

              <h3 style={styles.cardTitle}>{church.name}</h3>
              <p style={styles.cardDescription}>{church.description}</p>

              <button
                onClick={() => mintNFT(church.id)}
                disabled={loadingId !== null}
                style={{
                  ...styles.button,
                  opacity: loadingId !== null ? 0.6 : 1,
                  cursor: loadingId !== null ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Minting..." : `Mint ${church.name}`}
              </button>
            </div>
          );
        })}
      </div>
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
    fontSize: 32,
  },

  subtitle: {
    marginTop: 6,
    opacity: 0.75,
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
    marginBottom: 28,
  },

  sectionTitle: {
    marginBottom: 12,
  },

  coinText: {
    opacity: 0.75,
    marginBottom: 14,
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
  },
};