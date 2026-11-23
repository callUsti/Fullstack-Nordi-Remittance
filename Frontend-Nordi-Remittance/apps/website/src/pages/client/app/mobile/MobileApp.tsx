// ============================================================================
// MOBILE SUB-PAGES — Mobile App
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Device Management & Status
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import {
  Smartphone, Bell, Shield, Download,
  Fingerprint, Send, PieChart, QrCode, CheckCircle2,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientTrustedDevices } from "../../client-usecase/usesecurity-client-usecase";

const MobileApp: React.FC = () => {
  const { devices, isLoading } = useClientTrustedDevices();

  const features = [
    { icon: Send, title: "Quick Transfers", desc: "Send money in seconds", gradient: "bg-blue-600" },
    { icon: Fingerprint, title: "Biometric Login", desc: "Face ID & fingerprint access", gradient: "bg-emerald-600" },
    { icon: Bell, title: "Real-time Alerts", desc: "Instant transaction notifications", gradient: "bg-amber-600" },
    { icon: PieChart, title: "Budget Tracking", desc: "Track spending by category", gradient: "bg-blue-600" },
    { icon: QrCode, title: "QR Payments", desc: "Scan & pay instantly", gradient: "bg-blue-600" },
    { icon: Shield, title: "Bank-grade Security", desc: "End-to-end encryption", gradient: "bg-blue-600" },
  ];

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Mobile App"
          subtitle="Bank on the go with our mobile app"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Mobile Banking", href: "/customer/mobile" },
            { label: "App" },
          ]}
        />
      </motion.div>

      <DashCard className="mb-6 text-center py-8 sm:py-12">
        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
          <Smartphone size={28} />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Nordi Mobile Banking
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-4">
          Experience seamless banking from your phone. Available on iOS and Android with full account sync.
        </p>

        {!isLoading && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-6">
            <CheckCircle2 size={14} />
            <span>{devices.length} trusted {devices.length === 1 ? "device" : "devices"} connected</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <motion.button
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs sm:text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={16} /> App Store
          </motion.button>
          <motion.button
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs sm:text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={16} /> Google Play
          </motion.button>
        </div>
      </DashCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <motion.div key={f.title} variants={dashboardItemVariants}>
            <DashCard className="h-full">
              <div className={`w-10 h-10 ${f.gradient} rounded-xl flex items-center justify-center text-white mb-3`}>
                <f.icon size={18} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{f.desc}</p>
            </DashCard>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
};

export default MobileApp;
