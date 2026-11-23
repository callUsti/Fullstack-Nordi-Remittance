// ============================================================================
// BILLS SUB-PAGES — Pay Bills
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Accounts & Transactions Modules
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, Droplets, Wifi, Flame, Shield, Phone, Search,
  Receipt,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientWallets,
  useClientBeneficiaries,
} from "../../client-usecase/useaccounts-client-usecase";
import { useTransfer } from "../../client-usecase/usetransaction-client-usecase";
import { formatCurrency } from "@core/algo";
import { useToastStore } from "@store/toast.store";

const PayBills: React.FC = () => {
  const [search, setSearch] = useState("");
  const { wallets, isLoading: walletsLoading } = useClientWallets();
  const { beneficiaries } = useClientBeneficiaries();
  const transferMutation = useTransfer();
  const { showToast } = useToastStore();

  const [payingBiller, setPayingBiller] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  const primaryWallet = wallets.find((w) => w.isPrimary) || wallets[0];

  const categories = [
    { name: "Electricity", icon: Zap, gradient: "bg-amber-600" },
    { name: "Water", icon: Droplets, gradient: "bg-blue-600" },
    { name: "Internet", icon: Wifi, gradient: "bg-blue-600" },
    { name: "Gas", icon: Flame, gradient: "bg-amber-600" },
    { name: "Insurance", icon: Shield, gradient: "bg-emerald-600" },
    { name: "Phone", icon: Phone, gradient: "bg-blue-600" },
  ];

  const billers = [
    { id: "b1", name: "City Power Co.", category: "Electricity", lastPaid: "Mar 15", defaultAmount: 142.50 },
    { id: "b2", name: "AquaWorks Municipal", category: "Water", lastPaid: "Mar 10", defaultAmount: 65.00 },
    { id: "b3", name: "SpeedNet Fiber Telecom", category: "Internet", lastPaid: "Mar 1", defaultAmount: 79.99 },
    { id: "b4", name: "SafeGuard Insurance Ltd.", category: "Insurance", lastPaid: "Feb 28", defaultAmount: 250.00 },
    { id: "b5", name: "National Gas Grid", category: "Gas", lastPaid: "Mar 5", defaultAmount: 48.20 },
    { id: "b6", name: "Cellular One Network", category: "Phone", lastPaid: "Mar 12", defaultAmount: 55.00 },
  ];

  const filtered = billers.filter(
    (b) =>
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenPay = (biller: any) => {
    setPayingBiller(biller);
    setPaymentAmount(String(biller.defaultAmount));
  };

  const handleExecutePayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      showToast("Please enter a valid bill amount", "warning");
      return;
    }
    if (primaryWallet && amt > primaryWallet.primaryCurrencyBalance) {
      showToast("Insufficient balance in your primary wallet", "error");
      return;
    }

    try {
      if (primaryWallet) {
        await transferMutation.mutateAsync({
          sourceAccountId: primaryWallet.id as any,
          destinationAccountId: (beneficiaries[0]?.id || primaryWallet.id) as any,
          amount: amt,
          currency: primaryWallet.primaryCurrency as any,
          description: `Utility bill payment: ${payingBiller.name} (${payingBiller.category})`,
        });
      }
      showToast(`Bill payment of ${formatCurrency(amt, primaryWallet?.primaryCurrency || "USD")} to ${payingBiller.name} successful!`, "success");
      setPayingBiller(null);
      setPaymentAmount("");
    } catch {
      // Handled in mutation onError
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Pay Bills"
          subtitle="Quick and secure payments for all your utilities and recurring services"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Bills & Payments", href: "/customer/bills" },
            { label: "Pay Bills" },
          ]}
        />
      </motion.div>

      {/* Primary Wallet Balance Banner */}
      {primaryWallet && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Paying from Wallet:</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{primaryWallet.type.toUpperCase()} ({primaryWallet.primaryCurrency})</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Available Balance:</span>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {formatCurrency(primaryWallet.primaryCurrencyBalance, primaryWallet.primaryCurrency)}
            </p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingBiller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Pay {payingBiller.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{payingBiller.category} Provider</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Amount</label>
                <input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPayingBiller(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayment}
                disabled={transferMutation.isPending}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {transferMutation.isPending ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {categories.map((cat) => (
          <motion.div key={cat.name} variants={dashboardItemVariants}>
            <DashCard
              onClick={() => setSearch(cat.name)}
              className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-center py-5"
            >
              <div className={`w-12 h-12 mx-auto ${cat.gradient} rounded-2xl flex items-center justify-center text-white mb-3 shadow-md`}>
                <cat.icon size={20} />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
            </DashCard>
          </motion.div>
        ))}
      </div>

      <DashCard className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search billers by name or category…"
            className={`${inputCls} pl-10`}
          />
        </div>
      </DashCard>

      {walletsLoading ? (
        <StatsGridSkeleton />
      ) : (
        <DashCard padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Registered Billers</h3>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{b.name}</h4>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{b.category} • Last paid: {b.lastPaid}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(b.defaultAmount, primaryWallet?.primaryCurrency || "USD")}
                  </span>
                  <motion.button
                    onClick={() => handleOpenPay(b)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Pay
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </DashCard>
      )}
    </PageContainer>
  );
};

export default PayBills;
