// ============================================================================
// MOBILE SUB-PAGES — Push Notifications
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Notifications Module
// ============================================================================

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientNotificationPreferences,
  useUpdateNotificationPreferences,
  useSendTestNotification,
} from "../../client-usecase/usenotification-client-usecase";
import { useToastStore } from "@store/toast.store";

interface PrefState {
  transactions: boolean;
  security: boolean;
  marketing: boolean;
  reminders: boolean;
  promotions: boolean;
}

const PushNotifications: React.FC = () => {
  const { preferences, isLoading } = useClientNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const testNotifMutation = useSendTestNotification();
  const { showToast } = useToastStore();

  const [prefs, setPrefs] = useState<PrefState>({
    transactions: true,
    security: true,
    marketing: false,
    reminders: true,
    promotions: false,
  });

  useEffect(() => {
    if (preferences) {
      const push = (preferences as any).push || {};
      const email = (preferences as any).email || {};
      setPrefs({
        transactions: push.transactions ?? email.transactions ?? true,
        security: push.security ?? email.security ?? true,
        marketing: push.marketing ?? email.marketing ?? false,
        reminders: push.accountUpdates ?? push.reminders ?? true,
        promotions: push.marketing ?? push.promotions ?? false,
      });
    }
  }, [preferences]);

  const toggle = async (key: keyof PrefState) => {
    const nextVal = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: nextVal }));

    try {
      await updateMutation.mutateAsync({
        push: {
          transactions: key === "transactions" ? nextVal : prefs.transactions,
          security: key === "security" ? nextVal : prefs.security,
          marketing: key === "marketing" || key === "promotions" ? nextVal : prefs.marketing,
          accountUpdates: key === "reminders" ? nextVal : prefs.reminders,
        },
      });
      showToast("Notification preferences updated", "success");
    } catch {
      showToast("Failed to save preference", "error");
      setPrefs((p) => ({ ...p, [key]: !nextVal }));
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await testNotifMutation.mutateAsync();
      showToast("Test notification dispatched to your active devices", "success");
    } catch {
      showToast("Could not send test notification", "error");
    }
  };

  const categories = [
    { key: "transactions" as const, title: "Transaction Alerts", desc: "Get notified for every transaction on your account" },
    { key: "security" as const, title: "Security Alerts", desc: "Login attempts, password changes, and suspicious activity" },
    { key: "marketing" as const, title: "Marketing", desc: "New products, features, and special offers" },
    { key: "reminders" as const, title: "Payment Reminders", desc: "Upcoming bill payments and due dates" },
    { key: "promotions" as const, title: "Promotions", desc: "Exclusive deals and cashback offers" },
  ];

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Push Notifications"
          subtitle="Control what notifications you receive across your devices"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Mobile Banking", href: "/customer/mobile" },
            { label: "Notifications" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <StatsGridSkeleton />
      ) : (
        <div className="max-w-2xl space-y-3">
          {categories.map((cat) => (
            <motion.div key={cat.key} variants={dashboardItemVariants}>
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${prefs[cat.key] ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                      <Bell size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{cat.title}</h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{cat.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(cat.key)}
                    disabled={updateMutation.isPending}
                    className={`relative w-11 h-6 rounded-full transition-colors ${prefs[cat.key] ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[cat.key] ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </DashCard>
            </motion.div>
          ))}

          <DashCard className="mt-6">
            <motion.button
              onClick={handleSendTestNotification}
              disabled={testNotifMutation.isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium disabled:opacity-50"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {testNotifMutation.isPending ? "Sending..." : "Send Test Notification"}
            </motion.button>
          </DashCard>
        </div>
      )}
    </PageContainer>
  );
};

export default PushNotifications;
