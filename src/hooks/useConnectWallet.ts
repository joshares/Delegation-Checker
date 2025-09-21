import { useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface ConnectWalletResult {
  address: `0x${string}` | undefined;
  connect: () => void;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

export function useConnectWallet(): ConnectWalletResult {
  const {
    address,
    isConnecting: wagmiIsConnecting,
    isReconnecting,
  } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const error = null; // Simplify, add if needed

  const connectWallet = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const isConnecting = wagmiIsConnecting || isReconnecting;

  return {
    address,
    connect: connectWallet,
    disconnect: disconnectWallet,
    isConnecting,
    error,
  };
}
