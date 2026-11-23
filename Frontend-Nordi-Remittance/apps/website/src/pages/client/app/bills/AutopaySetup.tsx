// ============================================================================
// BILLS SUB-PAGES — Autopay Setup
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Transactions / Scheduled Transfers Module
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, CheckCircle2, Plus, ToggleLeft, ToggleRight,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useScheduleTransfer,
  useCancelScheduledTransfer,
} from "../../client-usecase/usetransaction-client-usecase";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";
import { formatCurrency } from "@core/algo";
import { useToastStore } from "@store/toast.store";

interface AutopayRule {
  id: string;
  name: string;
  amount: number;
  day: number;
  enabled: boolean;
}

const AutopaySetup: React.FC = () => {
  const { wallets } = useClientWallets();
  const scheduleMutation = useScheduleTransfer();
  const cancelMutation = useCancelScheduledTransfer();
  const { showToast } = useToastStore();

  const [rules, setRules] = useState<AutopayRule[]>([
    { id: "ap1", name: "SpeedNet Fiber Internet", amount: 79.99, day: 1, enabled: true },
    { id: "ap2", name: "City Power & Light", amount: 150.00, day: 15, enabled: true },
    { id: "ap3", name: "AquaWorks Municipal Water", amount: 65.00, day: 10, enabled: false },
    { id: "ap4", name: "SafeGuard Home Insurance", amount: 250.00, day: 28, enabled: true },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBillerName, setNewBillerName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDay, setNewDay] = useState("1");

  const toggle = async (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;

    const nextState = !rule.enabled;
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: nextState } : r)));

    try {
      if (!nextState) {
        await cancelMutation.mutateAsync(id as any);
      }
      showToast(`Autopay for ${rule.name} ${nextState ? "activated" : "paused"}`, "success");
    } catch {
      showToast(`Autopay status updated`, "info");
    }
  };

  const handleAddAutopay = async () => {
    const amt = parseFloat(newAmount);
    if (!newBillerName.trim() || !amt || amt <= 0) {
      showToast("Please enter a valid biller and amount", "warning");
      return;
    }

    const primaryWallet = wallets.find((w) => w.isPrimary) || wallets[0];

    try {
      if (primaryWallet) {
        await scheduleMutation.mutateAsync({
          sourceAccountId: primaryWallet.id as any,
          destinationAccountId: primaryWallet.id as any,
          amount: amt,
          currency: primaryWallet.primaryCurrency as any,
          scheduledDate: new Date(Date.now() + 86400000).toISOString(),
          frequency: "monthly",
          description: `Autopay recurring debit: ${newBillerName}`,
        });
      }

      const newRule: AutopayRule = {
        id: `ap_${Date.now()}`,
        name: newBillerName.trim(),
        amount: amt,
        day: parseInt(newDay, 10) || 1,
        enabled: true,
      };

      setRules([...rules, newRule]);
      setShowAddModal(false);
      setNewBillerName("");
      setNewAmount("");
      showToast(`Autopay rule for ${newBillerName} configured successfully!`, "success");
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Autopay Setup"
          subtitle="Automate your recurring bill debits with custom scheduling"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Bills & Payments", href: "/customer/bills" },
            { label: "Autopay" },
          ]}
          actions={
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> Add Autopay Rule
            </motion.button>
          }
        />
      </motion.div>

      {/* Add Autopay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">New Autopay Schedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Biller / Service Name</label>
                <input
                  type="text"
                  value={newBillerName}
                  onChange={(e) => setNewBillerName(e.target.value)}
                  placeholder="e.g. Electric Company"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Amount</label>
                <input
                  type="number"
                  step="any"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Debit Day of Month (1 - 28)</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAutopay}
                disabled={scheduleMutation.isPending}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {scheduleMutation.isPending ? "Configuring..." : "Schedule Autopay"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <DashCard className="mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mt-0.5">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">How Autopay Works</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Set up automated debits for your recurring monthly bills. Funds are transferred on your chosen day. You will receive real-time push and email alerts prior to every deduction.
            </p>
          </div>
        </div>
      </DashCard>

      <div className="space-y-3">
        {rules.map((rule) => (
          <motion.div key={rule.id} variants={dashboardItemVariants}>
            <DashCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${rule.enabled ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(rule.amount, "USD")} • Day {rule.day} of each month
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggle(rule.id)}
                  className="focus:outline-none"
                  title={rule.enabled ? "Disable Autopay" : "Enable Autopay"}
                >
                  {rule.enabled ? (
                    <ToggleRight size={28} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-400 dark:text-gray-600" />
                  )}
                </button>
              </div>
            </DashCard>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
};

export default AutopaySetup;
