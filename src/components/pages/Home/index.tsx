// Home.tsx
import { useState, useEffect } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { toast } from "react-toastify";
import { parseEther, zeroAddress } from "viem";
import { LucideSearch, LucideAlertCircle } from "lucide-react";
import { useConnectWallet } from "../../../hooks/useConnectWallet";
import Header from "../../Header";

export default function Home() {
  const { address: connectedAddress, connect } = useConnectWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState<{
    wallet: string;
    status: string;
    delegatedTo: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [undelegateLoading, setUndelegateLoading] = useState(false);

  useEffect(() => {
    if (connectedAddress) {
      setWalletAddress(connectedAddress);
      checkDelegation(connectedAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress]);

  const checkDelegation = async (addr: string) => {
    if (!publicClient || !addr) return;

    setLoading(true);
    try {
      const bytecode = await publicClient.getCode({
        address: addr as `0x${string}`,
      });
      console.log("Bytecode:", bytecode);
      let status = "Not Delegated";
      let delegatedTo = "N/A";

      if (bytecode && bytecode !== "0x") {
        status = "Delegated";
        const slot =
          "0x360894a13ba1a3210667c828492cd3d7be7c58f21b2a9e4d6f20fb5b8a9c18d0" as const;
        const storage = await publicClient.getStorageAt({
          address: addr as `0x${string}`,
          slot,
        });
        console.log("Storage at slot:", storage);
        // if (
        //   storage &&
        //   storage !==
        //     "0x0000000000000000000000000000000000000000000000000000000000000000"
        // ) {
        delegatedTo =
          bytecode && bytecode.length >= 40
            ? `0x...${bytecode.slice(-4)}`
            : "Unknown";
        // } else {
        //   delegatedTo = "Unknown";
        // }
      }

      setResult({ wallet: addr, status, delegatedTo });
    } catch (error) {
      toast.error("Error checking delegation");
      console.error(error);
    }
    setLoading(false);
  };
  const handleUndelegate = async () => {
    if (
      !walletClient ||
      !connectedAddress ||
      connectedAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      toast.error("Connect the wallet you want to undelegate");
      connect();
      return;
    }

    if (result?.status !== "Delegated") {
      toast.error("Wallet is not delegated");
      return;
    }

    setUndelegateLoading(true);
    try {
      if (!publicClient) {
        toast.error("Public client not available");
        setUndelegateLoading(false);
        return;
      }
      const nonce = await publicClient.getTransactionCount({
        address: connectedAddress,
        blockTag: "latest",
      });

      const chainId = publicClient.chain?.id;
      if (!chainId) {
        toast.error("Chain ID not available");
        setUndelegateLoading(false);
        return;
      }

      const signature = await walletClient.signTypedData({
        account: connectedAddress,
        domain: {
          chainId: BigInt(chainId),
          verifyingContract: connectedAddress,
        },
        types: {
          Authorization: [
            { name: "chainId", type: "uint256" },
            { name: "address", type: "address" },
            { name: "nonce", type: "uint256" },
          ],
        },
        primaryType: "Authorization",
        message: {
          chainId: BigInt(chainId),
          address: zeroAddress,
          nonce: BigInt(nonce),
        },
      });

      const yParity = parseInt(signature.slice(-2), 16) as 0 | 1;
      const r = `0x${signature.slice(2, 66)}`;
      const s = `0x${signature.slice(66, 130)}`;

      const signedAuth = {
        chainId,
        address: zeroAddress,
        nonce,
        yParity,
        r,
        s,
      };

      const tx = {
        type: "eip7702" as const,
        chainId,
        to: zeroAddress,
        value: 0n,
        data: "0x" as `0x${string}`,
        gas: 100000n,
        authorizationList: [signedAuth],
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
      toast.success(`Undelegated successfully! Tx: ${txHash}`);

      await checkDelegation(walletAddress);
    } catch (error) {
      toast.error(
        "Error undelegating. If your wallet doesn't support EIP-7702, try using Rabby Wallet."
      );
      console.error(error);
    }
    setUndelegateLoading(false);
  };

  // const handleUndelegate = async () => {
  //   if (
  //     !walletClient ||
  //     !connectedAddress ||
  //     connectedAddress.toLowerCase() !== walletAddress.toLowerCase()
  //   ) {
  //     toast.error("Connect the wallet you want to undelegate");
  //     connect();
  //     return;
  //   }

  //   if (result?.status !== "Delegated") {
  //     toast.error("Wallet is not delegated");
  //     return;
  //   }

  //   setUndelegateLoading(true);
  //   try {
  //     if (!publicClient) {
  //       toast.error("Public client not available");
  //       setUndelegateLoading(false);
  //       return;
  //     }
  //     const nonce = await publicClient.getTransactionCount({
  //       address: connectedAddress,
  //       blockTag: "latest",
  //     });

  //     const chainId = publicClient.chain?.id;
  //     if (!chainId) {
  //       toast.error("Chain ID not available");
  //       setUndelegateLoading(false);
  //       return;
  //     }

  //     const signature = await walletClient.signTypedData({
  //       account: connectedAddress,
  //       domain: {
  //         chainId: BigInt(chainId),
  //       },
  //       types: {
  //         Authorization: [
  //           { name: "contractAddress", type: "address" },
  //           { name: "nonce", type: "uint256" },
  //         ],
  //       },
  //       primaryType: "Authorization",
  //       message: {
  //         contractAddress: zeroAddress,
  //         nonce: BigInt(nonce),
  //       },
  //     });

  //     const signedAuth = { signature };

  //     const tx = {
  //       type: "eip7702" as const,
  //       chainId,
  //       to: zeroAddress,
  //       value: 0n,
  //       data: "0x" as `0x${string}`,
  //       gas: 100000n,
  //       authorizationList: [signedAuth],
  //     };

  //     const gasEstimate = await publicClient.estimateGas({
  //       ...tx,
  //       account: connectedAddress,
  //     });

  //     const feeData = await publicClient.estimateFeesPerGas();

  //     const fullTx = {
  //       ...tx,
  //       gas: gasEstimate,
  //       maxFeePerGas: feeData.maxFeePerGas ?? parseEther("20", "gwei"),
  //       maxPriorityFeePerGas:
  //         feeData.maxPriorityFeePerGas ?? parseEther("2", "gwei"),
  //     };

  //     const txHash = await walletClient.sendTransaction(fullTx);
  //     toast.success(`Undelegated successfully! Tx: ${txHash}`);

  //     await checkDelegation(walletAddress);
  //   } catch (error) {
  //     toast.error("Error undelegating");
  //     console.error(error);
  //   }
  //   setUndelegateLoading(false);
  // };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    checkDelegation(walletAddress);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <Header title="Delegation Checker" />
      <main className="max-w-[1500px] mx-auto px-4 py-10">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold  bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-pulse pb-5">
            Wallet Delegation Checker
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Paste your wallet address or connect your wallet to instantly check
            delegation status.
          </p>
        </section>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4 mb-12 justify-center"
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
        {result ? (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <div className="bg-white/5 rounded-2xl shadow-lg overflow-hidden backdrop-blur-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-left uppercase tracking-wider text-xs">
                    <tr className="text-center">
                      <th className="px-6 py-3">Wallet</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Delegated To</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-white/10 transition">
                      <td className="px-6 py-4">
                        {result.wallet.slice(0, 6)}...{result.wallet.slice(-4)}
                      </td>
                      <td
                        className={`px-6 py-4 font-semibold ${
                          result.status === "Delegated"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {result.status}
                      </td>
                      <td className="px-6 py-4">{result.delegatedTo}</td>
                      <td className="px-6 py-4">
                        {result.status === "Delegated" ? (
                          <button
                            onClick={handleUndelegate}
                            disabled={undelegateLoading}
                            className="bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 rounded-lg font-bold hover:scale-105 transition"
                          >
                            {undelegateLoading
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
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-4">
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md shadow-lg">
                <p className="text-xs text-gray-400">Wallet</p>
                <p className="break-all mb-3">
                  {result.wallet.slice(0, 6)}...{result.wallet.slice(-4)}
                </p>

                <p className="text-xs text-gray-400">Status</p>
                <p
                  className={`font-semibold mb-3 ${
                    result.status === "Delegated"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {result.status}
                </p>

                <p className="text-xs text-gray-400">Delegated To</p>
                <p className="mb-3">{result.delegatedTo}</p>

                <div className="mt-2">
                  {result.status === "Delegated" ? (
                    <button
                      onClick={handleUndelegate}
                      disabled={undelegateLoading}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 rounded-lg font-bold hover:scale-105 transition"
                    >
                      {undelegateLoading ? "Undelegating..." : "Undelegate"}
                    </button>
                  ) : (
                    <span className="text-gray-400">No action needed</span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 flex flex-col items-center mt-12">
            <LucideAlertCircle size={56} className="mb-4 text-pink-500" />
            <p className="text-lg">
              Paste an address and check, or connect your wallet to auto-load.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
