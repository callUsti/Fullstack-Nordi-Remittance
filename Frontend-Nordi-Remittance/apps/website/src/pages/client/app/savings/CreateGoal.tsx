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
  useCreateSavingsGoal,
  useClientSavingsGoalProgress,
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

const CreateGoal: React.FC = () => {
  const createMutation = useCreateSavingsGoal();
  const { wallets } = useClientWallets();
  const { showToast } = useToastStore();

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    emoji: "🎯",
    monthlyContribution: "",
    category: "",
    walletId: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const defaultWalletId = wallets[0]?._id || wallets[0]?.id || "";
  const activeWalletId = form.walletId || defaultWalletId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount) {
      showToast("Goal name and target amount are required", "error");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate || new Date(Date.now() + 365 * 86400000).toISOString(),
        accountId: activeWalletId as any,
        category: form.category || undefined,
        imageUrl: form.emoji,
        autoSave: form.monthlyContribution
          ? { enabled: true, amount: Number(form.monthlyContribution), frequency: "monthly" }
          : undefined,
      });
      setForm({
        name: "",
        targetAmount: "",
        targetDate: "",
        emoji: "🎯",
        monthlyContribution: "",
        category: "",
        walletId: "",
      });
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Create Savings Goal"
          subtitle="Set a new financial target and start saving"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Savings", href: "/customer/savings" },
            { label: "Create Goal" },
          ]}
        />
      </motion.div>

      <div className="max-w-2xl">
        <DashCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Emoji selector */}
            <div>
              <label className={labelCls}>Goal Icon</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, emoji: em }))}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all ${
                      form.emoji === em
                        ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950/50"
                        : "border border-gray-200 bg-gray-100 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal name */}
            <div>
              <label className={labelCls}>Goal Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Vacation Fund"
                className={inputCls}
              />
            </div>

            {/* Target amount */}
            <div>
              <label className={labelCls}>Target Amount</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  value={form.targetAmount}
                  onChange={set("targetAmount")}
                  placeholder="10,000"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            {/* Target date & category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Target Date</label>
                <input type="date" value={form.targetDate} onChange={set("targetDate")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={set("category")} className={inputCls}>
                  <option value="">Select category</option>
                  <option value="travel">Travel</option>
                  <option value="home">Home</option>
                  <option value="education">Education</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="emergency">Emergency</option>
                  <option value="wedding">Wedding</option>
                  <option value="retirement">Retirement</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Source Wallet */}
            {wallets.length > 0 && (
              <div>
                <label className={labelCls}>Funding Wallet</label>
                <select value={activeWalletId} onChange={set("walletId")} className={inputCls}>
                  {wallets.map((w: any) => {
                    const wid = w._id || w.id;
                    const bal = w.balance ?? w.availableBalance ?? 0;
                    return (
                      <option key={wid} value={wid}>
                        {w.name || `${w.currency || "USD"} Wallet`} ({fmt(bal)})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Monthly contribution */}
            <div>
              <label className={labelCls}>Monthly Contribution (optional)</label>
              <div className="relative">
                <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  value={form.monthlyContribution}
                  onChange={set("monthlyContribution")}
                  placeholder="500"
                  className={`${inputCls} pl-10`}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                Set an amount to auto-save each month toward this goal.
              </p>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-medium text-white disabled:opacity-50 sm:text-sm"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {createMutation.isPending ? (
                "Creating…"
              ) : (
                <>
                  <Plus size={16} /> Create Goal
                </>
              )}
            </motion.button>
          </form>
        </DashCard>
      </div>
    </PageContainer>
  );
};

export default CreateGoal;
