// ============================================================================
// CARDS SUB-PAGE — Apply For Card
// Strictly consumes domain hook without raw logic in UI component
// ============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Shield, Smartphone, MapPin, AlertTriangle } from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import { PageContainer, DashCard } from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useApplyForCardDomain } from "../../client-usecase/useCards-client-usecase";
import { CARD_BRANDS } from "@domain/types/Card.types";
import { CardFace, fmt } from "@pages/client/components/card-ui-utils";

const ApplyForCard: React.FC = () => {
  const {
    handleApply,
    isApplying,
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    creditLimit,
    setCreditLimit,
    selectedBrand,
    setSelectedBrand,
    cardholderName,
    setCardholderName,
    shippingAddress,
    setShippingAddress,
    activeWallet,
    hasExistingPhysicalCard,
    cardLimitReached,
    hasSufficientFundsForPhysical,
    issuanceFee,
  } = useApplyForCardDomain();

  const [activeType, setActiveType] = useState<"virtual" | "credit" | "physical">("virtual");

  const addressComplete = !!shippingAddress.street && !!shippingAddress.city && !!shippingAddress.country;

  const physicalBlockedReason = cardLimitReached
    ? "You've reached the 5-card limit on this account."
    : hasExistingPhysicalCard
      ? "You already have a physical card on this account."
      : !hasSufficientFundsForPhysical
        ? `Your selected account needs at least ${fmt(issuanceFee, activeWallet?.currency)} to cover the issuance fee.`
        : null;

  const canSubmit =
    !cardLimitReached &&
    Boolean(selectedWalletId) &&
    (activeType === "virtual" || activeType === "credit" || (!physicalBlockedReason && addressComplete));

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Apply for a New Card"
          subtitle="Configure and request your next digital or physical premium card instantly."
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Cards", href: "/customer/cards" },
            { label: "Apply" },
          ]}
        />
      </motion.div>

      {cardLimitReached && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={18} />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            You've reached the maximum of 5 cards on this account. Cancel an existing card from Cards Overview before
            applying for a new one.
          </p>
        </div>
      )}

      <div className="my-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Configuration */}
        <motion.div variants={dashboardItemVariants} className="space-y-6 lg:col-span-7">
          {/* Card Type Selection */}
          <DashCard className="border border-gray-100 p-6 shadow-sm dark:border-gray-800">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">1. Select Card Type</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveType("virtual")}
                className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition-all ${
                  activeType === "virtual"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                    : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <div
                  className={`shrink-0 rounded-xl p-2 ${activeType === "virtual" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}
                >
                  <Smartphone size={20} />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">Virtual Debit</span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    Instant digital card funded directly from your selected account.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveType("credit")}
                className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition-all ${
                  activeType === "credit"
                    ? "border-purple-600 bg-purple-50/50 dark:bg-purple-900/20"
                    : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <div
                  className={`shrink-0 rounded-xl p-2 ${activeType === "credit" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">Virtual Credit</span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    Fund on credit (5.0% interest). Reads as debt on your linked account until repaid.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveType("physical")}
                disabled={cardLimitReached || hasExistingPhysicalCard}
                className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  activeType === "physical"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20"
                    : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <div
                  className={`shrink-0 rounded-xl p-2 ${activeType === "physical" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">Physical Card</span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    Plastic card shipped to your address · {fmt(issuanceFee, activeWallet?.currency)} fee.
                  </span>
                </div>
              </button>
            </div>

            {/* Active Account Selector (Linked for funding, empty-card auto-debit, or credit debt repayment) */}
            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
              <label className="mb-1.5 block text-xs font-semibold text-gray-800 dark:text-gray-200">
                Link to Active Account (for funding, fallback auto-debit &amp; credit debt repayment)
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              >
                {wallets.map((w: any) => {
                  const wId = w.id || w._id;
                  const bal = w.primaryCurrencyBalance ?? w.balance ?? 0;
                  const curr = w.primaryCurrency || w.currency || "USD";
                  return (
                    <option key={wId} value={wId}>
                      {w.displayName || w.typeLabel || w.walletType || "Account"} ({w.walletNumber || wId.slice(-6)}) — Available: {fmt(bal, curr)}
                    </option>
                  );
                })}
              </select>
              <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                {activeType === "credit"
                  ? "Amounts funded on credit (+5.0% interest) will be recorded as debt on this account and debited from it until paid off."
                  : "Card funding and automatic fallback debits when the card is empty will be drawn from this account."}
              </p>
            </div>

            {activeType === "credit" && (
              <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/70 p-4 dark:border-purple-800/50 dark:bg-purple-950/25">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                      Credit Facility Limit &amp; Interest Terms
                    </p>
                    <p className="mt-0.5 text-[11px] text-purple-700 dark:text-purple-300">
                      5.0% facility interest applies to amounts you fund onto your credit card. Debt is linked to your selected account.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase text-purple-800 dark:text-purple-300">
                      Requested Credit Limit ($)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      max={100000}
                      step={500}
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(Number(e.target.value) || 10000)}
                      className="w-36 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 dark:border-purple-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeType === "physical" && physicalBlockedReason && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 dark:border-red-900/40 dark:bg-red-950/30">
                <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={15} />
                <p className="text-xs text-red-600 dark:text-red-400">{physicalBlockedReason}</p>
              </div>
            )}
          </DashCard>

          {/* Card Brand Selection */}
          <DashCard className="border border-gray-100 p-6 shadow-sm dark:border-gray-800">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">2. Select Payment Network</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CARD_BRANDS.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${
                    selectedBrand === brand.id
                      ? "border-blue-600 bg-blue-50/20 dark:bg-blue-900/10"
                      : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                  }`}
                >
                  <img src={brand.icon} alt={brand.name} className="mb-3 h-8 object-contain" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{brand.name}</span>
                </button>
              ))}
            </div>
          </DashCard>

          {/* Cardholder name — virtual/credit only; physical always uses your account name */}
          {(activeType === "virtual" || activeType === "credit") && (
            <DashCard className="border border-gray-100 p-6 shadow-sm dark:border-gray-800">
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">3. Cardholder Name (optional)</h3>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Defaults to your account name"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              />
            </DashCard>
          )}

          {/* Shipping Address (Only for Physical) */}
          <AnimatePresence>
            {activeType === "physical" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <DashCard className="border border-gray-100 p-6 shadow-sm dark:border-gray-800">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <MapPin size={16} className="text-gray-400" /> 3. Shipping Address
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress((p) => ({ ...p, street: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder:text-gray-500"
                        placeholder="123 Main St, Apt 4B"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                        City
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress((p) => ({ ...p, city: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress((p) => ({ ...p, state: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress((p) => ({ ...p, zipCode: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                        Country
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress((p) => ({ ...p, country: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </DashCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column: Preview & Submit */}
        <motion.div variants={dashboardItemVariants} className="lg:col-span-5">
          <DashCard className="sticky top-6 overflow-hidden border border-gray-100 p-4 shadow-xl dark:border-gray-800 sm:p-5">
            {/* Interactive 3D Card Preview Graphic */}
            <CardFace
              show={true}
              card={{
                cardholderName: (cardholderName || "YOUR NAME").toUpperCase(),
                cardType: activeType === "credit" ? "credit" : activeType === "virtual" ? "virtual" : "debit",
                cardBrand: selectedBrand,
                last4: "8842",
                expiryDate: "08/29",
                balance: activeType === "credit" ? creditLimit : activeWallet?.balance || 0,
                creditLimit: activeType === "credit" ? creditLimit : 0,
                currency: activeWallet?.currency || "USD",
                status: "active",
                isPhysical: activeType === "physical",
              }}
            />

            <div className="p-6">
              <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Summary</h4>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Card Type</span>
                  <span className="font-medium capitalize text-gray-900 dark:text-white">{activeType} Card</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Network</span>
                  <span className="font-medium capitalize text-gray-900 dark:text-white">{selectedBrand}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Issuance Fee</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activeType === "physical" ? fmt(issuanceFee, activeWallet?.currency) : "Free"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Annual Fee</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Free</span>
                </div>
                {activeWallet && (
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Funding Wallet Balance</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fmt(activeWallet.balance, activeWallet.currency)}
                    </span>
                  </div>
                )}
              </div>

              <motion.button
                onClick={() => handleApply(activeType)}
                disabled={isApplying || !canSubmit}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isApplying ? "Processing Application..." : "Submit Application"}
              </motion.button>

              {activeType === "physical" && !physicalBlockedReason && !addressComplete && (
                <p className="mt-3 text-center text-[11px] font-medium text-red-500">
                  Please fill in your complete shipping address.
                </p>
              )}
            </div>
          </DashCard>
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default ApplyForCard;
