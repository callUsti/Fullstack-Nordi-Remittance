// ============================================================================
// SECURITY SUB-PAGES — Settings, 2FA, Biometric, Activity, Alerts
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// ============================================================================

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, DashCard } from "@components/shared/DashboardPrimitives";
import { TableSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientSecurityActivityLog,
  useClientLoginHistory,
} from "../../client-usecase/usesecurity-client-usecase";
import { useClientNotifications } from "../../client-usecase/usenotifications-client-usecase";

const SecurityAlertsList: React.FC = () => {
  const { events, isLoading: eventsLoading } = useClientSecurityActivityLog({ limit: 20 });
  const { history: logins, isLoading: loginsLoading } = useClientLoginHistory({ limit: 10 });
  const { notifications, isLoading: notifLoading } = useClientNotifications({ limit: 20 });

  const isLoading = eventsLoading || loginsLoading || notifLoading;

  const alerts = useMemo(() => {
    const fromEvents = events.map((ev: any, idx: number) => {
      const status = String(ev.status || ev.severity || "info").toLowerCase();
      const severity =
        status === "failed" || status === "high" || status === "critical"
          ? "danger"
          : status === "warning" || status === "medium" || status === "suspicious"
            ? "warning"
            : status === "success" || status === "completed"
              ? "success"
              : "info";
      return {
        id: ev._id || ev.id || `ev-${idx}`,
        title: ev.action || ev.title || ev.type || "Security Event",
        desc: ev.description || ev.details || `${ev.device || "Browser"} • ${ev.ipAddress || ev.location || ""}`,
        time: ev.createdAt || ev.timestamp ? new Date(ev.createdAt || ev.timestamp).toLocaleString() : "Recently",
        severity,
      };
    });

    const fromLogins = logins.map((lg: any, idx: number) => {
      const failed = lg.status === "failed" || lg.success === false;
      return {
        id: lg._id || lg.id || `lg-${idx}`,
        title: failed ? "Failed login attempt" : "Account login detected",
        desc: `${lg.device || lg.browser || "Web Session"} ${lg.location || lg.ipAddress ? `• ${lg.location || lg.ipAddress}` : ""}`,
        time: lg.createdAt || lg.loginAt || lg.timestamp ? new Date(lg.createdAt || lg.loginAt || lg.timestamp).toLocaleString() : "Recently",
        severity: failed ? "warning" : "info",
      };
    });

    const fromNotifs = notifications
      .filter((n: any) => {
        const t = String(n.type || n.category || "").toLowerCase();
        return t.includes("security") || t.includes("login") || t.includes("auth") || t.includes("password");
      })
      .map((n: any, idx: number) => ({
        id: n._id || n.id || `nf-${idx}`,
        title: n.title || "Security Notification",
        desc: n.message || n.body || "",
        time: n.createdAt ? new Date(n.createdAt).toLocaleString() : "Recently",
        severity: "info",
      }));

    return [...fromEvents, ...fromLogins, ...fromNotifs];
  }, [events, logins, notifications]);

  const severityColor = (s: string) => {
    switch (s) {
      case "success":
        return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400";
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400";
      case "danger":
        return "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400";
      default:
        return "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400";
    }
  };

  const severityIcon = (s: string) => {
    switch (s) {
      case "success":
        return <CheckCircle2 size={16} />;
      case "warning":
        return <AlertTriangle size={16} />;
      case "danger":
        return <XCircle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Security Alerts"
          subtitle="Important security notifications for your account"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Security", href: "/customer/security" },
            { label: "Alerts" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : alerts.length === 0 ? (
        <EmptyState title="No Alerts" description="You're all clear — no security alerts at this time." />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <motion.div key={a.id} variants={dashboardItemVariants}>
              <DashCard>
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${severityColor(a.severity)} mt-0.5 flex-shrink-0`}>
                    {severityIcon(a.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">{a.title}</h4>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">{a.time}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">{a.desc}</p>
                  </div>
                </div>
              </DashCard>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default SecurityAlertsList;
