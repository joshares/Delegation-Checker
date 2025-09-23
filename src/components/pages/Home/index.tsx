// Home.tsx
import { useState, useEffect } from "react";
import { useWalletClient, useSwitchChain } from "wagmi";
import { toast } from "react-toastify";
import { parseEther, zeroAddress } from "viem";
import { LucideSearch, LucideAlertCircle } from "lucide-react";
import { useConnectWallet } from "../../../hooks/useConnectWallet";
import Header from "../../Header";
import { createPublicClient, http } from "viem";
import { mainnet, optimism, arbitrum, base, polygon } from "viem/chains";
import UndelegateModal from "../../Modal/UndelegateModal";
import Footer from "../../Footer";

const supportedChains = [
  {
    id: 1,
    name: "Ethereum",
    explorer: "https://etherscan.io",
    viemChain: mainnet,
  },
  {
    id: 10,
    name: "Optimism",
    explorer: "https://optimistic.etherscan.io",
    viemChain: optimism,
  },
  {
    id: 42161,
    name: "Arbitrum",
    explorer: "https://arbiscan.io",
    viemChain: arbitrum,
  },
  { id: 8453, name: "Base", explorer: "https://basescan.org", viemChain: base },
  {
    id: 137,
    name: "Polygon",
    explorer: "https://polygonscan.com",
    viemChain: polygon,
  },
];

export default function Home() {
  const { address: connectedAddress, connect } = useConnectWallet();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const [walletAddress, setWalletAddress] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [results, setResults] = useState<
    {
      chain: string;
      chainId: number;
      explorer: string;
      wallet: string;
      status: string;
      delegatedTo: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [undelegateLoadings, setUndelegateLoadings] = useState<{
    [chainId: number]: boolean;
  }>({});

  useEffect(() => {
    if (connectedAddress) {
      setWalletAddress(connectedAddress);
      checkDelegation(connectedAddress);
    }
  }, [connectedAddress]);

  const checkDelegation = async (addr: string) => {
    if (!addr) return;

    setLoading(true);
    const newResults = [];

    for (const chain of supportedChains) {
      try {
        const client = createPublicClient({
          chain: chain.viemChain,
          transport: http(),
        });

        const bytecode = await client.getCode({
          address: addr as `0x${string}`,
        });

        let status = "Not Delegated";
        let delegatedTo = "N/A";

        if (bytecode && bytecode !== "0x") {
          status = "Delegated";

          const lowerBytecode = bytecode.toLowerCase();
          if (lowerBytecode.startsWith("0xef0100")) {
            delegatedTo = `0x${lowerBytecode.slice(-40)}`;
          } else {
            const slot =
              "0x360894a13ba1a3210667c828492cd3d7be7c58f21b2a9e4d6f20fb5b8a9c18d0" as const;
            const storage = await client.getStorageAt({
              address: addr as `0x${string}`,
              slot,
            });

            if (
              storage &&
              storage !==
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            ) {
              delegatedTo = `0x${storage.slice(-40)}`;
            } else {
              delegatedTo = "Unknown";
            }
          }
        }

        newResults.push({
          chain: chain.name,
          chainId: chain.id,
          explorer: chain.explorer,
          wallet: addr,
          status,
          delegatedTo,
        });
      } catch (error) {
        console.error(`Error checking on ${chain.name}:`, error);
        newResults.push({
          chain: chain.name,
          chainId: chain.id,
          explorer: chain.explorer,
          wallet: addr,
          status: "Error",
          delegatedTo: "N/A",
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  const handleUndelegate = async (targetChainId: number) => {
    if (
      !walletClient ||
      !connectedAddress ||
      connectedAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      toast.error("Connect the wallet you want to undelegate");
      connect();
      return;
    }

    const resultForChain = results.find((r) => r.chainId === targetChainId);
    if (!resultForChain || resultForChain.status !== "Delegated") {
      toast.error("Wallet is not delegated on this chain");
      return;
    }

    setUndelegateLoadings((prev) => ({ ...prev, [targetChainId]: true }));

    try {
      const currentChainId = walletClient.chain?.id;
      if (currentChainId !== targetChainId) {
        await switchChainAsync({ chainId: targetChainId });
      }

      const chainConfig = supportedChains.find((c) => c.id === targetChainId);
      if (!chainConfig) {
        throw new Error("Chain configuration not found");
      }

      const publicClient = createPublicClient({
        chain: chainConfig.viemChain,
        transport: http(),
      });

      const nonce = await publicClient.getTransactionCount({
        address: connectedAddress,
        blockTag: "latest",
      });

      const chainId = targetChainId;

      const signedAuth = await walletClient.signAuthorization({
        account: connectedAddress,
        address: zeroAddress,
        chainId: chainId,
        nonce: nonce,
      });

      const authorization = {
        chainId: signedAuth.chainId,
        address: signedAuth.address,
        nonce: signedAuth.nonce,
        yParity: signedAuth.yParity,
        r: signedAuth.r,
        s: signedAuth.s,
      };

      const tx = {
        type: "eip7702" as const,
        chainId,
        to: zeroAddress,
        value: 0n,
        data: "0x" as `0x${string}`,
        gas: 100000n,
        authorizationList: [authorization],
      };

      const gasEstimate = await publicClient.estimateGas({
        ...tx,
        account: connectedAddress,
      });

      const feeData = await publicClient.estimateFeesPerGas();

      const fullTx = {
        ...tx,
        gas: gasEstimate,
        maxFeePerGas: feeData.maxFeePerGas ?? parseEther("20", "gwei"),
        maxPriorityFeePerGas:
          feeData.maxPriorityFeePerGas ?? parseEther("2", "gwei"),
      };

      const txHash = await walletClient.sendTransaction(fullTx);
      toast.success(
        `Undelegated successfully on ${resultForChain.chain}! Tx: ${txHash}`
      );

      await checkDelegation(walletAddress);
    } catch (error) {
      toast.error(
        "Error undelegating. If your wallet doesn't support EIP-7702, try using Rabby Wallet."
      );
      console.error(error);
      setIsModalOpen(true);
    } finally {
      setUndelegateLoadings((prev) => ({ ...prev, [targetChainId]: false }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !walletAddress ||
      !walletAddress.startsWith("0x") ||
      walletAddress.length !== 42
    ) {
      toast.error("Please enter a valid wallet address");
    } else {
      checkDelegation(walletAddress);
    }
  };

  return (
    <div className="min-h-screen font-mono w-full bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <Header title="Delegation Checker" />
      <UndelegateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <main className="max-w-[1500px]  mx-auto px-4 py-10">
        <section className="text-center mb-12 space-y-3">
          <h1 className="text-xl md:text-4xl lg:text-6xl font-extrabold  bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-pulse pb-5">
            Check EIP-7702 Delegation
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-xs sm:text-sm md:text-lg">
            Paste your wallet address or connect your wallet to instantly check
            delegation status across supported chains.
          </p>
        </section>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4 mb-12 justify-center  md:px-4"
        >
          <input
            type="text"
            placeholder="Enter wallet address (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:border-pink-500 outline-none backdrop-blur-md"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <LucideSearch size={18} />
            {loading ? "Checking..." : "Check"}
          </button>
        </form>

        {/* Results */}
        {results.length > 0 ? (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto md:px-4">
              <div className="bg-white/5 rounded-2xl shadow-lg overflow-hidden backdrop-blur-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-left uppercase tracking-wider text-xs">
                    <tr className="text-center">
                      <th className="px-6 py-3">Chain</th>
                      <th className="px-6 py-3">Wallet</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Delegated To</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className="hover:bg-white/10 transition">
                        <td className="px-6 py-4">{result.chain}</td>
                        <td className="px-6 py-4">
                          {result.wallet.slice(0, 6)}...
                          {result.wallet.slice(-4)}
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold ${
                            result.status === "Delegated"
                              ? "text-red-400"
                              : result.status === "Error"
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {result.status}
                        </td>
                        <td className="px-6 py-4">
                          {result.delegatedTo !== "N/A" &&
                          result.delegatedTo !== "Unknown" ? (
                            <a
                              href={`${result.explorer}/address/${result.delegatedTo}`}
                              target="_blank"
                              className="text-blue-400 underline"
                            >
                              {result.delegatedTo.slice(0, 6)}...
                              {result.delegatedTo.slice(-4)}
                            </a>
                          ) : (
                            result.delegatedTo
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {result.status === "Delegated" ? (
                            <button
                              onClick={() => handleUndelegate(result.chainId)}
                              disabled={undelegateLoadings[result.chainId]}
                              className="bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 rounded-lg font-bold hover:scale-105 transition"
                            >
                              {undelegateLoadings[result.chainId]
                                ? "Undelegating..."
                                : "Undelegate"}
                            </button>
                          ) : (
                            <span className="text-gray-400">
                              No action needed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-6">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 backdrop-blur-md space-y-6 shadow-lg"
                >
                  <div>
                    <p className="text-xs text-gray-400">Chain</p>
                    <p className="mb-3">{result.chain}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Wallet</p>
                    <p className="break-all mb-3">
                      {result.wallet.slice(0, 6)}...{result.wallet.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p
                      className={`font-semibold mb-3 ${
                        result.status === "Delegated"
                          ? "text-red-400"
                          : result.status === "Error"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {result.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Delegated To</p>
                    <p className="mb-3">
                      {result.status === "Delegated" &&
                      result.delegatedTo !== "Unknown" ? (
                        <a
                          href={`${result.explorer}/address/${result.delegatedTo}`}
                          target="_blank"
                          className="text-blue-400 underline break-all"
                        >
                          {result.delegatedTo.slice(0, 6)}...
                          {result.delegatedTo.slice(-4)}
                        </a>
                      ) : (
                        <span>{result.delegatedTo}</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-2">
                    {result.status === "Delegated" ? (
                      <button
                        onClick={() => handleUndelegate(result.chainId)}
                        disabled={undelegateLoadings[result.chainId]}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 rounded-lg font-bold hover:scale-105 transition"
                      >
                        {undelegateLoadings[result.chainId]
                          ? "Undelegating..."
                          : "Undelegate"}
                      </button>
                    ) : (
                      <span className="text-gray-400">No action needed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 flex flex-col items-center mt-12">
            <LucideAlertCircle
              size={56}
              className="mb-4 text-pink-500 hidden md:block"
            />
            <LucideAlertCircle
              size={30}
              className="mb-4 text-pink-500 md:hidden"
            />
            <p className="md:first-line:text-lg text-sm">
              Paste an address and check, or connect your wallet to auto-load.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
