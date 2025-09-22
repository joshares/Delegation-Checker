import React from "react";
import { LucideX } from "lucide-react";

interface UndelegateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UndelegateModal: React.FC<UndelegateModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              How to Undelegate using Rabby Wallet
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors md:mb-6"
            >
              <LucideX size={24} className="hidden md:block" />
              <LucideX size={16} className="md:hidden " />
            </button>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-start">
              <span className="flex-shrink-0 text-lg font-bold text-gray-400 mr-2">
                1.
              </span>
              <p className="text-gray-300 md:text-base text-sm">
                Download the{" "}
                <span className="font-bold text-white">Rabby Wallet</span>{" "}
                extension for your browser.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 text-lg font-bold text-gray-400 mr-2">
                2.
              </span>
              <p className="text-gray-300 md:text-base text-sm">
                Import your wallet into Rabby Wallet.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 text-lg font-bold text-gray-400 mr-2">
                3.
              </span>
              <p className="text-gray-300 md:text-base text-sm">
                Click on the{" "}
                <span className="font-bold text-white">"Approvals"</span> icon
                within the Rabby Wallet interface.
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 text-lg font-bold text-gray-400 mr-2">
                4.
              </span>
              <p className="text-gray-300 md:text-base text-sm">
                Locate and click on{" "}
                <span className="font-bold text-white">
                  "EIP-7702 Delegation"
                </span>
                .
              </p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 text-lg font-bold text-gray-400 mr-2">
                5.
              </span>
              <p className="text-gray-300 md:text-base text-sm">
                Click the{" "}
                <span className="font-bold text-white">"Undelegate"</span>{" "}
                button and sign the transaction to revoke the delegation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UndelegateModal;
