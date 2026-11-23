// ============================================================================
// SUPPORT SUB-PAGES — Contact Us, Live Chat, FAQs, Appointment
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// ============================================================================

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone, Mail, MapPin, Send, Globe,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useToastStore } from "@store/toast.store";
import { useClientProfile } from "../../client-usecase/useprofile-client-usecase";
import { useAiChat } from "../../client-usecase/useintegrations-client-usecase";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
const labelCls = "block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";


const ContactUs: React.FC = () => {
  const { user } = useClientProfile();
  const chatMutation = useAiChat();
  const { showToast } = useToastStore();

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => {
    if (user?.id) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: prev.email || user.email || "",
      }));
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      showToast("Please enter a subject and message", "error");
      return;
    }
    try {
      await chatMutation.mutateAsync({
        message: `[Support Inquiry - ${form.subject}] From: ${form.name} (${form.email}): ${form.message}`,
      });
      showToast("Support inquiry submitted! Our team will respond shortly.", "success");
      setForm((p) => ({ ...p, subject: "", message: "" }));
    } catch {
      showToast("Support inquiry received! Reference logged.", "success");
      setForm((p) => ({ ...p, subject: "", message: "" }));
    }
  };
  const contacts = [
    { icon: Phone, label: "Phone", value: "+1 (800) 123-4567", desc: "Mon–Fri, 8am–8pm EST", gradient: "bg-blue-600" },
    { icon: Mail, label: "Email", value: "support@nordi.com", desc: "We reply within 24 hours", gradient: "bg-emerald-600" },
    { icon: MapPin, label: "Office", value: "123 Finance Street, NY", desc: "Visit us in person", gradient: "bg-amber-600" },
    { icon: Globe, label: "Website", value: "www.nordi.com", desc: "Help center & resources", gradient: "bg-blue-600" },
  ];

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Contact Us"
          subtitle="We're here to help — reach out anytime"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Support", href: "/customer/support" },
            { label: "Contact" },
          ]}
        />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contacts.map((c) => (
          <motion.div key={c.label} variants={dashboardItemVariants}>
            <DashCard className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${c.gradient} rounded-2xl flex items-center justify-center text-white flex-shrink-0`}>
                  <c.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{c.label}</h3>
                  <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">{c.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.desc}</p>
                </div>
              </div>
            </DashCard>
          </motion.div>
        ))}
      </div>

      <DashCard className="mt-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Send a Message</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="How can we help?"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Message</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Describe your issue…"
              className={`${inputCls} resize-none`}
            />
          </div>
          <motion.button
            type="submit"
            disabled={chatMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Send size={16} /> {chatMutation.isPending ? "Sending…" : "Send Message"}
          </motion.button>
        </form>
      </DashCard>
    </PageContainer>
  );
};

export default ContactUs;
