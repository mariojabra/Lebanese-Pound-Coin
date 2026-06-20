"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

const client = createThirdwebClient({
  clientId: "YOUR_CLIENT_ID",
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}