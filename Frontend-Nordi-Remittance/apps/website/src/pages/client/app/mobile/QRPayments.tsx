// ============================================================================
// MOBILE SUB-PAGES — QR Payments
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Accounts / Wallet Module
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";
import { formatCurrency } from "@core/algo";

const QRPayments: React.FC = () => {
  const [tab, setTab] = useState<"scan" | "generate">("scan");
  const { wallets, isLoading } = useClientWallets();
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");

  const activeWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="QR Payments"
          subtitle="Pay or receive money seamlessly using QR codes"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Mobile Banking", href: "/customer/mobile" },
            { label: "QR Payments" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2 mb-6">
            {(["scan", "generate"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {t === "scan" ? "Scan QR Code" : "Receive via QR"}
              </button>
            ))}
          </div>

          <DashCard className="text-center py-8 sm:py-10">
            {tab === "scan" ? (
              <>
                <div className="w-48 h-48 mx-auto rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4 bg-gray-50 dark:bg-gray-900/40">
                  <QrCode size={64} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">Scan QR Code</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Point your camera at a merchant or user QR code to initiate transfer</p>
                <motion.button
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Activate Scanner
                </motion.button>
              </>
            ) : (
              <>
                {wallets.length > 1 && (
                  <div className="mb-4 text-left max-w-xs mx-auto">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deposit to Wallet
                    </label>
                    <select
                      value={activeWallet?.id || ""}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.type.toUpperCase()} ({w.primaryCurrency}) - {formatCurrency(w.primaryCurrencyBalance, w.primaryCurrency)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="w-48 h-48 mx-auto rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4 p-4 shadow-inner">
                  <div className="w-full h-full bg-blue-50/70 dark:bg-gray-900 rounded-lg flex flex-col items-center justify-center p-2">
                    <QrCode size={56} className="text-blue-600 dark:text-blue-400 mb-1" />
                    <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate max-w-full">
                      {activeWallet?.walletNumber || "NRD-WALLET"}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">Your Receiving QR</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Balance: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(activeWallet?.primaryCurrencyBalance ?? 0, activeWallet?.primaryCurrency || "USD")}</span>
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-6">Scan to receive instant deposits directly into this wallet</p>
                <motion.button
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Download QR Badge
                </motion.button>
              </>
            )}
          </DashCard>

          <DashCard className="mt-6">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">How QR Payments Work</h3>
            <div className="space-y-3">
              {[
                { step: "1", text: "Select destination wallet and generate or scan QR code" },
                { step: "2", text: "Review payment details, conversion rates, and counterparty" },
                { step: "3", text: "Confirm and funds settle instantly in real-time" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {s.step}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{s.text}</p>
                </div>
              ))}
            </div>
          </DashCard>
        </div>
      )}
    </PageContainer>
  );
};

export default QRPayments;
