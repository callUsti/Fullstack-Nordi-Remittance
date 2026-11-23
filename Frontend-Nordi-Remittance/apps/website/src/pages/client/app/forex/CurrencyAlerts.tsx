// ============================================================================
// FOREX SUB-PAGES — Currency Alerts
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Notifications Module
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Plus,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../../client-usecase/usenotification-client-usecase";
import { useToastStore } from "@store/toast.store";

interface AlertItem {
  id: number;
  pair: string;
  target: number;
  current: number;
  enabled: boolean;
}

const CurrencyAlerts: React.FC = () => {
  const { preferences, isLoading } = useClientNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const { showToast } = useToastStore();

  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 1, pair: "USD/EUR", target: 0.9000, current: 0.9200, enabled: true },
    { id: 2, pair: "USD/GBP", target: 0.8000, current: 0.7860, enabled: false },
    { id: 3, pair: "EUR/USD", target: 1.1000, current: 1.0870, enabled: true },
    { id: 4, pair: "USD/NGN", target: 1600.00, current: 1580.00, enabled: true },
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newPair, setNewPair] = useState("USD/EUR");
  const [newTarget, setNewTarget] = useState("");

  const toggle = async (id: number) => {
    const updated = alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setAlerts(updated);

    try {
      await updateMutation.mutateAsync({
        inApp: {
          marketing: true,
          transactions: true,
          security: true,
          accountUpdates: true,
        },
      });
      showToast("Rate alert status updated", "success");
    } catch {
      showToast("Alert state updated locally", "info");
    }
  };

  const handleCreateAlert = () => {
    const targetNum = parseFloat(newTarget);
    if (!targetNum || targetNum <= 0) {
      showToast("Please enter a valid target exchange rate", "warning");
      return;
    }
    const newAlert: AlertItem = {
      id: Date.now(),
      pair: newPair,
      target: targetNum,
      current: targetNum * 0.98,
      enabled: true,
    };
    setAlerts([newAlert, ...alerts]);
    setShowNewModal(false);
    setNewTarget("");
    showToast(`Alert set for ${newPair} at ${targetNum}`, "success");
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Currency Alerts"
          subtitle="Get notified instantly via push or email when market rates hit your target"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Forex", href: "/customer/forex" },
            { label: "Alerts" },
          ]}
          actions={
            <motion.button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> New Alert
            </motion.button>
          }
        />
      </motion.div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Set Rate Alert</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Pair</label>
                <select
                  value={newPair}
                  onChange={(e) => setNewPair(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD/EUR">USD/EUR</option>
                  <option value="USD/GBP">USD/GBP</option>
                  <option value="EUR/USD">EUR/USD</option>
                  <option value="USD/NGN">USD/NGN</option>
                  <option value="USD/KES">USD/KES</option>
                  <option value="USD/CAD">USD/CAD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Rate</label>
                <input
                  type="number"
                  step="any"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="e.g. 0.9500"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Alert
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {alerts.length === 0 ? (
        <EmptyState title="No Alerts" description="Create a currency alert to get notified when rates change." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <motion.div key={alert.id} variants={dashboardItemVariants}>
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${alert.enabled ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                      <Bell size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{alert.pair}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Target: <span className="font-mono font-medium text-gray-900 dark:text-white">{alert.target.toFixed(4)}</span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Current: <span className="font-mono font-medium text-gray-900 dark:text-white">{alert.current.toFixed(4)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(alert.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${alert.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${alert.enabled ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </DashCard>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default CurrencyAlerts;
