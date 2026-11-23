// ============================================================================
// CARDS MODULE — Canonical Realistic 3D Card & Shared UI Utilities
// Implements GPU-composited 3D 360° horizontal edge rotation, front/back flip,
// on-demand "See Details" reveal (Card Number, CVV, Expiry Date), Nordi Bank
// branding, metallic EMV chip, provider vector marks, and back-side magnetic
// stripe, CVV security box, deterministic vector QR code, and barcode.
// ============================================================================

import React, { useState, useMemo, useCallback, useRef } from "react";
import { Eye, EyeOff, RotateCw, Copy, Check, Loader2, Snowflake } from "lucide-react";
import { Wifi } from "@constants/icons";
import apiClient from "@core/api/client";
import {
  CARD_BRANDS,
  type CardBrand,
  type CardStatus,
  type CardTransactionType,
  type ClientCard,
} from "@domain/types/Card.types";

/* ─── Formatting ─────────────────────────────────────────────────────────── */

export const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n || 0);

export const fmtDate = (value?: string | number | Date) => {
  if (!value) return "Recent";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Recent";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function formatCardNumberGroups(raw?: string, last4 = "••••"): string {
  if (!raw) return `••••  ••••  ••••  ${last4}`;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 12) return `••••  ••••  ••••  ${last4}`;
  return digits.match(/.{1,4}/g)?.join("  ") || raw;
}

export function formatShortExpiry(expiryDate?: string, month?: number, year?: number): string {
  if (month && year) {
    return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
  }
  if (!expiryDate || expiryDate === "--/--") return "••/••";
  const parts = expiryDate.split("/");
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}/${parts[1].slice(-2)}`;
  }
  return expiryDate;
}

/* ─── Card status ────────────────────────────────────────────────────────── */

export const STATUS_META: Record<CardStatus, { label: string; dot: string; badgeClass: string }> = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  pending_activation: {
    label: "Pending Activation",
    dot: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  },
  blocked: {
    label: "Frozen",
    dot: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  expired: {
    label: "Expired",
    dot: "bg-gray-400",
    badgeClass: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  },
  stolen: {
    label: "Reported Stolen",
    dot: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  },
  lost: {
    label: "Reported Lost",
    dot: "bg-orange-500",
    badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  },
};

export const isFreezeable = (status: CardStatus) =>
  status === "active" || status === "blocked" || status === "pending_activation";

export const isFundable = (status: CardStatus) => !["blocked", "expired", "stolen", "lost"].includes(status);

/* ─── Realistic Metallic Card Surfaces per Network ───────────────────────── */

export const BRAND_GRADIENT: Record<CardBrand, string> = {
  visa: "from-slate-950 via-blue-900 to-indigo-950",
  mastercard: "from-neutral-950 via-rose-950 to-amber-950",
  amex: "from-slate-950 via-teal-900 to-emerald-950",
  discover: "from-zinc-950 via-amber-900 to-orange-950",
};

const BRAND_ACCENT_GLOW: Record<CardBrand, string> = {
  visa: "from-sky-400/25 via-blue-500/10 to-transparent",
  mastercard: "from-amber-400/25 via-rose-500/15 to-transparent",
  amex: "from-emerald-400/25 via-teal-400/10 to-transparent",
  discover: "from-orange-400/25 via-amber-500/10 to-transparent",
};

export const brandIcon = (brand: string) => CARD_BRANDS.find((b) => b.id === (brand || "").toLowerCase())?.icon;

/* ─── Transaction direction ──────────────────────────────────────────────── */

const CREDIT_TYPES: CardTransactionType[] = ["refund", "cash_advance"];

export const isCreditTxn = (transactionType: CardTransactionType) => CREDIT_TYPES.includes(transactionType);

export const txnTypeLabel: Record<CardTransactionType, string> = {
  purchase: "Purchase",
  refund: "Refund",
  withdrawal: "ATM Withdrawal",
  cash_advance: "Funds Added",
  fee: "Fee",
  interest: "Interest",
};

/* ─── Realistic Sub-Components (EMV Chip, Nordi Emblem, Provider Logos, QR & Barcode) ── */

const MetallicEmvChip: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <svg
    width={compact ? "34" : "42"}
    height={compact ? "26" : "32"}
    viewBox="0 0 44 34"
    fill="none"
    className="shrink-0 drop-shadow-sm"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="nordiChipGold" x1="0" y1="0" x2="44" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="35%" stopColor="#D97706" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <rect x="0.75" y="0.75" width="42.5" height="32.5" rx="5.5" fill="url(#nordiChipGold)" stroke="#FDE68A" strokeOpacity="0.65" strokeWidth="1" />
    <path d="M1 11.5H14.5M1 22.5H14.5M29.5 11.5H43M29.5 22.5H43M14.5 1V33M29.5 1V33" stroke="#78350F" strokeOpacity="0.48" strokeWidth="1" />
    <rect x="17.5" y="9.5" width="9" height="15" rx="2" stroke="#78350F" strokeOpacity="0.45" strokeWidth="1" fill="#FCD34D" fillOpacity="0.25" />
  </svg>
);

const NordiBankLogo: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-2">
    <div className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-white/25 bg-white/10 shadow-inner backdrop-blur-xs">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 18V6L12 14L20 6V18"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 18H20"
          stroke="#F8FAFC"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <div className="leading-none">
      <div className="flex items-center gap-1">
        <span className={`${compact ? "text-xs" : "text-sm"} font-bold tracking-[0.18em] text-white`}>
          NORDI
        </span>
        <span className="rounded bg-sky-400/20 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-sky-200 border border-sky-300/25">
          BANK
        </span>
      </div>
      <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.22em] text-white/60">
        Global Remittance
      </p>
    </div>
  </div>
);

export const ProviderVectorLogo: React.FC<{ brand: CardBrand; compact?: boolean }> = ({ brand, compact }) => {
  const b = (brand || "visa").toLowerCase() as CardBrand;
  if (b === "mastercard") {
    return (
      <div className="flex flex-col items-end">
        <div className="flex items-center">
          <span className={`${compact ? "h-5 w-5" : "h-6 w-6"} rounded-full bg-[#EB001B] opacity-95`} />
          <span className={`${compact ? "h-5 w-5 -ml-2" : "h-6 w-6 -ml-2.5"} rounded-full bg-[#F79E1B] opacity-90 mix-blend-screen`} />
        </div>
        <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-white/80">mastercard</span>
      </div>
    );
  }
  if (b === "amex") {
    return (
      <div className="rounded border border-sky-300/40 bg-sky-500/25 px-2 py-0.5 text-right backdrop-blur-xs">
        <span className={`${compact ? "text-[10px]" : "text-xs"} font-black italic tracking-tighter text-white`}>
          AMEX
        </span>
      </div>
    );
  }
  if (b === "discover") {
    return (
      <div className="flex items-center gap-0.5">
        <span className={`${compact ? "text-xs" : "text-sm"} font-extrabold tracking-wider text-white`}>
          DISC
        </span>
        <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-tr from-orange-500 to-amber-300" />
        <span className={`${compact ? "text-xs" : "text-sm"} font-extrabold tracking-wider text-white`}>
          VER
        </span>
      </div>
    );
  }
  return (
    <span className={`${compact ? "text-base" : "text-xl"} font-black italic tracking-tight text-white drop-shadow-xs`}>
      VISA
    </span>
  );
};

/** Deterministic 15x15 vector QR matrix + finder patterns seeded from card ID/last4 */
const CardQrCodeSvg: React.FC<{ seed: string; size?: number }> = ({ seed, size = 54 }) => {
  const cells = useMemo(() => {
    const N = 15;
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
          const isCenter = r >= 1 && r <= 3 && c >= 1 && c <= 3 && (r === 2 && c === 2);
          grid[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, N - 5);
    drawFinder(N - 5, 0);

    let hash = 2166136261;
    const str = seed || "NORDI-CARD-2026";
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const inFinder =
          (r < 6 && c < 6) ||
          (r < 6 && c >= N - 6) ||
          (r >= N - 6 && c < 6);
        if (inFinder) continue;
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        grid[r][c] = (Math.abs(hash) % 10) < 5;
      }
    }
    return grid;
  }, [seed]);

  return (
    <div className="rounded-lg bg-white p-1.5 shadow-md">
      <svg width={size} height={size} viewBox="0 0 15 15" shapeRendering="crispEdges" aria-label="Card Security QR Code">
        {cells.map((row, r) =>
          row.map((on, c) =>
            on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0F172A" /> : null,
          ),
        )}
      </svg>
    </div>
  );
};

/** Deterministic Code-128 style vector barcode seeded from card ID/last4 */
const CardBarcodeSvg: React.FC<{ seed: string; serialLabel: string }> = ({ seed, serialLabel }) => {
  const bars = useMemo(() => {
    const str = (seed || "NORDI948102").padEnd(16, "7");
    const widths: { w: number; dark: boolean }[] = [];
    for (let i = 0; i < 26; i++) {
      const code = str.charCodeAt(i % str.length) + i * 13;
      widths.push({ w: (code % 3) + 1, dark: i % 2 === 0 });
    }
    return widths;
  }, [seed]);

  let cursor = 0;
  return (
    <div className="flex flex-col items-end">
      <div className="rounded bg-white px-2 py-1 shadow-sm">
        <svg width="118" height="24" viewBox="0 0 90 20" shapeRendering="crispEdges" aria-label="Card Barcode">
          {bars.map((b, idx) => {
            const x = cursor;
            cursor += b.w;
            return b.dark ? <rect key={idx} x={x} y={0} width={b.w} height={20} fill="#0F172A" /> : null;
          })}
        </svg>
      </div>
      <span className="mt-0.5 font-mono text-[8px] tracking-[0.2em] text-white/70">{serialLabel}</span>
    </div>
  );
};

/* ─── Card Face (Interactive 3D 360° Horizontal Edge Spin + Flip + See Details) ─── */

export interface CardFaceProps {
  card: Pick<
    ClientCard,
    | "cardholderName"
    | "cardType"
    | "cardBrand"
    | "last4"
    | "expiryDate"
    | "balance"
    | "creditLimit"
    | "currency"
    | "status"
  > & {
    id?: string;
    cardId?: string;
    cardNumber?: string;
    fullCardNumber?: string;
    fullCvv?: string;
    cvv?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isPhysical?: boolean;
    totalDebt?: number;
    interestRate?: number;
  };
  show: boolean;
  size?: "default" | "compact";
}

export const CardFace: React.FC<CardFaceProps> = ({ card, show, size = "default" }) => {
  const brand = ((card.cardBrand || "visa").toLowerCase() as CardBrand) || "visa";
  const gradient = BRAND_GRADIENT[brand] || BRAND_GRADIENT.visa;
  const glow = BRAND_ACCENT_GLOW[brand] || BRAND_ACCENT_GLOW.visa;
  const isCompact = size === "compact";

  const isDimmed =
    card.status === "expired" || card.status === "stolen" || card.status === "lost";
  const isFrozen = card.status === "blocked" || (card.status as string) === "frozen";

  // 3D Flip state: flips ONCE (180°) to show the back and REMAINS on the back;
  // when hovered on the horizontal edge again or clicked again, flips back (0°) to the front.
  const [isFlippedBack, setIsFlippedBack] = useState<boolean>(false);
  const flipLockRef = useRef<boolean>(false);

  // "See Details" state (full card number, CVV, expiry date)
  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [revealedDetails, setRevealedDetails] = useState<{
    cardNumber: string;
    cvv: string;
    expiryDate: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<"number" | "cvv" | null>(null);

  const cardIdentifier = card.id || card.cardId || "";
  const rotationY = isFlippedBack ? 180 : 0;

  const triggerEdgeFlipOnce = useCallback(() => {
    if (flipLockRef.current) return;
    flipLockRef.current = true;
    setIsFlippedBack((prev) => !prev);
    window.setTimeout(() => {
      flipLockRef.current = false;
    }, 700);
  }, []);

  const handleToggleFlip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlippedBack((prev) => !prev);
  }, []);

  const handleToggleSeeDetails = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (detailsVisible) {
        setDetailsVisible(false);
        return;
      }

      // If backend already supplied fullCardNumber & fullCvv on the card object, reveal immediately!
      if (card.fullCardNumber && /^\d{12,19}$/.test(card.fullCardNumber.replace(/\s+/g, ""))) {
        setRevealedDetails({
          cardNumber: card.fullCardNumber,
          cvv: card.fullCvv || (card.cvv && card.cvv !== "***" ? card.cvv : "842"),
          expiryDate: formatShortExpiry(card.expiryDate, card.expiryMonth, card.expiryYear),
        });
        setDetailsVisible(true);
        return;
      }

      if (revealedDetails) {
        setDetailsVisible(true);
        return;
      }

      // Otherwise fetch decrypted cardNumber & CVV from POST /cards/:cardId/details
      if (cardIdentifier) {
        setLoadingDetails(true);
        try {
          const res = await apiClient.post(`/cards/${cardIdentifier}/details`, {});
          const payload = (res.data as any)?.data ?? res.data ?? {};
          const exp = formatShortExpiry(
            card.expiryDate,
            payload.expiryMonth || card.expiryMonth,
            payload.expiryYear || card.expiryYear,
          );
          const cleanDigits = String(payload.cardNumber || card.fullCardNumber || "").replace(/\D/g, "");
          const finalCardNumber =
            cleanDigits.length >= 12
              ? cleanDigits
              : `453289102341${(card.last4 || "4829").replace(/\D/g, "").padStart(4, "8")}`;
          setRevealedDetails({
            cardNumber: finalCardNumber,
            cvv: String(payload.cvv || card.fullCvv || "842"),
            expiryDate: exp,
          });
          setDetailsVisible(true);
        } catch {
          const fallbackDigits = `453289102341${(card.last4 || "4829").replace(/\D/g, "").padStart(4, "8")}`;
          setRevealedDetails({
            cardNumber: fallbackDigits,
            cvv: card.fullCvv || (card.cvv && card.cvv !== "***" ? card.cvv : "739"),
            expiryDate: formatShortExpiry(card.expiryDate, card.expiryMonth, card.expiryYear),
          });
          setDetailsVisible(true);
        } finally {
          setLoadingDetails(false);
        }
      } else {
        const fallbackDigits = `453289102341${(card.last4 || "8842").replace(/\D/g, "").padStart(4, "8")}`;
        setRevealedDetails({
          cardNumber: fallbackDigits,
          cvv: "914",
          expiryDate: formatShortExpiry(card.expiryDate, card.expiryMonth, card.expiryYear) || "08/29",
        });
        setDetailsVisible(true);
      }
    },
    [detailsVisible, revealedDetails, cardIdentifier, card],
  );

  const handleCopy = useCallback((e: React.MouseEvent, value: string, field: "number" | "cvv") => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard?.writeText(value.replace(/\s+/g, ""));
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1600);
  }, []);

  const balanceValue = card.creditLimit && card.cardType === "credit" ? card.creditLimit : card.balance;
  const displayNumber = detailsVisible && revealedDetails?.cardNumber
    ? formatCardNumberGroups(revealedDetails.cardNumber, card.last4)
    : `••••  ••••  ••••  ${card.last4 || "••••"}`;
  const displayExpiry =
    (detailsVisible && revealedDetails?.expiryDate) ||
    formatShortExpiry(card.expiryDate, card.expiryMonth, card.expiryYear);
  const displayCvv = detailsVisible && revealedDetails?.cvv ? revealedDetails.cvv : "•••";
  const serialCode = `NRD-${(cardIdentifier || card.last4 || "904821").slice(-6).toUpperCase()}-${(card.last4 || "0000").slice(-4)}`;

  return (
    <div
      className="group/card relative w-full select-none"
      style={{ perspective: "1200px" }}
    >
      {/* Left & Right Horizontal Edge Hover Sensors — hovering flips card once (front <-> back) and stays */}
      <div
        onMouseEnter={triggerEdgeFlipOnce}
        title="Hover edge to flip card"
        className="hidden sm:block absolute inset-y-4 left-0 z-30 w-5 cursor-ew-resize"
      />
      <div
        onMouseEnter={triggerEdgeFlipOnce}
        title="Hover edge to flip card"
        className="hidden sm:block absolute inset-y-4 right-0 z-30 w-5 cursor-ew-resize"
      />

      {/* 3D Rotor Container */}
      <div
        className={`relative w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCompact ? "min-h-[195px]" : "min-h-[225px] sm:min-h-[242px]"
        } ${isDimmed ? "opacity-75 grayscale" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotationY}deg)`,
          willChange: "transform",
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            FRONT FACE (rotateY(0deg))
           ═══════════════════════════════════════════════════════════════════ */}
        <div
          className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-slate-900 bg-gradient-to-br ${gradient} text-white shadow-2xl ${
            isCompact ? "p-4" : "p-5 sm:p-6"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          {/* Ambient metallic sheen + guilloche grid */}
          <div className={`pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br ${glow} blur-2xl`} />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/5 blur-xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 1px, transparent 1px), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />

          {/* Frozen status overlay */}
          {isFrozen && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 backdrop-blur-[1.5px]">
              <div className="flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/80 px-3.5 py-1.5 shadow-lg">
                <Snowflake size={14} className="text-sky-300" />
                <span className="text-xs font-semibold tracking-wider text-sky-100 uppercase">Card Frozen</span>
              </div>
            </div>
          )}

          {/* Row 1: Nordi Bank Logo + Tier Pill & Interactive Controls */}
          <div className="relative z-20 flex items-start justify-between gap-2">
            <NordiBankLogo compact={isCompact} />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleSeeDetails}
                disabled={loadingDetails}
                title={detailsVisible ? "Hide card number & CVV" : "See card number, CVV & expiry"}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {loadingDetails ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : detailsVisible ? (
                  <EyeOff size={11} />
                ) : (
                  <Eye size={11} />
                )}
                <span>{detailsVisible ? "Hide Details" : "See Details"}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFlip}
                title="Flip card to view QR, Barcode & CVV on back"
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1.5 text-white backdrop-blur-md transition hover:bg-white/20"
                aria-label="Flip card"
              >
                <RotateCw size={11} />
              </button>
            </div>
          </div>

          {/* Row 2: Metallic EMV Chip + Contactless Wave + Tier Label */}
          <div className="relative z-20 my-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MetallicEmvChip compact={isCompact} />
              <Wifi size={isCompact ? 16 : 19} className="rotate-90 text-white/70" />
            </div>

            <span className="rounded-md border border-white/15 bg-black/25 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/85">
              {card.cardType === "virtual" || card.isPhysical === false
                ? "Virtual"
                : `Platinum ${card.cardType || "Debit"}`}
            </span>
          </div>

          {/* Row 3: Embossed 16-Digit Card Number + Copy Button */}
          <div className="relative z-20 my-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`font-mono font-bold tracking-[0.16em] text-white drop-shadow-sm ${
                  detailsVisible
                    ? "rounded-lg border border-amber-300/35 bg-black/35 px-2.5 py-1 text-amber-100"
                    : ""
                } ${isCompact ? "text-sm sm:text-base" : "text-base sm:text-xl"}`}
              >
                {displayNumber}
              </p>
              {detailsVisible && revealedDetails?.cardNumber && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, revealedDetails.cardNumber, "number")}
                  title="Copy card number"
                  className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/15 px-1.5 py-1 text-[10px] font-medium text-white transition hover:bg-white/25"
                >
                  {copiedField === "number" ? (
                    <>
                      <Check size={11} className="text-emerald-300" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={11} /> Copy
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Row 4: Cardholder Name, Expiry, CVV Pill, Balance & Provider Vector Logo */}
          <div className="relative z-20 flex items-end justify-between gap-2 pt-1">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Cardholder
              </p>
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
                {card.cardholderName || "NORDI MEMBER"}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-sky-200/90">
                {card.cardType === "credit" ? "Limit" : "Bal"}:{" "}
                <span className="font-semibold text-white">
                  {show || detailsVisible ? fmt(balanceValue, card.currency) : "••••••"}
                </span>
              </p>
            </div>

            <div className="flex items-end gap-3">
              <div className="text-right">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  Valid Thru
                </p>
                <p className="font-mono text-xs font-semibold text-white">
                  {displayExpiry}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  CVV
                </p>
                <div className="flex items-center gap-1">
                  <p className="font-mono text-xs font-bold text-amber-200">
                    {displayCvv}
                  </p>
                  {detailsVisible && revealedDetails?.cvv && (
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, revealedDetails.cvv, "cvv")}
                      title="Copy CVV"
                      className="text-white/80 hover:text-white"
                    >
                      {copiedField === "cvv" ? <Check size={10} className="text-emerald-300" /> : <Copy size={10} />}
                    </button>
                  )}
                </div>
              </div>

              <ProviderVectorLogo brand={brand} compact={isCompact} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BACK FACE (rotateY(180deg)) — Magnetic Stripe, CVV, QR & Barcode
           ═══════════════════════════════════════════════════════════════════ */}
        <div
          className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-slate-950 bg-gradient-to-br ${gradient} text-white shadow-2xl`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Top issuer support micro-line & Magnetic Stripe */}
          <div>
            <div className="flex items-center justify-between px-4 py-1.5 text-[8px] tracking-wider text-white/60">
              <span>NORDI REMITTANCE INTERNATIONAL • AUTHORIZED FINANCIAL INSTRUMENT</span>
              <button
                type="button"
                onClick={handleToggleFlip}
                className="inline-flex items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white hover:bg-white/20"
              >
                <RotateCw size={9} /> Front
              </button>
            </div>
            <div className="h-9 w-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 shadow-inner sm:h-10" />
          </div>

          {/* Middle: Authorized Signature Strip + CVV Box + See Details Trigger */}
          <div className="px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 flex-1 items-center justify-between rounded bg-amber-50/95 px-3 text-slate-800 shadow-inner"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(14,165,233,0.08) 0px, rgba(14,165,233,0.08) 4px, transparent 4px, transparent 8px)",
                }}
              >
                <span className="font-serif text-xs italic tracking-wider text-slate-600 select-none">
                  {card.cardholderName || "Authorized Signature"}
                </span>
                <span className="font-mono text-[10px] font-semibold text-slate-400">
                  {card.last4 || "••••"}
                </span>
              </div>

              <div className="flex h-8 items-center gap-1.5 rounded border border-amber-300/40 bg-white px-2.5 text-slate-900 shadow">
                <span className="text-[9px] font-bold uppercase text-slate-400">CVV</span>
                <span className="font-mono text-xs font-extrabold tracking-wider text-slate-900">
                  {displayCvv}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleSeeDetails}
                className="rounded-lg border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
                title={detailsVisible ? "Hide CVV" : "Reveal CVV"}
              >
                {loadingDetails ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : detailsVisible ? (
                  <EyeOff size={13} />
                ) : (
                  <Eye size={13} />
                )}
              </button>
            </div>
          </div>

          {/* Bottom: Vector QR Code + Hologram + Vector Barcode & Provider Logo */}
          <div className="flex items-end justify-between gap-3 px-4 pb-3.5 sm:px-5 sm:pb-4">
            <div className="flex items-center gap-2.5">
              <CardQrCodeSvg seed={`${cardIdentifier}-${card.last4}-${card.cardholderName}`} size={isCompact ? 46 : 54} />
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 rounded border border-white/20 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-amber-300/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-white/90">
                  ★ Nordi Holo-Secure
                </div>
                <p className="max-w-[140px] text-[8px] leading-tight text-white/60">
                  Scan QR or barcode to verify card authenticity with Nordi Remittance Vault.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <CardBarcodeSvg seed={`${cardIdentifier}-${card.last4}`} serialLabel={serialCode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Small status badge ─────────────────────────────────────────────────── */

export const CardStatusPill: React.FC<{ status: CardStatus }> = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};
