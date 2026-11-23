// ============================================================================
// SAVINGS GOAL SUB-PAGES — Goals List, Create Goal, Auto-Save Rules, Analytics
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// ============================================================================

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Plus,
  TrendingUp,
  PiggyBank,
  Calendar,
  Clock,
  DollarSign,
  ArrowUpRight,
  Repeat,
  Percent,
  BarChart3,
  Sparkles,
  ChevronRight,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, DashCard, StatCard, StatsGrid, ProgressBar } from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton, AccountListSkeleton, FormSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientSavingsGoals,
  useAddToSavingsGoal,
  useWithdrawFromSavingsGoal,
  useDeleteSavingsGoal,
} from "../../client-usecase/usesavinga-client-usecase";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";
import { useUIStore } from "@store/ui.store";
import { useToastStore } from "@store/toast.store";

/* ═══════════════════════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════════════════════ */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const pct = (saved: number, target: number) => (target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0);

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";

const labelCls = "block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

const GOAL_EMOJIS = ["🎯", "🏠", "✈️", "🚗", "💍", "🎓", "💰", "🏖️", "📱", "🎮", "🩺", "🐶"];

/* ═══════════════════════════════════════════════════════════════════════════
   1. SAVINGS GOALS LIST
   ═══════════════════════════════════════════════════════════════════════════ */

const SavingsGoalsList: React.FC = () => {
  const { goals, isLoading } = useClientSavingsGoals();
  const { wallets } = useClientWallets();
  const addMutation = useAddToSavingsGoal();
  const withdrawMutation = useWithdrawFromSavingsGoal();
  const deleteMutation = useDeleteSavingsGoal();
  const { showToast } = useToastStore();

  const [activeModal, setActiveModal] = useState<{
    goal: any;
    mode: "deposit" | "withdraw";
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const defaultWalletId = wallets[0]?._id || wallets[0]?.id || "";
  const walletIdToUse = selectedWalletId || defaultWalletId;

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal || !amount || Number(amount) <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    const goalId = activeModal.goal._id || activeModal.goal.id;
    try {
      if (activeModal.mode === "deposit") {
        await addMutation.mutateAsync({
          goalId,
          data: { amount: Number(amount), accountId: walletIdToUse },
        });
      } else {
        await withdrawMutation.mutateAsync({
          goalId,
          data: { amount: Number(amount), accountId: walletIdToUse },
        });
      }
      setActiveModal(null);
      setAmount("");
    } catch {
      // handled by mutation onError
    }
  };

  const handleDeleteGoal = (goal: any) => {
    const goalId = goal._id || goal.id;
    deleteMutation.mutate({ goalId, transferAccountId: walletIdToUse });
  };

  const totalSaved = useMemo(
    () => goals.reduce((s: number, g: any) => s + (g.currentAmount ?? g.savedAmount ?? 0), 0),
    [goals],
  );
  const totalTarget = useMemo(() => goals.reduce((s: number, g: any) => s + (g.targetAmount ?? 0), 0), [goals]);
  const activeGoals = goals.filter((g: any) => g.status !== "completed" && g.status !== "cancelled").length;
  const monthlySaving = useMemo(
    () => goals.reduce((s: number, g: any) => s + (g.monthlyContribution ?? g.autoSave?.amount ?? 0), 0),
    [goals],
  );

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Savings Goals"
          subtitle="Track your progress toward every financial goal"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Savings", href: "/customer/savings" },
            { label: "Goals" },
          ]}
        />
      </motion.div>

      {/* ── Stats ── */}
      {isLoading ? (
        <StatsGridSkeleton count={3} />
      ) : (
        <StatsGrid cols={3}>
          <StatCard
            label="Total Saved"
            value={fmt(totalSaved)}
            icon={<PiggyBank size={18} />}
            iconColor="bg-emerald-600"
            change={totalTarget > 0 ? `${pct(totalSaved, totalTarget)}% of target` : undefined}
            positive
            index={0}
          />
          <StatCard
            label="Active Goals"
            value={activeGoals}
            icon={<Target size={18} />}
            iconColor="bg-blue-600"
            index={1}
          />
          <StatCard
            label="Monthly Saving"
            value={fmt(monthlySaving)}
            icon={<Repeat size={18} />}
            iconColor="bg-amber-600"
            index={2}
          />
        </StatsGrid>
      )}

      {/* ── Goal cards ── */}
      {isLoading ? (
        <AccountListSkeleton count={4} />
      ) : goals.length === 0 ? (
        <EmptyState title="No Savings Goals" description="Create your first goal to start saving smarter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g: any, i: number) => {
            const saved = g.currentAmount ?? g.savedAmount ?? 0;
            const target = g.targetAmount ?? 0;
            const percentage = pct(saved, target);
            const emoji = g.emoji || g.imageUrl || GOAL_EMOJIS[i % GOAL_EMOJIS.length];

            return (
              <motion.div key={g._id || g.id || i} variants={dashboardItemVariants}>
                <DashCard className="transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{g.name}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                          {g.category || "General"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs ${
                        percentage >= 100
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>

                  <ProgressBar
                    value={percentage}
                    height="md"
                    color={
                      percentage >= 100
                        ? "bg-emerald-600"
                        : "bg-blue-600"
                    }
                  />

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">{fmt(saved)}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">of {fmt(target)}</p>
                  </div>

                  {g.targetDate && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                      <Calendar size={12} />
                      <span>
                        Target:{" "}
                        {new Date(g.targetDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal({ goal: g, mode: "deposit" });
                        setAmount("");
                      }}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      + Deposit
                    </button>
                    {saved > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModal({ goal: g, mode: "withdraw" });
                          setAmount("");
                        }}
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Withdraw
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g)}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      title="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </DashCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <DashCard className="w-full max-w-md">
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
              {activeModal.mode === "deposit" ? "Add Funds to" : "Withdraw from"} {activeModal.goal.name}
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Current balance: {fmt(activeModal.goal.currentAmount ?? activeModal.goal.savedAmount ?? 0)}
            </p>
            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Amount (USD)</label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={inputCls}
                  required
                />
              </div>
              {wallets.length > 0 && (
                <div>
                  <label className={labelCls}>
                    {activeModal.mode === "deposit" ? "Source Wallet" : "Destination Wallet"}
                  </label>
                  <select
                    value={walletIdToUse}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className={inputCls}
                  >
                    {wallets.map((w: any) => {
                      const wid = w._id || w.id;
                      return (
                        <option key={wid} value={wid}>
                          {w.name || `${w.currency || "USD"} Wallet`} ({fmt(w.balance ?? w.availableBalance ?? 0)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || withdrawMutation.isPending}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {addMutation.isPending || withdrawMutation.isPending
                    ? "Processing…"
                    : activeModal.mode === "deposit"
                      ? "Confirm Deposit"
                      : "Confirm Withdrawal"}
                </button>
              </div>
            </form>
          </DashCard>
        </div>
      )}
    </PageContainer>
  );
};

export default SavingsGoalsList;
