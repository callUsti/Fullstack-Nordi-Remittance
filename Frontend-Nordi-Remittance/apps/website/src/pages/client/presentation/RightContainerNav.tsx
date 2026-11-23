import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  CreditCard,
  Briefcase,
  PiggyBank,
  Wallet,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { useAuth } from "@store/auth.store";
import useThemeStore from "@store/theme.store";
import { useClientWallets } from "../client-usecase/useaccounts-client-usecase";
import { useClientUnreadCount } from "../client-usecase/usenotification-client-usecase";
import { useClientProfile } from "../client-usecase/useprofile-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// HELPERS
// ============================================================================
const walletIconMap: Record<string, React.ReactNode> = {
  savings: <PiggyBank size={16} />,
  checking: <CreditCard size={16} />,
  business: <Briefcase size={16} />,
  investment: <Briefcase size={16} />,
  primary: <Wallet size={16} />,
};

const getWalletIcon = (type?: string) => walletIconMap[type || "primary"] || <Wallet size={16} />;

const formatBalance = (amount: number, currency?: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);

const maskNumber = (num?: string) => (num ? `****${num.slice(-4)}` : "****0000");

// ============================================================================
// COMPONENT
// ============================================================================
interface RightContainerNavProps {
  onOpenMobileMenu?: () => void;
}

const RightContainerNav: React.FC<RightContainerNavProps> = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();

  // ── Auth ──
  const { user, userName, logout } = useAuth();

  // ── Profile (for profilePicture fallback) ──
  const { user: profileUser } = useClientProfile();
  const avatarUrl = profileUser.profilePicture || user?.avatar || null;

  // ── Theme ──
  const { mode, isDarkMode, setMode, toggleDarkMode } = useThemeStore();

  // ── Wallets (real data) ──
  const { wallets } = useClientWallets();

  // ── Notifications (real count) ──
  const { count: unreadCount } = useClientUnreadCount();

  // ── Local UI state ──
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [greeting, setGreeting] = useState("");

  const accountRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Greeting based on time-of-day
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setIsAccountOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setIsThemeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Animation variants
  const dropdown = {
    hidden: { opacity: 0, y: -5, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.15, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -5, scale: 0.97, transition: { duration: 0.1 } },
  };

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "U";

  return (
    <nav className="w-full border-b border-blue-100 bg-white transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* ── Left: Mobile Drawer Trigger + Logo + Greeting ── */}
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            {onOpenMobileMenu && (
              <motion.button
                type="button"
                aria-label="Open navigation menu"
                whileTap={{ scale: 0.92 }}
                onClick={onOpenMobileMenu}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/80 text-blue-700 transition hover:bg-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-300 lg:hidden"
              >
                <Menu size={20} />
              </motion.button>
            )}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm">
              NR
            </div>
            <span className="text-base font-medium text-blue-700 dark:text-blue-300">Nordi</span>
            <div className="ml-2 hidden items-center text-sm lg:flex">
              <span className="mr-1 text-blue-400 dark:text-blue-500">{greeting},</span>
              <span className="max-w-[180px] truncate font-medium text-blue-700 dark:text-blue-300">
                {userName || "User"}
              </span>
            </div>
          </div>

          {/* ── Center: Search ── */}
          <div className="mx-4 hidden max-w-xs flex-1 sm:block">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-500"
              />
              <input
                className="w-full rounded-full border border-blue-100 bg-blue-50/60 py-2 pl-9 pr-3 text-sm text-blue-900 placeholder-blue-300 transition focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-800 dark:focus:ring-blue-600"
                placeholder="Search..."
                type="search"
              />
            </div>
          </div>

          {/* ── Right: Controls ── */}
          <div className="flex items-center gap-2">
            {/* Account Selector */}
            <div ref={accountRef} className="relative hidden sm:block">
              <motion.button
                onClick={() => {
                  setIsAccountOpen(!isAccountOpen);
                  setIsProfileOpen(false);
                  setIsThemeOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 transition hover:bg-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700"
                whileTap={{ scale: 0.97 }}
              >
                <Wallet size={14} />
                <span className="hidden md:inline">Accounts</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isAccountOpen ? "rotate-180" : ""}`}
                />
              </motion.button>

              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
                    variants={dropdown}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="border-b border-blue-50 px-4 py-3 dark:border-gray-800">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-gray-100">Your Wallets</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {wallets.length === 0 ? (
                        <p className="py-6 text-center text-xs text-gray-400">No wallets found</p>
                      ) : (
                        wallets.map((w: any, i: number) => (
                          <button
                            key={w._id || w.id || i}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-gray-800"
                            onClick={() => {
                              setIsAccountOpen(false);
                              navigate("/customer/accounts");
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-blue-500 dark:text-blue-400">{getWalletIcon(w.type)}</span>
                              <div>
                                <div className="text-sm font-medium text-blue-900 dark:text-gray-100">
                                  {w.type ? `${w.type.charAt(0).toUpperCase()}${w.type.slice(1)} Wallet` : "Wallet"}
                                </div>
                                <div className="text-xs text-blue-400 dark:text-blue-500">
                                  {maskNumber(w.walletNumber || w.accountNumber)}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {formatBalance(w.balance ?? w.availableBalance ?? 0, w.currency)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="border-t border-blue-50 px-4 py-2.5 dark:border-gray-800">
                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          navigate("/customer/accounts");
                        }}
                        className="flex w-full items-center justify-center text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View All Accounts <ChevronRight size={13} className="ml-1" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <div ref={themeRef} className="relative">
              <motion.button
                className="rounded-full bg-blue-50 p-2 text-blue-500 transition hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsThemeOpen(!isThemeOpen);
                  setIsAccountOpen(false);
                  setIsProfileOpen(false);
                }}
                title={`Theme: ${mode}`}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>

              <AnimatePresence>
                {isThemeOpen && (
                  <motion.div
                    className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
                    variants={dropdown}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {(
                      [
                        { key: "light" as const, icon: <Sun size={15} />, label: "Light" },
                        { key: "dark" as const, icon: <Moon size={15} />, label: "Dark" },
                        { key: "system" as const, icon: <Monitor size={15} />, label: "System" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setMode(opt.key);
                          setIsThemeOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                          mode === opt.key
                            ? "bg-blue-50 font-medium text-blue-700 dark:bg-gray-800 dark:text-blue-300"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <motion.button
              className="relative rounded-full bg-blue-50 p-2 text-blue-500 transition hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/customer/notifications")}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              className="hidden rounded-full bg-blue-50 p-2 text-blue-500 transition hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 md:flex"
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/customer/settings")}
            >
              <Settings size={18} />
            </motion.button>

            {/* Profile Avatar + Dropdown */}
            <div ref={profileRef} className="relative ml-1">
              <motion.button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsAccountOpen(false);
                  setIsThemeOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-blue-200 bg-blue-50/70 dark:border-gray-700 dark:bg-gray-900"
                whileTap={{ scale: 0.95 }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName || "User"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-200">{initials}</span>
                )}
              </motion.button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
                    variants={dropdown}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {/* User info header */}
                    <div className="border-b border-blue-50 px-4 py-3 dark:border-gray-800">
                      <p className="truncate text-sm font-semibold text-blue-900 dark:text-gray-100">
                        {userName || "User"}
                      </p>
                      <p className="truncate text-xs text-blue-400 dark:text-blue-500">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/customer/profile");
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <User size={15} /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/customer/settings");
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Settings size={15} /> Settings
                    </button>

                    {/* Dark mode quick toggle */}
                    <button
                      onClick={toggleDarkMode}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                      {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </button>

                    {/* Logout */}
                    <div className="border-t border-blue-50 dark:border-gray-800">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          navigate("/login");
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-gray-800"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default RightContainerNav;
