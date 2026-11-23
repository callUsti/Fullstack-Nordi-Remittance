// ============================================================================
// REWARDS SUB-PAGES — My Rewards, Redeem, Special Offers, Partner Discounts
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageHeader from "@components/shared/PageHeader";
import { PageContainer } from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useToastStore } from "@store/toast.store";

const SpecialOffers: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const offers = [
    { title: "2X Points Weekend", desc: "Earn double points on all card transactions this weekend", gradient: "bg-blue-600", badge: "Limited Time", action: () => navigate("/customer/cards") },
    { title: "Refer & Earn", desc: "Get 1,000 bonus points for every friend who joins", gradient: "bg-emerald-600", badge: "Ongoing", action: () => showToast("Referral offer activated on your account!", "success") },
    { title: "Birthday Bonus", desc: "Celebrate with 500 free points on your birthday month", gradient: "bg-blue-600", badge: "Personal", action: () => showToast("Birthday bonus registered for your profile!", "success") },
    { title: "First Transfer Bonus", desc: "Earn 250 points on your first international transfer", gradient: "bg-amber-600", badge: "New", action: () => navigate("/customer/send/international") },
  ];

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Special Offers"
          subtitle="Exclusive offers and promotions for you"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Rewards", href: "/customer/rewards" },
            { label: "Offers" },
          ]}
        />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {offers.map((o) => (
          <motion.div key={o.title} variants={dashboardItemVariants}>
            <div className={`relative ${o.gradient} rounded-2xl p-5 sm:p-6 text-white overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-medium mb-3">
                {o.badge}
              </span>
              <h3 className="text-base sm:text-lg font-semibold mb-2">{o.title}</h3>
              <p className="text-xs sm:text-sm text-white/80 mb-4">{o.desc}</p>
              <button
                onClick={o.action}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                Claim Offer
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
};

export default SpecialOffers;
