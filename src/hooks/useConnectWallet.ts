import { useCallback, useRef } from "react";
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
  const { address, isConnecting: wagmiIsConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const error = null;

  // Track if user actually clicked "connect"
  const userInitiated = useRef(false);

  const connectWallet = useCallback(() => {
    userInitiated.current = true; // mark intent
    if (openConnectModal) openConnectModal();
  }, [openConnectModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    userInitiated.current = false;
  }, [disconnect]);

  const isConnecting = userInitiated.current && wagmiIsConnecting;

  return {
    address,
    connect: connectWallet,
    disconnect: disconnectWallet,
    isConnecting,
    error,
  };
}
