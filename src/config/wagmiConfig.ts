/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  ledgerWallet,
  injectedWallet,
  rainbowWallet,
  phantomWallet,
  okxWallet,
  safeWallet,
  argentWallet,
  rabbyWallet,
  safepalWallet,
  bestWallet,
  backpackWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http, createStorage, cookieStorage } from "wagmi";
import { mainnet, bsc, base, arbitrum, optimism } from "wagmi/chains";

export const projectId: string =
  import.meta.env.VITE_PROJECT_ID ?? "default_project_id";
export const appName: string = "Delegation Checker"; // Replace with your app name

export const chains: any = [mainnet, bsc, base, arbitrum, optimism];

export const config = getDefaultConfig({
  appName,
  projectId,
  chains,
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        trustWallet,
        safepalWallet,
        okxWallet,
        walletConnectWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: "Other Wallets",
      wallets: [
        backpackWallet,
        bestWallet,
        ledgerWallet,
        injectedWallet,
        safeWallet,
        argentWallet,
        rainbowWallet,
        phantomWallet,
      ],
    },
  ],
  transports: chains.reduce(
    (obj: any, chain: any) => ({ ...obj, [chain.id]: http() }),
    {}
  ),
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
