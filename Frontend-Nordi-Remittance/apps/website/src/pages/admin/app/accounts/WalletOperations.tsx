// ============================================================================
// WalletOperations — Spacious Admin-initiated credit / debit / transfer operations
// Supports targeting ANY specific wallet associated with a user!
// Endpoints:
//   POST /admin/operations/credit
//   POST /admin/operations/debit
//   POST /admin/operations/transfer
// ============================================================================
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Wallet,
} from "lucide-react";
import { PageContainer, DashCard, SectionHeader } from "@components/shared/DashboardPrimitives";
import { PageHeader } from "@components/shared/PageHeader";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { ApiEndpoints } from "@core/api/endpoint";
import {
  useAccountsManagement,
  useWalletCombobox,
  useWalletOperationForm,
  formatCurrencyAmount,
} from "../../admin-usecase/useadmin-account-usecase";
import { useAllUsers } from "../../admin-usecase/useadmin-users-usercase";

/* eslint-disable @typescript-eslint/no-explicit-any */

type OperationType = "credit" | "debit" | "transfer";

import Currencies from "@core/data/Currencies";

const SUPPORTED_CURRENCIES = Currencies.map((c) => c.code);

const opConfig = {
  credit: {
    label: "Credit Account / Wallet",
    desc: "Add funds directly to any user wallet, savings, current, or fixed deposit account.",
    icon: <ArrowDownLeft size={22} />,
    color: "from-emerald-500 to-teal-600",
    badgeColor: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    endpoint: ApiEndpoints.adminOpsCredit,
  },
  debit: {
    label: "Debit Account / Wallet",
    desc: "Deduct funds from any selected user wallet or bank account.",
    icon: <ArrowUpRight size={22} />,
    color: "from-rose-500 to-red-600",
    badgeColor: "bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400",
    endpoint: ApiEndpoints.adminOpsDebit,
  },
  transfer: {
    label: "Admin Inter-Account Transfer",
    desc: "Transfer funds between any two wallets or customer accounts.",
    icon: <ArrowLeftRight size={22} />,
    color: "from-indigo-500 to-blue-600",
    badgeColor: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400",
    endpoint: ApiEndpoints.adminOpsTransfer,
  },
};

function UserWalletCombobox({
  value,
  onChange,
  label,
  placeholder,
  accounts,
  users,
  userAccountsMap,
}: {
  value: string;
  onChange: (val: string, acc?: any) => void;
  label: string;
  placeholder: string;
  accounts: any[];
  users: any[];
  userAccountsMap: Record<string, any[]>;
}) {
  const { open, setOpen, search, setSearch, debouncedSearch, isLoading, filtered, selectedAcc, selectedUser } =
    useWalletCombobox(value, accounts, users);

  const fieldClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-500";
  const labelClass = "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300";

  const siblingWallets = selectedAcc
    ? (userAccountsMap[selectedAcc.userId] || userAccountsMap[selectedAcc.email] || []).filter(
        (w: any) => w.id !== selectedAcc.id,
      )
    : [];

  return (
    <div className="relative space-y-2.5">
      <div>
        <label className={labelClass}>{label}</label>
        <div
          className={`${fieldClass} flex cursor-pointer items-center justify-between`}
          onClick={() => setOpen(!open)}
        >
          {selectedAcc ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200">
                {selectedUser?.avatar ? (
                  <img src={selectedUser.avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {(selectedAcc.owner[0] || "?").toUpperCase()}
                  </div>
                )}
              </div>
              <div className="truncate">
                <span className="font-medium text-gray-900 dark:text-white">{selectedAcc.owner}</span>{" "}
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  {selectedAcc.displayName || selectedAcc.typeLabel}
                </span>{" "}
                <span className="font-mono text-xs text-gray-500">({selectedAcc.accountNumber})</span> —{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyAmount(selectedAcc.balance, selectedAcc.currency)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
      </div>

      {/* Quick Switcher for All Other Wallets Associated with the Selected User */}
      {selectedAcc && siblingWallets.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Wallet size={13} /> Other Accounts Owned by {selectedAcc.owner} ({siblingWallets.length}) — Click to Switch
          </p>
          <div className="flex flex-wrap gap-2">
            {siblingWallets.map((w: any) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onChange(w.id, w)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition-all hover:border-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <span className="text-indigo-600 dark:text-indigo-400">{w.displayName || w.typeLabel}</span>
                <span className="font-mono text-gray-400">•••• {w.accountNumber.slice(-4)}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyAmount(w.balance, w.currency)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="sticky top-0 border-b border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <input
              autoFocus
              placeholder="Search by customer name, email, account number, or account type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {isLoading && debouncedSearch.length >= 3 ? (
            <div className="p-5 text-center text-sm text-gray-500">Searching accounts...</div>
          ) : filtered.length === 0 ? (
            <div className="p-5 text-center text-sm text-gray-500">No matching accounts found.</div>
          ) : (
            <div className="divide-y divide-gray-50 p-1.5 dark:divide-gray-800/60">
              {filtered.map((acc) => {
                const u = users.find((user) => user.email === acc.email) || { avatar: acc.userAvatar };
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onChange(acc.id, acc);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-indigo-50/60 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                        {u?.avatar ? (
                          <img src={u.avatar} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            {(acc.owner[0] || "?").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {acc.owner}
                          </span>
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {acc.typeLabel}
                          </span>
                        </div>
                        <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {acc.nickname ? `${acc.nickname} · ` : ""}
                          <span className="font-mono">{acc.accountNumber}</span> · {acc.email}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyAmount(acc.balance, acc.currency)}
                      </p>
                      <p className="text-[11px] uppercase text-gray-400">{acc.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OperationForm({ type, onSuccess }: { type: OperationType; onSuccess: () => void }) {
  const config = opConfig[type];

  const { rawAccounts, userAccountsMap, refetch } = useAccountsManagement();
  const { allUsers } = useAllUsers();

  const {
    form,
    setForm,
    set,
    loading,
    lastResult,
    isValid,
    handleSubmit,
    isConfirmOpen,
    setIsConfirmOpen,
    handleConfirm,
  } = useWalletOperationForm(
    type,
    config.endpoint,
    config.label,
    () => {
      refetch();
      onSuccess();
    },
    rawAccounts,
  );

  const fieldClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-500";
  const labelClass = "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Wallet ID fields */}
      {type === "transfer" ? (
        <div className="grid grid-cols-1 gap-5">
          <UserWalletCombobox
            label="From Source Account / Wallet"
            placeholder="Select source customer account..."
            value={form.fromWalletId}
            onChange={(val, acc) =>
              setForm((f) => ({ ...f, fromWalletId: val, ...(acc?.currency ? { currency: acc.currency } : {}) }))
            }
            accounts={rawAccounts}
            users={allUsers}
            userAccountsMap={userAccountsMap}
          />
          <UserWalletCombobox
            label="To Destination Account / Wallet"
            placeholder="Select destination customer account..."
            value={form.toWalletId}
            onChange={(val) => setForm((f) => ({ ...f, toWalletId: val }))}
            accounts={rawAccounts}
            users={allUsers}
            userAccountsMap={userAccountsMap}
          />
        </div>
      ) : (
        <UserWalletCombobox
          label="Target Customer Account / Wallet"
          placeholder="Select customer wallet, savings, current, or fixed deposit account..."
          value={form.walletId}
          onChange={(val, acc) =>
            setForm((f) => ({ ...f, walletId: val, ...(acc?.currency ? { currency: acc.currency } : {}) }))
          }
          accounts={rawAccounts}
          users={allUsers}
          userAccountsMap={userAccountsMap}
        />
      )}

      {/* Amount + Currency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Amount</label>
          <div className="relative">
            <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              min="0.01"
              step="0.01"
              className={`${fieldClass} pl-10 font-medium`}
              placeholder="0.00"
              value={form.amount}
              onChange={set("amount")}
              required
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <select className={fieldClass} value={form.currency} onChange={set("currency")}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>
          Transaction Description <span className="font-normal text-gray-400">(visible on customer statement)</span>
        </label>
        <input
          className={fieldClass}
          placeholder="e.g. Wire Deposit Credit, Account Adjustment, Interest Payout"
          value={form.description}
          onChange={set("description")}
        />
      </div>

      {/* Reason */}
      <div>
        <label className={labelClass}>
          Internal Audit Note <span className="font-normal text-gray-400">(admin log)</span>
        </label>
        <textarea
          className={`${fieldClass} resize-none`}
          rows={2}
          placeholder="Reason for audit trail..."
          value={form.reason}
          onChange={set("reason")}
        />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-950/20">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          This operation updates the exact selected wallet balance immediately and records a ledger entry.
        </p>
      </div>

      <motion.button
        type="submit"
        disabled={loading || !isValid()}
        whileHover={{ scale: isValid() ? 1.01 : 1 }}
        whileTap={{ scale: 0.98 }}
        className={`flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r ${config.color} py-3.5 text-base font-medium text-white shadow-md transition-opacity disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : config.icon}
        {loading ? "Processing Operation…" : config.label}
      </motion.button>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={`Confirm ${config.label}`}
        description="Please review the transaction details before confirming."
        footer={
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleConfirm}>
              Confirm & Execute
            </Button>
          </div>
        }
      >
        <div className="space-y-3 rounded-2xl bg-gray-50 p-5 text-sm dark:bg-gray-800">
          <div className="flex justify-between border-b border-gray-200 pb-2.5 dark:border-gray-700">
            <span className="text-gray-500">Operation</span>
            <span className="font-semibold capitalize text-gray-900 dark:text-white">{type}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2.5 dark:border-gray-700">
            <span className="text-gray-500">Amount</span>
            <span className="text-base font-medium text-gray-900 dark:text-white">
              {formatCurrencyAmount(Number(form.amount) || 0, form.currency)}
            </span>
          </div>
          {type === "transfer" ? (
            <>
              <div className="flex justify-between border-b border-gray-200 pb-2.5 dark:border-gray-700">
                <span className="text-gray-500">From Wallet ID</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{form.fromWalletId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2.5 dark:border-gray-700">
                <span className="text-gray-500">To Wallet ID</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{form.toWalletId}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between border-b border-gray-200 pb-2.5 dark:border-gray-700">
              <span className="text-gray-500">Target Wallet ID</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{form.walletId}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Success result */}
      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800/30 dark:bg-emerald-950/20"
        >
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Operation executed successfully
            </p>
          </div>
          {(lastResult?.transaction?.referenceNumber || lastResult?.data?.transaction?.referenceNumber) && (
            <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
              Ref: {lastResult?.transaction?.referenceNumber || lastResult?.data?.transaction?.referenceNumber}
            </p>
          )}
        </motion.div>
      )}
    </form>
  );
}

export default function WalletOperations() {
  const [activeOp, setActiveOp] = useState<OperationType>("credit");

  return (
    <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
      <PageHeader
        title="Wallet & Account Operations"
        subtitle="Credit, debit, or transfer funds across any customer Personal, Business, Savings, Current, or Fixed Deposit account"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Accounts", href: "/admin/accounts" },
          { label: "Operations" },
        ]}
      />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800/30 dark:bg-blue-950/20">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Select any customer account below. When a customer has multiple accounts (e.g., Personal Wallet, Savings,
          Current, Fixed Deposit), all of their associated accounts appear so you can target the exact account.
        </p>
      </div>

      {/* Operation selector */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["credit", "debit", "transfer"] as OperationType[]).map((op) => {
          const cfg = opConfig[op];
          const active = activeOp === op;
          return (
            <motion.button
              key={op}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveOp(op)}
              className={`flex flex-col items-start gap-3.5 rounded-2xl border p-6 text-left transition-all ${
                active
                  ? "border-transparent bg-white shadow-lg ring-2 ring-indigo-500 dark:bg-gray-900 dark:ring-indigo-400"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/60"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.color} text-white shadow-md`}
              >
                {cfg.icon}
              </div>
              <div>
                <p
                  className={`text-base font-semibold ${
                    active ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {cfg.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400 sm:text-sm">{cfg.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Form + Guide */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <DashCard padding="lg">
            <SectionHeader
              title={opConfig[activeOp].label}
              subtitle="Choose the exact customer wallet or account below"
            />
            <div className="mt-5">
              <OperationForm key={activeOp} type={activeOp} onSuccess={() => {}} />
            </div>
          </DashCard>
        </div>

        {/* Help panel */}
        <div className="lg:col-span-5">
          <DashCard padding="lg">
            <SectionHeader title="Operation Guide" subtitle="How multi-account wallet operations work" />
            <div className="mt-5 space-y-5">
              {(["credit", "debit", "transfer"] as OperationType[]).map((op) => {
                const cfg = opConfig[op];
                return (
                  <div key={op} className="flex gap-3.5 rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/40">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.color} text-white`}
                    >
                      {cfg.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{cfg.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm">
                        {cfg.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashCard>
        </div>
      </div>
    </PageContainer>
  );
}
