// import { MdKeyOff } from "react-icons/md";
import { LucideWallet } from "lucide-react";
import { useConnectWallet } from "../../hooks/useConnectWallet";
import { FaPowerOff } from "react-icons/fa";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { address, disconnect, connect, isConnecting } = useConnectWallet();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="mx-auto flex items-center justify-between py-4 px-4 md:px-8 max-w-[1500px]">
        {/* Left: Title */}
        <p className="hidden uppercase md:block text-lg md:text-2xl font-bold text-white">
          {title ? `${title}` : "Delegation Checker"}
        </p>
        <p className="md:hidden uppercase text-lg md:text-2xl font-bold text-white">
          {"Checker"}
        </p>

        {/* Right: Wallet connect */}
        <div className="flex items-center space-x-3">
          {address ? (
            <div className="flex items-center gap-2">
              <p className="border border-pink-500/50 text-xs md:text-sm px-2 py-1 rounded-full text-white bg-pink-500/10">
                {address.slice(0, 4)}...{address.slice(-4)}
              </p>
              <button
                onClick={disconnect}
                disabled={isConnecting}
                className="bg-pink-600 px-2 py-1 pb-1.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-1 hover:scale-105 transition"
              >
                <FaPowerOff />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="bg-white text-black md:px-5 md:py-2 rounded-full font-semibold md:text-sm hover:scale-105 transition flex items-center gap-2 px-3 py-1 text-xs"
            >
              <LucideWallet size={16} />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
