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

<<<<<<< Updated upstream
/**
 * Restricted wallet configuration for private partner containers requiring approval.
 * Only allows email and phone authentication - no external wallets or social logins.
 * Used for SIGNUP flow on private partner containers.
 */
export function getPrivateWallets(chain: Chain) {
  return [
    inAppWallet({
      auth: {
        options: [
          "email",
          "phone",
        ],
=======
// Owner Mode restricted wallets - only email and phone for GeckoView compatibility
export function getOwnerModeWallets(chain: Chain) {
  return [
    inAppWallet({
      auth: {
        options: ["email", "phone"],
>>>>>>> Stashed changes
      },
      executionMode: {
        mode: "EIP4337",
        smartAccount: {
          chain,
          sponsorGas: true,
        },
      },
    }),
  ];
}

<<<<<<< Updated upstream
/**
 * Wallet configuration for LOGIN on private partner containers.
 * Allows email, phone, and external wallets (MetaMask, Coinbase, WalletConnect).
 * No social logins (Google, Apple, X, etc.)
 */
export function getPrivateLoginWallets(chain: Chain) {
  return [
    inAppWallet({
      auth: {
        options: [
          "email",
          "phone",
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
=======
>>>>>>> Stashed changes
