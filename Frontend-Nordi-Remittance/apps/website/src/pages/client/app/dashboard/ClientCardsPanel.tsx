import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DashCard, SectionHeader } from "@components/shared/DashboardPrimitives";
import { SkeletonBlock } from "@components/skeletons/Skeletons";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatCurrency } from "@core/algo";
import { CardFace } from "@pages/client/components/card-ui-utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// SINGLE CARD (Delegates to canonical 3D CardFace with 360° edge hover & See Details)
// ============================================================================
const CreditCard: React.FC<{ card: CardItem }> = ({ card }) => {
  const mappedStatus =
    card.status === "frozen" ? "blocked" : ((card.status || "active") as any);

  return (
    <CardFace
      show={true}
      size="compact"
      card={{
        id: card.id,
        cardId: card.cardId,
        fullCardNumber: (card as any).fullCardNumber,
        fullCvv: (card as any).fullCvv,
        cardholderName: card.name || "Card Holder",
        cardType: (card.cardType || (card.isVirtual ? "virtual" : "debit")) as any,
        cardBrand: (card.cardBrand || "visa") as any,
        last4: card.lastFour || "••••",
        expiryDate: card.expiryDate || "••/••",
        balance: card.balance ?? Math.max(0, (card.spendLimit || 0) - (card.usedAmount || 0)),
        creditLimit: card.creditLimit || card.spendLimit || 0,
        currency: card.currency || "USD",
        status: mappedStatus,
        isPhysical: card.isPhysical ?? !card.isVirtual,
      }}
    />
  );
};

// ============================================================================
// SPEND BAR
// ============================================================================
const SpendBar: React.FC<{ card: CardItem }> = ({ card }) => {
  const pct = card.spendLimit > 0 ? Math.min((card.usedAmount / card.spendLimit) * 100, 100) : 0;
  const isHigh = pct >= 80;

  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] sm:text-xs mb-1">
        <span className="text-gray-500 dark:text-gray-400">Monthly Spend</span>
        <span className={`font-medium ${isHigh ? "text-rose-600 dark:text-rose-400" : "text-gray-700 dark:text-gray-300"}`}>
          {formatCurrency(card.usedAmount)} / {formatCurrency(card.spendLimit)}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isHigh ? "bg-rose-500" : "bg-blue-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface ClientCardsPanelProps {
  cards: CardItem[];
  cardsData: ClientCardsDetailData;
  isLoading: boolean;
}

const ClientCardsPanel: React.FC<ClientCardsPanelProps> = ({ cards, cardsData, isLoading }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <DashCard className="flex-1">
        <SkeletonBlock className="h-5 w-36 mb-4" />
        <SkeletonBlock className="h-40 w-full rounded-2xl mb-3" />
        <SkeletonBlock className="h-3 w-full" />
      </DashCard>
    );
  }

  const hasCards = cards.length > 0;
  const currentCard = hasCards ? cards[activeIndex] || cards[0] : null;

  const scrollToCard = (index: number) => {
    setActiveIndex(index);
    const el = carouselRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    }
  };

  const prev = () => scrollToCard(activeIndex === 0 ? cards.length - 1 : activeIndex - 1);
  const next = () => scrollToCard(activeIndex === cards.length - 1 ? 0 : activeIndex + 1);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || cards.length <= 1) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const idx = Math.round(el.scrollLeft / (width * 0.88));
    const clamped = Math.max(0, Math.min(cards.length - 1, idx));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  };

  return (
    <DashCard className="w-full min-w-0 flex-1 overflow-hidden">
      <SectionHeader
        title="My Cards"
        subtitle={`${cardsData.totalCards} card${cardsData.totalCards !== 1 ? "s" : ""} · ${cardsData.activeCards} active`}
        onActionClick={() => navigate("/customer/cards")}
        actionLabel="Manage"
      />

      {hasCards ? (
        <>
          {/* Card Carousel — natively slidable left/right on mobile */}
          <div className="relative">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 touch-pan-x scrollbar-hide"
            >
              {cards.map((card, i) => (
                <div
                  key={card.id || i}
                  className={cards.length > 1 ? "min-w-[88%] shrink-0 snap-center sm:min-w-full" : "w-full shrink-0"}
                >
                  <CreditCard card={card} />
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            {cards.length > 1 && (
              <>
                <motion.button
                  className="hidden sm:flex absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center z-30"
                  whileTap={{ scale: 0.85 }}
                  onClick={prev}
                >
                  <ChevronLeft size={14} className="text-white" />
                </motion.button>
                <motion.button
                  className="hidden sm:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center z-30"
                  whileTap={{ scale: 0.85 }}
                  onClick={next}
                >
                  <ChevronRight size={14} className="text-white" />
                </motion.button>
              </>
            )}
          </div>

          {/* Dots */}
          {cards.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {cards.map((_, i) => (
                <button
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-5 bg-blue-500"
                      : "w-1.5 bg-gray-300 dark:bg-gray-600"
                  }`}
                  onClick={() => scrollToCard(i)}
                />
              ))}
            </div>
          )}

          {/* Spend Bar */}
          {currentCard && <SpendBar card={currentCard} />}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{cardsData.activeCards}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Active</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-sky-50 dark:bg-sky-950/30">
              <p className="text-sm font-medium text-sky-700 dark:text-sky-400">{cardsData.frozenCards}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Frozen</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">{formatCurrency(cardsData.totalSpending)}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Total Spent</p>
            </div>
          </div>
        </>
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center py-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Plus size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No cards yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Add your first card to get started</p>
          <motion.button
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg"
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/customer/cards")}
          >
            Add Card
          </motion.button>
        </motion.div>
      )}
    </DashCard>
  );
};

export default ClientCardsPanel;
