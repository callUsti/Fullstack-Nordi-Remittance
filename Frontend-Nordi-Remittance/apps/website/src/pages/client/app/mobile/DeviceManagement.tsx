// ============================================================================
// MOBILE SUB-PAGES — Device Management
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Fraud-Security / Trusted Devices Module
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import {
  Smartphone, Monitor, Trash2, Tablet,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { EmptyState } from "@components/shared/EmptyState";
import { StatsGridSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientTrustedDevices,
  useRemoveTrustedDevice,
} from "../../client-usecase/usesecurity-client-usecase";
import { useToastStore } from "@store/toast.store";

const DeviceManagement: React.FC = () => {
  const { devices, isLoading, refetch } = useClientTrustedDevices();
  const removeDeviceMutation = useRemoveTrustedDevice();
  const { showToast } = useToastStore();

  const deviceIcon = (type?: string, name?: string) => {
    const lower = `${type || ""} ${name || ""}`.toLowerCase();
    if (lower.includes("phone") || lower.includes("ios") || lower.includes("android") || lower.includes("mobile")) {
      return <Smartphone size={18} />;
    }
    if (lower.includes("tablet") || lower.includes("ipad")) {
      return <Tablet size={18} />;
    }
    return <Monitor size={18} />;
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeDeviceMutation.mutateAsync(deviceId as any);
      showToast("Device removed successfully", "success");
      refetch();
    } catch {
      showToast("Failed to remove device", "error");
    }
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Device Management"
          subtitle="Manage trusted devices authorized to access your account"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Mobile Banking", href: "/customer/mobile" },
            { label: "Devices" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <StatsGridSkeleton />
      ) : devices.length === 0 ? (
        <EmptyState
          title="No Trusted Devices"
          description="You do not have any registered trusted devices. Devices you sign in from will appear here."
        />
      ) : (
        <div className="space-y-3">
          {devices.map((d: any, index: number) => {
            const id = d.id || d.deviceId || String(index);
            const name = d.name || d.deviceName || "Personal Device";
            const isCurrent = Boolean(d.current || d.isCurrent || index === 0);
            const lastActive = d.lastUsedAt
              ? new Date(d.lastUsedAt).toLocaleDateString()
              : d.lastActive || "Recently active";
            const location = d.ipAddress ? `IP: ${d.ipAddress}` : d.location || "Verified session";

            return (
              <motion.div key={id} variants={dashboardItemVariants}>
                <DashCard>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isCurrent
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {deviceIcon(d.deviceType || d.type, name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {name}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                              This device
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          {lastActive} • {location}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => handleRemoveDevice(id)}
                        disabled={removeDeviceMutation.isPending}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove device"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </DashCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default DeviceManagement;
