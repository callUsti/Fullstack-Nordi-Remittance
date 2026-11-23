import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, ArrowLeftRight, Wallet, Menu } from "lucide-react";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (prefix: string) =>
    location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);

  const navItems = [
    {
      label: "Home",
      icon: LayoutDashboard,
      route: "/admin/dashboard",
      active: isActive("/admin/dashboard"),
    },
    {
      label: "Users",
      icon: Users,
      route: "/admin/users/all",
      active: isActive("/admin/users"),
    },
    {
      label: "Txns",
      icon: ArrowLeftRight,
      route: "/admin/transactions",
      active: isActive("/admin/transactions"),
      primary: true,
    },
    {
      label: "Accounts",
      icon: Wallet,
      route: "/admin/accounts",
      active: isActive("/admin/accounts"),
    },
  ];

  return (
    <nav
      aria-label="Admin mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-900/90 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <motion.button
                key={item.label}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(item.route)}
                className="-mt-5 flex h-12 min-w-[56px] flex-col items-center justify-center rounded-2xl bg-blue-600 px-3.5 text-white shadow-lg shadow-blue-500/30"
              >
                <Icon size={20} />
                <span className="mt-0.5 text-[10px] font-medium tracking-tight">{item.label}</span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.label}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(item.route)}
              className={`flex min-h-[44px] min-w-[52px] flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors ${
                item.active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={20} strokeWidth={item.active ? 2.4 : 2} />
              <span className="mt-0.5 text-[11px] font-medium">{item.label}</span>
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onOpenMenu}
          className="flex min-h-[44px] min-w-[52px] flex-col items-center justify-center rounded-xl px-2 py-1 text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu size={20} />
          <span className="mt-0.5 text-[11px] font-medium">More</span>
        </motion.button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;

