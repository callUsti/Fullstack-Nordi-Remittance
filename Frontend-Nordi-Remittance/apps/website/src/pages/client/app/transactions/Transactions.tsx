// ============================================================================
// TRANSACTIONS — Main transactions dashboard (Dark mode + Shared Primitives)
// ============================================================================

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Repeat,
  Download,
  Clock,
  CheckCircle2,
  RefreshCw,
  Send,
  Calendar,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { StatsGridSkeleton, TransactionListSkeleton } from "@components/skeletons";
import { useClientTransactions } from "../../client-usecase/usetransaction-client-usecase";
import { useUIStore } from "@store/ui.store";
import {
  PageContainer,
  StatCard,
  StatsGrid,
  DashCard,
  FilterBar,
  FilterSelect,
  ActionButton,
  QuickLinkCard,
  QuickLinksGrid,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import ClientTransactionsTable from "./ClientTransactionsTable";

/* eslint-disable @typescript-eslint/no-explicit-any */

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const showBalances = useUIStore((s) => s.preferences.showBalances);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { transactions, isLoading, refetch } = useClientTransactions({ page: 1, limit: 50 });

  const stats = useMemo(() => {
    const total = transactions.length;
    const completed = transactions.filter((t: any) => t.status === "completed" || t.status === "success").length;
    const pending = transactions.filter((t: any) => t.status === "pending" || t.status === "processing").length;
    const totalAmount = transactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    return { total, completed, pending, totalAmount };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return transactions.filter((t: any) => {
      const matchSearch =
        !q ||
        t.description?.toLowerCase().includes(q) ||
        t.purpose?.toLowerCase().includes(q) ||
        t.senderBank?.toLowerCase().includes(q) ||
        t.bankName?.toLowerCase().includes(q) ||
        t.reference?.toLowerCase().includes(q) ||
        t.referenceNumber?.toLowerCase().includes(q) ||
        t.recipientName?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchType = typeFilter === "all" || t.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [transactions, searchQuery, statusFilter, typeFilter]);

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

  return (
    <PageContainer>
      {/* Header */}
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Transactions"
          subtitle="View and manage all your financial transactions"
          breadcrumbs={[{ label: "Dashboard", href: "/customer/dashboard" }, { label: "Transactions" }]}
          actions={
            <div className="flex gap-2 sm:gap-3">
              <ActionButton
                label="Export"
                icon={<Download size={16} />}
                variant="secondary"
                onClick={() => navigate("/customer/transactions/download")}
              />
              <ActionButton
                label="New Transfer"
                icon={<Send size={16} />}
                onClick={() => navigate("/customer/send/domestic")}
              />
            </div>
          }
        />
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid
          cols={4}
          className="!flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 touch-pan-x scrollbar-hide sm:!grid sm:!grid-cols-2 lg:!grid-cols-4 sm:overflow-visible sm:pb-0 [&>*]:min-w-[76%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:min-w-0 sm:[&>*]:shrink"
        >
          <StatCard
            label="Total Transactions"
            value={stats.total}
            icon={<Repeat size={20} />}
            iconColor="bg-blue-600"
            index={0}
          />
          <StatCard
            label="Total Volume"
            value={showBalances ? formatCurrency(stats.totalAmount) : "••••••"}
            icon={<BarChart3 size={20} />}
            iconColor="bg-emerald-600"
            index={1}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={<CheckCircle2 size={20} />}
            iconColor="from-green-500 to-emerald-500"
            index={2}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<Clock size={20} />}
            iconColor="bg-amber-600"
            index={3}
          />
        </StatsGrid>
      )}

      {/* Filters */}
      <FilterBar searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search transactions...">
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "completed", label: "Completed" },
            { value: "pending", label: "Pending" },
            { value: "processing", label: "Processing" },
            { value: "failed", label: "Failed" },
          ]}
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All Types" },
            { value: "credit", label: "Credit" },
            { value: "debit", label: "Debit" },
            { value: "transfer", label: "Transfer" },
          ]}
        />
        <motion.button
          onClick={() => refetch()}
          className="rounded-lg bg-gray-100 p-1.5 text-blue-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 sm:p-2"
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={16} />
        </motion.button>
      </FilterBar>

      {/* Transaction List */}
      {isLoading ? (
        <TransactionListSkeleton count={8} />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          title="No Transactions Found"
          description={
            searchQuery
              ? "No transactions match your search criteria."
              : "Your transaction history will appear here once you start making transfers."
          }
          variant={searchQuery ? "search" : "default"}
          action={{ label: "Make a Transfer", onClick: () => navigate("/customer/send/domestic") }}
        />
      ) : (
        <DashCard padding="none" className="w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 p-3 dark:border-gray-800 sm:p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
              All Transactions ({filteredTransactions.length})
            </h3>
            <motion.button
              onClick={() => navigate("/customer/transactions/history")}
              className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 sm:text-xs"
              whileHover={{ x: 2 }}
            >
              View All <ChevronRight size={14} />
            </motion.button>
          </div>
          <ClientTransactionsTable transactions={filteredTransactions.slice(0, 25)} showBalances={showBalances} />
        </DashCard>
      )}

      {/* Quick Links */}
      <QuickLinksGrid>
        <QuickLinkCard
          label="Recent Activity"
          icon={<Clock size={20} />}
          route="/customer/transactions/recent"
          iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
        />
        <QuickLinkCard
          label="Scheduled"
          icon={<Calendar size={20} />}
          route="/customer/transactions/scheduled"
          iconColor="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
        />
        <QuickLinkCard
          label="Full History"
          icon={<BarChart3 size={20} />}
          route="/customer/transactions/history"
          iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
        />
        <QuickLinkCard
          label="Download"
          icon={<Download size={20} />}
          route="/customer/transactions/download"
          iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
        />
      </QuickLinksGrid>
    </PageContainer>
  );
};

export default Transactions;
