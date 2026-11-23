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
import {
  useClientSecuritySettings,
  useClientTwoFactorStatus,
  useEnable2FA,
  useConfirm2FA,
  useDisable2FA,
} from "../../client-usecase/usesecurity-client-usecase";
import { useToastStore } from "@store/toast.store";

const TwoFactorAuth: React.FC = () => {
  const { settings: securityData } = useClientSecuritySettings();
  const { tfa } = useClientTwoFactorStatus();
  const enable2FA = useEnable2FA();
  const confirm2FA = useConfirm2FA();
  const disable2FA = useDisable2FA();
  const { showToast } = useToastStore();

  const is2FAEnabled = tfa.enabled || ((securityData._raw as any)?.twoFactorEnabled ?? false);
  const [setupData, setSetupData] = useState<{ method: string; qrCode?: string; secret?: string } | null>(null);
  const [code, setCode] = useState("");

  const methods = [
    { key: "sms" as const, icon: Smartphone, label: "SMS Verification", desc: "Receive codes via text message" },
    { key: "email" as const, icon: Mail, label: "Email Verification", desc: "Receive codes via email" },
    { key: "authenticator" as const, icon: Key, label: "Authenticator App", desc: "Use Google/Microsoft Authenticator" },
  ];

  const handle2FA = async (method: "sms" | "email" | "authenticator") => {
    try {
      const res: any = await enable2FA.mutateAsync(method);
      setSetupData({
        method,
        qrCode: res?.qrCode || res?.qrCodeUrl,
        secret: res?.secret || res?.manualEntryKey,
      });
    } catch {
      // handled by mutation onError
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      showToast("Please enter the verification code", "error");
      return;
    }
    try {
      await confirm2FA.mutateAsync({ code, method: setupData?.method as any });
      setSetupData(null);
      setCode("");
    } catch {
      // handled by mutation onError
    }
  };

  const handleDisable = async () => {
    if (!code) {
      showToast("Enter your 2FA code or password to disable", "warning");
      return;
    }
    try {
      await disable2FA.mutateAsync({ password: code, code });
      setCode("");
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security to your account"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Security", href: "/customer/security" },
            { label: "2FA" },
          ]}
        />
      </motion.div>

      <div className="max-w-2xl">
        <DashCard className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2.5 ${is2FAEnabled ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"}`}
              >
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                  2FA is {is2FAEnabled ? "Enabled" : "Disabled"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {is2FAEnabled ? "Your account has extra protection" : "Enable 2FA for better security"}
                </p>
              </div>
            </div>
            <StatusBadge status={is2FAEnabled ? "active" : "inactive"} />
          </div>
        </DashCard>

        <div className="space-y-3">
          {methods.map((m) => (
            <motion.div key={m.key} variants={dashboardItemVariants}>
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                      <m.icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">{m.label}</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">{m.desc}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handle2FA(m.key)}
                    disabled={enable2FA.isPending}
                    className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {enable2FA.isPending ? "…" : tfa.method === m.key && is2FAEnabled ? "Configured" : "Setup"}
                  </motion.button>
                </div>
              </DashCard>
            </motion.div>
          ))}
        </div>

        {setupData && (
          <DashCard className="mt-6">
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Verify {setupData.method.toUpperCase()} Setup
            </h4>
            {setupData.secret && (
              <p className="mb-3 rounded-lg bg-gray-50 p-2 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Setup Key: {setupData.secret}
              </p>
            )}
            <form onSubmit={handleConfirm} className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit verification code"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={confirm2FA.isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {confirm2FA.isPending ? "Verifying…" : "Confirm 2FA"}
              </button>
            </form>
          </DashCard>
        )}

        {is2FAEnabled && !setupData && (
          <DashCard className="mt-6">
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Disable 2FA</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter current 2FA code to disable"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleDisable}
                disabled={disable2FA.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {disable2FA.isPending ? "Disabling…" : "Disable"}
              </button>
            </div>
          </DashCard>
        )}
      </div>
    </PageContainer>
  );
};

export default TwoFactorAuth;
