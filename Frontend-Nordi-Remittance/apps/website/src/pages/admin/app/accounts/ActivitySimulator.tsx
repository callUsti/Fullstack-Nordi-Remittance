// ============================================================================
// ActivitySimulator — Admin per-user toggle & cron control for realistic
// automated banking, card, loan, investment, FX, and internal transactions.
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Play,
  Power,
  RefreshCw,
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
  Landmark,
  Clock,
  CheckCircle2,
  Loader2,
  Zap,
} from "lucide-react";
import {
  PageContainer,
  DashCard,
  StatCard,
  StatsGrid,
  FilterBar,
  ActionButton,
} from "@components/shared/DashboardPrimitives";
import { PageHeader } from "@components/shared/PageHeader";
import apiClient from "@core/api/client";
import { ApiEndpoints } from "@core/api/endpoint";
import { useToast } from "@store/toast.store";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ActivitySimulator() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [users, setUsers] = useState<any[]>([]);
  const [totalEnabled, setTotalEnabled] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [cadenceOverride, setCadenceOverride] = useState<"mixed" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly">("mixed");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get(ApiEndpoints.adminOpsSimulatorUsers, {
        params: { search, page: 1, limit: 100 },
      });
      const payload = res?.data?.data || res?.data || res;
      setUsers(payload?.users || []);
      setTotalEnabled(payload?.totalEnabled || 0);
      setTotalUsers(payload?.pagination?.total || (payload?.users || []).length);
    } catch (err: any) {
      toastRef.current.error(err?.response?.data?.message || "Failed to load simulator users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 250);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleToggle = async (userId: string, nextEnabled: boolean, intensity?: string) => {
    setBusyUserId(userId);
    try {
      await apiClient.post(ApiEndpoints.adminOpsSimulatorToggle(userId), {
        enabled: nextEnabled,
        ...(intensity ? { intensity } : {}),
      });
      toast.success(`Activity simulator ${nextEnabled ? "enabled" : "disabled"} for user`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update simulator status");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRunNow = async (userId: string, userName: string) => {
    setBusyUserId(userId);
    try {
      const res: any = await apiClient.post(ApiEndpoints.adminOpsSimulatorRunNow(userId), {
        cadenceOverride,
      });
      const count = res?.data?.data?.generatedCount ?? res?.data?.generatedCount ?? 0;
      toast.success(`Generated ${count} realistic transactions for ${userName}`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to run simulation");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRunAllEnabled = async () => {
    setRunningAll(true);
    try {
      const res: any = await apiClient.post(ApiEndpoints.adminOpsSimulatorRunAll, {
        cadenceOverride,
      });
      const payload = res?.data?.data || res?.data || {};
      toast.success(
        `Simulated ${payload.totalGenerated ?? 0} transactions across ${payload.processedUsers ?? 0} enabled users`,
      );
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to run batch simulation");
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
      <PageHeader
        title="Activity Simulator & Cron Control"
        subtitle="Enable automated realistic daily, weekly, monthly, and yearly transaction histories for selected users"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Accounts", href: "/admin/accounts" },
          { label: "Activity Simulator" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              id="simulator-cadence-override"
              name="cadenceOverride"
              value={cadenceOverride}
              onChange={(e) => setCadenceOverride(e.target.value as any)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="mixed">Mixed Cadence (All)</option>
              <option value="daily">Daily Life (Fuel, Food)</option>
              <option value="weekly">Weekly (Groceries, Retainers)</option>
              <option value="biweekly">Biweekly (Payroll, Savings)</option>
              <option value="monthly">Monthly (Mortgage, Subs, Loans)</option>
              <option value="yearly">Yearly (Contracts, Car, Taxes)</option>
            </select>
            <ActionButton
              label={runningAll ? "Running Batch..." : "Run All Enabled Now"}
              icon={runningAll ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              onClick={handleRunAllEnabled}
            />
            <ActionButton label="Refresh" icon={<RefreshCw size={15} />} onClick={fetchUsers} variant="secondary" />
          </div>
        }
      />

      <StatsGrid cols={4}>
        <StatCard
          label="Total Customers"
          value={totalUsers}
          icon={<Users size={20} />}
          iconColor="from-indigo-500 to-purple-600"
          index={0}
        />
        <StatCard
          label="Enabled for Cron"
          value={totalEnabled}
          icon={<CheckCircle2 size={20} />}
          iconColor="from-emerald-500 to-teal-600"
          positive
          index={1}
        />
        <StatCard
          label="BullMQ Cron Cadence"
          value="Every 30m"
          icon={<Clock size={20} />}
          iconColor="from-amber-500 to-orange-600"
          index={2}
        />
        <StatCard
          label="Total Simulated Txns"
          value={users.reduce((s, u) => s + (u.simulator?.totalTransactionsGenerated || 0), 0)}
          icon={<Activity size={20} />}
          iconColor="from-blue-500 to-cyan-600"
          index={3}
        />
      </StatsGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer by name, email, or account number..."
      />

      <DashCard padding="none">
        <div className="overflow-x-auto touch-pan-x scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                {[
                  "Customer",
                  "Existing Assets",
                  "Intensity",
                  "Cron Status",
                  "Simulated History",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-5 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((u) => {
                    const enabled = Boolean(u.simulator?.enabled);
                    const intensity = u.simulator?.intensity || "normal";
                    const isBusy = busyUserId === u.userId;

                    return (
                      <motion.tr
                        key={u.userId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-gray-100 hover:bg-gray-50/70 dark:border-gray-800/60 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{u.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                          <p className="mt-0.5 font-mono text-xs text-gray-400">
                            {u.accountNumber} · {u.currency}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                              <Wallet size={12} /> {u.assets.wallets} Wallets
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                              <CreditCard size={12} /> {u.assets.cards} Cards
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              <Landmark size={12} /> {u.assets.loans} Loans
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              <TrendingUp size={12} /> {u.assets.investments} Inv
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <select
                            id={`simulator-intensity-${u.userId}`}
                            name={`intensity-${u.userId}`}
                            disabled={isBusy}
                            value={intensity}
                            onChange={(e) => handleToggle(u.userId, enabled, e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium capitalize text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          >
                            <option value="low">Low (2-4 / run)</option>
                            <option value="normal">Normal (4-7 / run)</option>
                            <option value="high">High (7-12 / run)</option>
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggle(u.userId, !enabled)}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                              enabled
                                ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                                : "border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Power size={14} />
                            )}
                            {enabled ? "ON (Auto Cron)" : "OFF"}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {u.simulator?.totalTransactionsGenerated || 0} txns
                          </p>
                          <p className="text-xs text-gray-500">
                            {u.simulator?.lastRunAt
                              ? `Last: ${new Date(u.simulator.lastRunAt).toLocaleString()}`
                              : "Never run yet"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            disabled={isBusy || u.assets.wallets === 0}
                            onClick={() => handleRunNow(u.userId, u.name)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                            title={u.assets.wallets === 0 ? "User has no active wallets" : "Run simulation batch now"}
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                            Run Now
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </DashCard>
    </PageContainer>
  );
}

