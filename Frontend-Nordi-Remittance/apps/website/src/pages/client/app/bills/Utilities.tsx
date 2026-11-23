// ============================================================================
// BILLS SUB-PAGES — Utilities
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Accounts & Transactions Modules
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, Droplets, Wifi,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";
import { useTransfer } from "../../client-usecase/usetransaction-client-usecase";
import { formatCurrency } from "@core/algo";
import { useToastStore } from "@store/toast.store";

interface UtilityProvider {
  name: string;
  account: string;
  lastPaid: string;
  defaultAmount: number;
}

interface UtilityGroup {
  type: string;
  icon: any;
  color: string;
  providers: UtilityProvider[];
}

const Utilities: React.FC = () => {
  const { wallets } = useClientWallets();
  const transferMutation = useTransfer();
  const { showToast } = useToastStore();

  const [activePayingProvider, setActivePayingProvider] = useState<UtilityProvider | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");

  const primaryWallet = wallets.find((w) => w.isPrimary) || wallets[0];

  const utilityGroups: UtilityGroup[] = [
    {
      type: "Electricity",
      icon: Zap,
      color: "bg-amber-600",
      providers: [
        { name: "City Power Co.", account: "EP-2839401", lastPaid: "Mar 15, 2025", defaultAmount: 142.50 },
        { name: "Green Energy Ltd.", account: "GE-0019283", lastPaid: "Feb 28, 2025", defaultAmount: 95.00 },
      ],
    },
    {
      type: "Water",
      icon: Droplets,
      color: "bg-blue-600",
      providers: [
        { name: "AquaWorks", account: "AW-8827364", lastPaid: "Mar 10, 2025", defaultAmount: 65.00 },
      ],
    },
    {
      type: "Internet & Phone",
      icon: Wifi,
      color: "bg-blue-600",
      providers: [
        { name: "SpeedNet Fiber", account: "SN-5501982", lastPaid: "Mar 1, 2025", defaultAmount: 79.99 },
        { name: "MobilePlus", account: "MP-7728391", lastPaid: "Mar 5, 2025", defaultAmount: 50.00 },
      ],
    },
  ];

  const handleOpenPay = (p: UtilityProvider) => {
    setActivePayingProvider(p);
    setPayAmount(String(p.defaultAmount));
  };

  const handlePay = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      showToast("Please enter a valid payment amount", "warning");
      return;
    }
    if (primaryWallet && amt > primaryWallet.primaryCurrencyBalance) {
      showToast("Insufficient wallet funds", "error");
      return;
    }

    try {
      if (primaryWallet) {
        await transferMutation.mutateAsync({
          sourceAccountId: primaryWallet.id as any,
          destinationAccountId: primaryWallet.id as any,
          amount: amt,
          currency: primaryWallet.primaryCurrency as any,
          description: `Utility settlement: ${activePayingProvider?.name} (Account ${activePayingProvider?.account})`,
        });
      }
      showToast(`Settled ${formatCurrency(amt, primaryWallet?.primaryCurrency || "USD")} for ${activePayingProvider?.name}`, "success");
      setActivePayingProvider(null);
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Utilities"
          subtitle="Manage and pay your active household and enterprise utility service accounts"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Bills & Payments", href: "/customer/bills" },
            { label: "Utilities" },
          ]}
        />
      </motion.div>

      {/* Pay Modal */}
      {activePayingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Pay {activePayingProvider.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Account: {activePayingProvider.account}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Settlement Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setActivePayingProvider(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={transferMutation.isPending}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {transferMutation.isPending ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="space-y-6">
        {utilityGroups.map((group) => (
          <motion.div key={group.type} variants={dashboardItemVariants}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 ${group.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                <group.icon size={16} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{group.type}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.providers.map((p) => (
                <DashCard key={p.name}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{p.name}</h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {p.account} • Last paid: {p.lastPaid}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleOpenPay(p)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium shadow-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Pay Now
                    </motion.button>
                  </div>
                </DashCard>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
};

export default Utilities;
