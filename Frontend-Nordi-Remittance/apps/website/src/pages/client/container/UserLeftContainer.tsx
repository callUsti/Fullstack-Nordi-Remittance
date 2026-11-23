/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useLogout } from "../client-usecase/useauth-client-usecase";
import { useAuth } from "@store/auth.store";
import { useClientProfile } from "../client-usecase/useprofile-client-usecase";
import { useClientUnreadCount } from "../client-usecase/usenotification-client-usecase";
import {
  LayoutDashboard,
  Wallet,
  Repeat,
  Users,
  Send,
  CreditCard,
  Briefcase,
  LineChart,
  PiggyBank,
  Receipt,
  HelpCircle,
  Shield,
  LogOut,
  ChevronDown,
  Bell,
  Gift,
  Globe,
  Zap,
  QrCode,
  Smartphone,
  Settings,
  MessageSquare,
  Heart,
  AlertTriangle,
  BanknoteIcon,
  X,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    route: "/customer/dashboard",
  },
  {
    title: "My Accounts",
    icon: <Wallet size={20} />,
    route: "/customer/accounts",
    children: [
      { title: "All Accounts", route: "/customer/accounts" },
      { title: "Savings Account", route: "/customer/accounts/savings" },
      { title: "Current Account", route: "/customer/accounts/current" },
      { title: "Fixed Deposits", route: "/customer/accounts/fixed-deposits" },
      { title: "Account Statements", route: "/customer/accounts/statements" },
      { title: "Account Limits", route: "/customer/accounts/limits" },
      { title: "Applications", route: "/customer/accounts/applications" },
    ],
  },
  {
    title: "Transactions",
    icon: <Repeat size={20} />,
    route: "/customer/transactions",
    children: [
      { title: "Recent Activity", route: "/customer/transactions/recent" },
      { title: "Scheduled Transfers", route: "/customer/transactions/scheduled" },
      { title: "Transaction History", route: "/customer/transactions/history" },
      { title: "Download Statement", route: "/customer/transactions/download" },
    ],
  },
  {
    title: "Send Money",
    icon: <Send size={20} />,
    route: "/customer/send",
    children: [
      { title: "Domestic Transfer", route: "/customer/send/domestic" },
      { title: "International Wire", route: "/customer/send/international" },
      { title: "Quick Transfer", route: "/customer/send/quick" },
      { title: "Instant Payment", route: "/customer/send/instant" },
    ],
  },
  {
    title: "Beneficiaries",
    icon: <Users size={20} />,
    route: "/customer/beneficiaries",
    children: [
      { title: "All Beneficiaries", route: "/customer/beneficiaries/all" },
      { title: "Add New", route: "/customer/beneficiaries/add" },
      { title: "Manage Categories", route: "/customer/beneficiaries/categories" },
      { title: "Recent Recipients", route: "/customer/beneficiaries/recent" },
    ],
  },
  {
    title: "Cards",
    icon: <CreditCard size={20} />,
    route: "/customer/cards",
    children: [
      { title: "My Cards", route: "/customer/cards/overview" },
      { title: "Card Transactions", route: "/customer/cards/transactions" },
      { title: "Apply for New Card", route: "/customer/cards/apply" },
      { title: "Card Security", route: "/customer/cards/security" },
      { title: "Virtual Cards", route: "/customer/cards/virtual" },
    ],
  },
  {
    title: "Loans & Credit",
    icon: <Briefcase size={20} />,
    route: "/customer/loans",
    children: [
      { title: "My Loans", route: "/customer/loans/overview" },
      { title: "Apply for Loan", route: "/customer/loans/apply" },
      { title: "Loan Calculator", route: "/customer/loans/calculator" },
      { title: "Credit Score", route: "/customer/loans/credit-score" },
    ],
  },
  {
    title: "Investments",
    icon: <LineChart size={20} />,
    route: "/customer/investments",
    children: [
      { title: "Portfolio Overview", route: "/customer/investments/overview" },
      { title: "Mutual Funds", route: "/customer/investments/mutual-funds" },
      { title: "Stocks & ETFs", route: "/customer/investments/stocks" },
      { title: "Fixed Income", route: "/customer/investments/fixed-income" },
      { title: "Market Insights", route: "/customer/investments/insights" },
    ],
  },
  {
    title: "Savings Goals",
    icon: <PiggyBank size={20} />,
    route: "/customer/savings",
    children: [
      { title: "My Goals", route: "/customer/savings/goals" },
      { title: "Create New Goal", route: "/customer/savings/create" },
      { title: "Auto-Save Rules", route: "/customer/savings/auto-save" },
      { title: "Savings Analytics", route: "/customer/savings/analytics" },
    ],
  },
  {
    title: "Bill Payments",
    icon: <Receipt size={20} />,
    route: "/customer/bills",
    children: [
      { title: "Pay Bills", route: "/customer/bills/pay" },
      { title: "Scheduled Payments", route: "/customer/bills/scheduled" },
      { title: "Utilities & Services", route: "/customer/bills/utilities" },
      { title: "Autopay Setup", route: "/customer/bills/autopay" },
    ],
  },
  {
    title: "Foreign Exchange",
    icon: <Globe size={20} />,
    route: "/customer/forex",
    children: [
      { title: "Currency Exchange", route: "/customer/forex/exchange" },
      { title: "Live Rates", route: "/customer/forex/rates" },
      { title: "Currency Alerts", route: "/customer/forex/alerts" },
      { title: "Exchange History", route: "/customer/forex/history" },
    ],
  },
  {
    title: "Mobile Banking",
    icon: <Smartphone size={20} />,
    route: "/customer/mobile",
    children: [
      { title: "Mobile App", route: "/customer/mobile/app" },
      { title: "Device Management", route: "/customer/mobile/devices" },
      { title: "QR Payments", route: "/customer/mobile/qr" },
      { title: "Push Notifications", route: "/customer/mobile/notifications" },
    ],
  },
  {
    title: "Rewards & Offers",
    icon: <Gift size={20} />,
    route: "/customer/rewards",
    children: [
      { title: "My Rewards", route: "/customer/rewards/overview" },
      { title: "Redeem Points", route: "/customer/rewards/redeem" },
      { title: "Special Offers", route: "/customer/rewards/offers" },
      { title: "Partner Discounts", route: "/customer/rewards/partners" },
    ],
  },
  {
    title: "Support",
    icon: <HelpCircle size={20} />,
    route: "/customer/support",
    children: [
      { title: "Contact Us", route: "/customer/support/contact" },
      { title: "Live Chat", route: "/customer/support/chat" },
      { title: "FAQs", route: "/customer/support/faqs" },
      { title: "Schedule Appointment", route: "/customer/support/appointment" },
    ],
  },
  {
    title: "Security Center",
    icon: <Shield size={20} />,
    route: "/customer/security",
    children: [
      { title: "Security Settings", route: "/customer/security/settings" },
      { title: "Two-Factor Auth", route: "/customer/security/2fa" },
      { title: "Biometric Access", route: "/customer/security/biometric" },
      { title: "Activity Logs", route: "/customer/security/logs" },
      { title: "Security Alerts", route: "/customer/security/alerts" },
    ],
  },
  {
    title: "Profile & Preferences",
    icon: <Settings size={20} />,
    route: "/customer/profile",
    children: [
      { title: "Personal Information", route: "/customer/profile/personal" },
      { title: "Communication Preferences", route: "/customer/profile/communication" },
      { title: "Language & Region", route: "/customer/profile/language" },
      { title: "Document Center", route: "/customer/profile/documents" },
    ],
  },
  {
    title: "Logout",
    icon: <LogOut size={20} />,
    route: "/customer/logout",
  },
];

const sidebarVariants = {
  expanded: { width: "280px", transition: { duration: 0.25, ease: "easeInOut" } },
  collapsed: { width: "80px", transition: { duration: 0.25, ease: "easeInOut" } },
};

const dropdownVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
};

interface UserLeftContainerProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const UserLeftContainer: React.FC<UserLeftContainerProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout: clearAuthState, user, userName } = useAuth();
  const { user: profileUser } = useClientProfile();
  const { count: unreadCount } = useClientUnreadCount();
  const logoutMutation = useLogout();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const avatarUrl = profileUser.profilePicture || user?.avatar || null;
  const displayName = userName || `${profileUser.firstName || ""} ${profileUser.lastName || ""}`.trim() || "User";
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";
  const memberTier = profileUser.accountType
    ? `${(profileUser.accountType as string).charAt(0).toUpperCase()}${(profileUser.accountType as string).slice(1)} Account`
    : user?.kycStatus === "verified"
      ? "Verified Member"
      : "Member";

  const handleLogout = () => {
    onCloseMobile?.();
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearAuthState();
        navigate("/login", { replace: true });
      },
    });
  };

  useEffect(() => {
    const currentParentRoute = menuItems.find(
      (item) => item.children && item.children.some((child) => location.pathname === child.route),
    );
    if (currentParentRoute && currentParentRoute.route) {
      setOpenDropdowns([currentParentRoute.route]);
    }
  }, [location.pathname]);

  const handleDropdown = (route: string) => {
    setOpenDropdowns((prev) => (prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]));
  };

  const isActive = (route: string) =>
    location.pathname === route || (route !== "/" && location.pathname.startsWith(route));

  const goTo = (route: string) => {
    navigate(route);
    if (collapsed) setCollapsed(false);
    onCloseMobile?.();
  };

  const renderSidebarBody = (isMobileDrawer: boolean) => {
    const isCollapsed = !isMobileDrawer && collapsed;

    return (
      <div className="flex h-full flex-col bg-blue-50/70 py-5 transition-colors duration-200 dark:bg-gray-900">
        {/* Header: User Info + Mobile Close Button */}
        <div
          className={`mb-5 flex items-center px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className="flex min-w-0 items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-lg font-semibold text-white shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <span className={avatarUrl ? "hidden" : ""}>{initials}</span>
            </div>

            {!isCollapsed && (
              <div className="ml-3 min-w-0">
                <div className="max-w-[165px] truncate text-sm font-medium text-blue-900 dark:text-blue-200">
                  {displayName}
                </div>
                <div className="text-xs font-medium text-blue-500 dark:text-blue-400">{memberTier}</div>
              </div>
            )}
          </div>

          {isMobileDrawer && onCloseMobile && (
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={onCloseMobile}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="mb-5 px-4">
            <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-800">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-900 dark:text-blue-200">Quick Actions</span>
                <Zap size={14} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Send", icon: <Send size={16} />, route: "/customer/send/domestic", cls: "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-300" },
                  { label: "Scan", icon: <QrCode size={16} />, route: "/customer/mobile/qr", cls: "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-300" },
                  { label: "Pay", icon: <BanknoteIcon size={16} />, route: "/customer/bills/pay", cls: "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-300" },
                  { label: "Forex", icon: <Globe size={16} />, route: "/customer/forex/exchange", cls: "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-300" },
                ].map((act) => (
                  <motion.button
                    key={act.label}
                    type="button"
                    onClick={() => goTo(act.route)}
                    className={`flex min-h-[48px] cursor-pointer flex-col items-center justify-center rounded-xl p-2 transition hover:opacity-90 ${act.cls}`}
                    whileTap={{ scale: 0.94 }}
                  >
                    {act.icon}
                    <span className="mt-1 text-[11px] font-semibold">{act.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications & Security Alerts */}
        {!isCollapsed && (
          <div className="mb-4 flex flex-col gap-2 px-4">
            <motion.button
              type="button"
              onClick={() => goTo("/customer/notifications")}
              className="flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-xl bg-white px-3.5 py-2 text-left shadow-sm transition hover:shadow dark:bg-gray-800"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-blue-500 dark:text-blue-400" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Notifications</span>
              </div>
              {unreadCount > 0 && (
                <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => goTo("/customer/security/alerts")}
              className="flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-xl bg-white px-3.5 py-2 text-left shadow-sm transition hover:shadow dark:bg-gray-800"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Security Center</span>
              </div>
            </motion.button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5" style={{ WebkitOverflowScrolling: "touch" }}>
          <ul className="m-0 list-none space-y-1 p-0">
            {menuItems.map((item) => {
              const active = isActive(item.route);
              const hasChildren = !!item.children;
              const open = openDropdowns.includes(item.route);

              return (
                <li key={item.title}>
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (item.title === "Logout") {
                        handleLogout();
                        return;
                      }
                      if (hasChildren) {
                        if (!isCollapsed) handleDropdown(item.route);
                        else goTo(item.route);
                      } else {
                        goTo(item.route);
                      }
                    }}
                    className={`flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                      item.title === "Logout"
                        ? "font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        : active
                          ? "bg-blue-50/70 font-medium text-blue-800 dark:bg-gray-900 dark:text-blue-200"
                          : "font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-300"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span
                      className={
                        item.title === "Logout"
                          ? "text-rose-500 dark:text-rose-400"
                          : active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-blue-500 dark:text-blue-400"
                      }
                    >
                      {item.icon}
                    </span>

                    {!isCollapsed && <span className="flex-1 truncate">{item.title}</span>}

                    {hasChildren && !isCollapsed && (
                      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} className="text-blue-400" />
                      </motion.div>
                    )}
                  </motion.button>

                  {hasChildren && !isCollapsed && (
                    <AnimatePresence>
                      {open && (
                        <motion.ul
                          className="mb-1 mt-1 list-none overflow-hidden pl-9"
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          {item.children.map((child) => {
                            const childActive = location.pathname === child.route;
                            return (
                              <li key={child.title} className="mb-0.5">
                                <button
                                  type="button"
                                  onClick={() => goTo(child.route)}
                                  className={`flex min-h-[38px] w-full cursor-pointer items-center rounded-lg px-3 py-1.5 text-left text-sm transition ${
                                    childActive
                                      ? "bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                      : "font-normal text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-300"
                                  }`}
                                >
                                  {child.title}
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Customer Support */}
        {!isCollapsed && (
          <div className="mt-3 px-4">
            <motion.button
              type="button"
              onClick={() => goTo("/customer/support/chat")}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-blue-50/70 p-3 text-left dark:bg-gray-900"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <MessageSquare size={16} />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-900 dark:text-blue-200">Need assistance?</div>
                <div className="text-xs text-blue-700 dark:text-blue-400">Chat with support</div>
              </div>
            </motion.button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 px-4 py-2 text-center text-xs">
          {!isCollapsed ? (
            <div className="text-blue-400 dark:text-blue-500">
              &copy; {new Date().getFullYear()} Nordi Digital Banking
            </div>
          ) : (
            <Heart size={16} className="mx-auto text-blue-400" />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Docked Sidebar (lg+) */}
      <motion.aside
        variants={sidebarVariants}
        initial="expanded"
        animate={collapsed ? "collapsed" : "expanded"}
        className="relative hidden h-[100dvh] shrink-0 shadow-lg lg:flex lg:flex-col"
      >
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-12 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={15} className="rotate-90" />
          </motion.div>
        </button>
        {renderSidebarBody(false)}
      </motion.aside>

      {/* Mobile & Tablet Slide-Over Drawer (< lg) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 h-[100dvh] w-[84vw] max-w-[310px] shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {renderSidebarBody(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserLeftContainer;
