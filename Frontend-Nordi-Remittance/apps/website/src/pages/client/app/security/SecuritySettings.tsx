// ============================================================================
// SECURITY SUB-PAGES — Settings, 2FA, Biometric, Activity, Alerts
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  Clock,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Key,
  RefreshCw,
  MonitorSmartphone,
  Mail,
  Bell,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, DashCard, StatCard, StatsGrid, StatusBadge } from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton, TableSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientSecuritySettings, useUpdateSecuritySettings } from "../../client-usecase/usesecurity-client-usecase";
import { useChangePassword } from "../../client-usecase/useauth-client-usecase";
import { useToastStore } from "@store/toast.store";

const SecuritySettings: React.FC = () => {
  const { settings: securityData, isLoading } = useClientSecuritySettings();
  const updateMutation = useUpdateSecuritySettings();
  const changePasswordMutation = useChangePassword();
  const { showToast } = useToastStore();

  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
  const labelCls = "block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  const scoreVal = securityData.securityScore ?? 75;
  const scoreColor = scoreVal >= 80 ? "text-emerald-500" : scoreVal >= 50 ? "text-amber-500" : "text-red-500";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) {
      showToast("Please enter your current and new password", "error");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast("Passwords don't match", "error");
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm,
      } as any);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch {
      // handled by mutation onError
    }
  };

  const toggleSetting = (key: "loginNotifications" | "transactionNotifications" | "failedLoginNotifications" | "newDeviceNotifications") => {
    updateMutation.mutate({
      [key]: !securityData[key],
    });
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Security Settings"
          subtitle="Manage your account security and privacy"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Security", href: "/customer/security" },
            { label: "Settings" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <StatsGridSkeleton count={3} />
      ) : (
        <>
          <DashCard className="mb-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${scoreVal}, 100`}
                    className={scoreColor}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-medium ${scoreColor}`}>{scoreVal}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Security Score</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {scoreVal >= 80
                    ? "Excellent! Your account is well protected."
                    : "Consider improving your security settings."}
                </p>
              </div>
            </div>
          </DashCard>

          <DashCard>
            <h3 className="mb-6 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={labelCls}>Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                    placeholder="New password"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Confirm password"
                    className={inputCls}
                  />
                </div>
              </div>
              <motion.button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-medium text-white disabled:opacity-50 sm:text-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {changePasswordMutation.isPending ? "Updating…" : "Update Password"}
              </motion.button>
            </form>
          </DashCard>

          <DashCard className="mt-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              Security Preferences
            </h3>
            <div className="space-y-3">
              {(
                [
                  {
                    key: "loginNotifications",
                    label: "Login Alerts",
                    desc: "Notify me whenever a new login occurs on my account",
                  },
                  {
                    key: "transactionNotifications",
                    label: "Transaction Security Alerts",
                    desc: "Notify me on outgoing transfers and withdrawals",
                  },
                  {
                    key: "failedLoginNotifications",
                    label: "Failed Login Warnings",
                    desc: "Alert me if multiple failed login attempts are detected",
                  },
                  {
                    key: "newDeviceNotifications",
                    label: "New Device Detection",
                    desc: "Notify me when my account is accessed from an unrecognized device",
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">{item.label}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting(item.key)}
                    disabled={updateMutation.isPending}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      securityData[item.key] ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        securityData[item.key] ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </DashCard>
        </>
      )}
    </PageContainer>
  );
};

export default SecuritySettings;
