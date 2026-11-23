// ============================================================================
// BENEFICIARIES — Spacious grid of saved internal & external transfer recipients
// ============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, X, Loader2, Building2, Mail, ArrowUpRight, UserCheck } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, DashCard } from "@components/shared/DashboardPrimitives";
import { AccountListSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientBeneficiaries,
  useAddBeneficiary,
  useRemoveBeneficiary,
} from "../../client-usecase/useaccounts-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";
const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

const AddBeneficiaryModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [form, setForm] = useState({
    accountNumber: "",
    email: "",
    name: "",
    nickname: "",
    bankName: "",
    bankCode: "",
  });
  const addBeneficiary = useAddBeneficiary();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit = form.accountNumber.trim() !== "" || form.email.trim() !== "";

  const handleSubmit = () => {
    addBeneficiary.mutate(
      {
        accountNumber: form.accountNumber || undefined,
        email: form.email || undefined,
        name: form.name || undefined,
        nickname: form.nickname || undefined,
        bankName: form.bankName || undefined,
        bankCode: form.bankCode || undefined,
        type: form.bankName ? "external" : "internal",
      },
      {
        onSuccess: () => {
          setForm({ accountNumber: "", email: "", name: "", nickname: "", bankName: "", bankCode: "" });
          onClose();
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-t-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:rounded-3xl sm:p-8"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">Add Beneficiary</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Save a Nordi user or external bank recipient for one-click transfers
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Account / Wallet Number</label>
                  <input
                    className={inputCls}
                    value={form.accountNumber}
                    onChange={set("accountNumber")}
                    placeholder="e.g. W1700000000 or IBAN"
                  />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input
                    className={inputCls}
                    value={form.email}
                    onChange={set("email")}
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Recipient Full Name</label>
                  <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className={labelCls}>Nickname (optional)</label>
                  <input
                    className={inputCls}
                    value={form.nickname}
                    onChange={set("nickname")}
                    placeholder="e.g. Landlord, Family"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Bank Name (for external)</label>
                  <input
                    className={inputCls}
                    value={form.bankName}
                    onChange={set("bankName")}
                    placeholder="Nordi Remittance (Default)"
                  />
                </div>
                <div>
                  <label className={labelCls}>SWIFT / Routing Code</label>
                  <input className={inputCls} value={form.bankCode} onChange={set("bankCode")} placeholder="Optional" />
                </div>
              </div>

              {addBeneficiary.isError && (
                <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  {(addBeneficiary.error as any)?.response?.data?.message || "Couldn't add beneficiary. Try again."}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || addBeneficiary.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white shadow-md disabled:opacity-50 sm:text-base"
              >
                {addBeneficiary.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {addBeneficiary.isPending ? "Saving Beneficiary..." : "Save Beneficiary"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Beneficiaries: React.FC = () => {
  const navigate = useNavigate();
  const { beneficiaries, isLoading } = useClientBeneficiaries();
  const removeBeneficiary = useRemoveBeneficiary();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const handleRemove = (id: string) => {
    setPendingRemoveId(id);
    removeBeneficiary.mutate(id as UUID, { onSettled: () => setPendingRemoveId(null) });
  };

  return (
    <PageContainer>
      <AddBeneficiaryModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Saved Beneficiaries"
          subtitle="Manage your trusted internal and external recipients for fast transfers"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: "Beneficiaries" },
          ]}
          actions={
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-md transition-all hover:opacity-95"
            >
              <Plus size={18} /> Add Beneficiary
            </button>
          }
        />
      </motion.div>

      {isLoading ? (
        <AccountListSkeleton count={3} />
      ) : beneficiaries.length === 0 ? (
        <EmptyState
          title="No Saved Beneficiaries Yet"
          description="Save people and businesses you send money to often so you don't have to re-enter their account details every time."
          action={{ label: "Add Your First Beneficiary", onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {beneficiaries.map((b) => (
            <DashCard key={b.id} padding="lg" hover className="flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      {b.type === "external" ? <Building2 size={22} /> : <UserCheck size={22} />}
                    </div>
                    <div>
                      <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {b.type === "external" ? "External Bank" : "Nordi Account"}
                      </span>
                      <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {b.nickname || b.name || "Saved Recipient"}
                      </h4>
                      {b.nickname && b.name && b.nickname !== b.name && (
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{b.name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(b.id)}
                    disabled={pendingRemoveId === b.id}
                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-rose-950/30"
                    title="Remove beneficiary"
                  >
                    {pendingRemoveId === b.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>

                <div className="mb-5 space-y-2 rounded-2xl bg-gray-50/90 p-4 text-sm dark:bg-gray-800/50">
                  {b.accountNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase text-gray-400">Account</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{b.accountNumber}</span>
                    </div>
                  )}
                  {b.email && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-medium uppercase text-gray-400">
                        <Mail size={12} /> Email
                      </span>
                      <span className="truncate font-semibold text-gray-800 dark:text-gray-200">{b.email}</span>
                    </div>
                  )}
                  {b.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase text-gray-400">Bank</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{b.bankName}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate("/customer/send/domestic")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950/80"
              >
                <ArrowUpRight size={16} /> Send Money
              </button>
            </DashCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default Beneficiaries;
