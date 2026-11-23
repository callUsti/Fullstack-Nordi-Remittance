import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useLogout } from "@hooks/api-queries/useAuth";
import { useAuth } from "@store/auth.store";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BadgeCheck,
  Briefcase,
  TrendingUp,
  BarChart2,
  ShieldAlert,
  FileText,
  Mail,
  Settings,
  UserCog,
  LogOut,
  ChevronDown,
  Landmark,
  Lock,
  Globe,
  Bell,
  AlertTriangle,
  Activity,
  Shield,
  User,
  X,
} from "lucide-react";
import { sidebarWidths } from "@constants/breakpoints";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// MENU STRUCTURE
// ============================================================================
const menu = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    route: "/admin/dashboard",
  },
  {
    title: "Users Management",
    icon: <Users size={20} />,
    route: "/admin/users",
    children: [
      { title: "All Users", route: "/admin/users/all" },
      { title: "KYC Pending", route: "/admin/users/kyc-pending" },
      { title: "Blocked Users", route: "/admin/users/blocked" },
      { title: "Admin Team", route: "/admin/users/vip" },
    ],
  },
  {
    title: "Transactions",
    icon: <CreditCard size={20} />,
    route: "/admin/transactions",
    children: [
      { title: "All Transactions", route: "/admin/transactions/all" },
      { title: "Pending", route: "/admin/transactions/pending" },
      { title: "Failed", route: "/admin/transactions/failed" },
      { title: "International", route: "/admin/transactions/international" },
      { title: "Suspicious", route: "/admin/transactions/suspicious" },
    ],
  },
  {
    title: "KYC / Identity",
    icon: <BadgeCheck size={20} />,
    route: "/admin/kyc",
    children: [
      { title: "Pending KYC", route: "/admin/kyc/pending" },
      { title: "Verified", route: "/admin/kyc/verified" },
      { title: "Rejected", route: "/admin/kyc/rejected" },
      { title: "Enhanced Due Diligence", route: "/admin/kyc/enhanced" },
    ],
  },
  {
    title: "Loan Management",
    icon: <Briefcase size={20} />,
    route: "/admin/loans",
    children: [
      { title: "All Loans", route: "/admin/loans/all" },
      { title: "Pending", route: "/admin/loans/pending" },
      { title: "Approved", route: "/admin/loans/approved" },
      { title: "Rejected", route: "/admin/loans/rejected" },
      { title: "Delinquent", route: "/admin/loans/delinquent" },
    ],
  },
  {
    title: "Investment Products",
    icon: <TrendingUp size={20} />,
    route: "/admin/investments",
    children: [
      { title: "All Products", route: "/admin/investments/all" },
      { title: "Fixed Deposits", route: "/admin/investments/fixed-deposits" },
      { title: "Mutual Funds", route: "/admin/investments/mutual-funds" },
      { title: "Bonds", route: "/admin/investments/bonds" },
      { title: "Equity Products", route: "/admin/investments/equity" },
    ],
  },
  {
    title: "Bank Accounts",
    icon: <Landmark size={20} />,
    route: "/admin/accounts",
    children: [
      { title: "Savings Accounts", route: "/admin/accounts/savings" },
      { title: "Current Accounts", route: "/admin/accounts/current" },
      { title: "Fixed Deposits", route: "/admin/accounts/fixed-deposits" },
      { title: "Dormant Accounts", route: "/admin/accounts/dormant" },
      { title: "Account Applications", route: "/admin/accounts/applications" },
      { title: "Wallet Operations", route: "/admin/accounts/operations" },
      { title: "Activity Simulator", route: "/admin/accounts/simulator" },
    ],
  },
  {
    title: "Cards Operations",
    icon: <CreditCard size={20} />,
    route: "/admin/cards",
  },
  {
    title: "Foreign Exchange",
    icon: <Globe size={20} />,
    route: "/admin/forex",
    children: [
      { title: "Exchange Rates", route: "/admin/forex/rates" },
      { title: "FX Transactions", route: "/admin/forex/transactions" },
      { title: "Remittances", route: "/admin/forex/remittances" },
    ],
  },
  {
    title: "Reports & Analytics",
    icon: <BarChart2 size={20} />,
    route: "/admin/reports",
    children: [
      { title: "Financial Reports", route: "/admin/reports/financial" },
      { title: "User Analytics", route: "/admin/reports/users" },
      { title: "Transaction Analytics", route: "/admin/reports/transactions" },
      { title: "Risk Reports", route: "/admin/reports/risk" },
      { title: "Regulatory Reports", route: "/admin/reports/regulatory" },
    ],
  },
  {
    title: "Fraud Monitoring",
    icon: <ShieldAlert size={20} />,
    route: "/admin/fraud",
    children: [
      { title: "Alerts", route: "/admin/fraud/alerts" },
      { title: "Investigation Cases", route: "/admin/fraud/cases" },
      { title: "AML Monitoring", route: "/admin/fraud/aml" },
    ],
  },
  {
    title: "Audit Logs",
    icon: <FileText size={20} />,
    route: "/admin/logs",
  },
  {
    title: "Communications",
    icon: <Mail size={20} />,
    route: "/admin/communications",
    children: [
      { title: "Email Templates", route: "/admin/communications/email-templates" },
      { title: "SMS Templates", route: "/admin/communications/sms-templates" },
      { title: "Push Notifications", route: "/admin/communications/push" },
      { title: "Campaign Manager", route: "/admin/communications/campaigns" },
    ],
  },
  {
    title: "System Settings",
    icon: <Settings size={20} />,
    route: "/admin/settings",
    children: [
      { title: "Permissions & Roles", route: "/admin/settings/permissions" },
      { title: "General", route: "/admin/settings/general" },
      { title: "Security", route: "/admin/settings/security" },
      { title: "Notifications", route: "/admin/settings/notifications" },
      { title: "API Integration", route: "/admin/settings/api" },
      { title: "Payment Gateways", route: "/admin/settings/payment-gateways" },
    ],
  },
  {
    title: "Admin Management",
    icon: <UserCog size={20} />,
    route: "/admin/management",
    children: [
      { title: "Admin Users", route: "/admin/management/users" },
      { title: "Roles & Permissions", route: "/admin/management/roles" },
      { title: "Activity Logs", route: "/admin/management/activity" },
    ],
  },
  {
    title: "Logout",
    icon: <LogOut size={20} />,
    route: "/admin/logout",
  },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const sidebarVariants = {
  expanded: { width: `${sidebarWidths.expanded.lg}px`, transition: { duration: 0.3, ease: "easeInOut" } },
  collapsed: { width: "80px", transition: { duration: 0.3, ease: "easeInOut" } },
};

const dropdownVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

const QUICK_ACTIONS = [
  { icon: <Users size={16} />, label: "Users", route: "/admin/users/all" },
  { icon: <ShieldAlert size={16} />, label: "Fraud", route: "/admin/fraud" },
  { icon: <BarChart2 size={16} />, label: "Reports", route: "/admin/reports" },
  { icon: <Settings size={16} />, label: "Settings", route: "/admin/settings" },
];

// ============================================================================
// COMPONENT
// ============================================================================
interface AdminLeftContainerProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const AdminLeftContainer: React.FC<AdminLeftContainerProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout: clearAuthState, user, userName } = useAuth();
  const logoutMutation = useLogout();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const displayName = userName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Admin";
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "A";
  const roleBadge = user?.role === "admin" ? "System Administrator" : "Admin";

  const handleLogout = () => {
    onCloseMobile?.();
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearAuthState();
        navigate("/admin", { replace: true });
      },
    });
  };

  // Auto-expand dropdown for active route
  useEffect(() => {
    const parent = menu.find((item) => item.children?.some((child) => location.pathname === child.route));
    if (parent) setOpenDropdowns([parent.route]);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

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
        {/* Header: Admin Info + Mobile Close Button */}
        <div className={`mb-5 flex items-center px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex min-w-0 items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white shadow-md">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="ml-3 min-w-0">
                <div className="max-w-[165px] truncate text-sm font-medium text-blue-900 dark:text-blue-200">
                  {displayName}
                </div>
                <div className="text-xs font-medium text-blue-500 dark:text-blue-400">{roleBadge}</div>
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
                <Activity size={14} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_ACTIONS.map((act) => (
                  <motion.button
                    key={act.label}
                    type="button"
                    onClick={() => goTo(act.route)}
                    className="flex min-h-[48px] cursor-pointer flex-col items-center justify-center rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:opacity-90 dark:bg-gray-700 dark:text-blue-300"
                    whileTap={{ scale: 0.94 }}
                  >
                    {act.icon}
                    <span className="mt-1 text-[11px] font-medium">{act.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        {!isCollapsed && (
          <div className="mb-4 flex flex-col gap-2 px-4">
            <div className="flex min-h-[42px] w-full items-center justify-between rounded-xl bg-white px-3.5 py-2 shadow-sm dark:bg-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">System Online</span>
              </div>
              <Shield size={14} className="text-emerald-500" />
            </div>

            <motion.button
              type="button"
              onClick={() => goTo("/admin/fraud/alerts")}
              className="flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-xl bg-white px-3.5 py-2 text-left shadow-sm transition hover:shadow dark:bg-gray-800"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Security Alerts</span>
              </div>
              <Bell size={14} className="text-amber-500 dark:text-amber-400" />
            </motion.button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5" style={{ WebkitOverflowScrolling: "touch" }}>
          <ul className="m-0 list-none space-y-1 p-0">
            {menu.map((item) => {
              const active = isActive(item.route);
              const hasChildren = !!item.children;
              const open = openDropdowns.includes(item.route);

              return (
                <li key={item.title}>
                  <motion.button
                    type="button"
                    title={isCollapsed ? item.title : undefined}
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
                      isCollapsed ? "justify-center" : ""
                    } ${
                      item.title === "Logout"
                        ? "font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        : active
                          ? "bg-blue-100/80 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
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
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.ul
                          className="mb-1 mt-1 list-none overflow-hidden pl-9"
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          {item.children!.map((child) => {
                            const childActive = isActive(child.route);
                            return (
                              <li key={child.title} className="mb-0.5">
                                <button
                                  type="button"
                                  onClick={() => goTo(child.route)}
                                  className={`flex min-h-[38px] w-full cursor-pointer items-center rounded-lg px-3 py-1.5 text-left text-sm transition ${
                                    childActive
                                      ? "bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
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

        {/* Admin Profile Shortcut */}
        {!isCollapsed && (
          <div className="mt-3 px-4">
            <motion.button
              type="button"
              onClick={() => goTo("/admin/profile")}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm dark:bg-gray-800"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-blue-900 dark:text-blue-200">Admin Profile</div>
                <div className="text-xs text-blue-700 dark:text-blue-400">View &amp; manage</div>
              </div>
            </motion.button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 px-4 py-2 text-center text-xs">
          {!isCollapsed ? (
            <div className="text-blue-400 dark:text-blue-500">&copy; {new Date().getFullYear()} Nordi Admin</div>
          ) : (
            <Lock size={16} className="mx-auto text-blue-400" />
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
        className="relative hidden h-[100dvh] shrink-0 shadow-lg dark:shadow-gray-950/50 lg:flex lg:flex-col"
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

export default AdminLeftContainer;
