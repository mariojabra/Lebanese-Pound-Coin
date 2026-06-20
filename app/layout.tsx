import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LBP Coin on Arc Network Marketplace",
  description:
    "Claim Lebanese Pound Coin on Arc Network and use LBP to mint NFTs and community assets.",
  icons: {
    icon: "/lbp-logov2.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}