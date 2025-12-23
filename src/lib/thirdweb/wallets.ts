import { inAppWallet, createWallet } from "thirdweb/wallets";
import type { Chain } from "thirdweb/chains";

// Produce wallets lazily with a provided chain to avoid module-eval side effects on the server
export function getWallets(chain: Chain) {
  return [
    inAppWallet({
      auth: {
        options: [
          "x",
          "google",
          "apple",
          "facebook",
          "telegram",
          "email",
          "phone",
          "passkey",
          "tiktok",
        ],
      },
      executionMode: {
        mode: "EIP4337",
        smartAccount: {
          chain,
          sponsorGas: true,
        },
      },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
  ];
}
