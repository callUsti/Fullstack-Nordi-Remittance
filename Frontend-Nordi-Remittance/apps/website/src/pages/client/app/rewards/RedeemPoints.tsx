// ============================================================================
// REWARDS SUB-PAGES — My Rewards, Redeem, Special Offers, Partner Discounts
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// ============================================================================

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Star, ShoppingBag, Coffee, Plane, CreditCard, Crown,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientReferralStats } from "../../client-usecase/useprofile-client-usecase";
import { useClientTransactions } from "../../client-usecase/usetransaction-client-usecase";
import { useToastStore } from "@store/toast.store";

const RedeemPoints: React.FC = () => {
  const { stats: referralStats } = useClientReferralStats();
  const { transactions } = useClientTransactions({ limit: 50 });
  const { showToast } = useToastStore();
  const [spentPoints, setSpentPoints] = useState(0);

  const earnedPoints = useMemo(() => {
    const txPoints = transactions.reduce((s: number, tx: any) => s + Math.round(Math.abs(Number(tx.amount || 0))), 0);
    const refPoints = Number(referralStats.totalReferrals || 0) * 1000;
    const apiPoints = Number(referralStats.rewardPoints || referralStats.totalPoints || 0);
    return apiPoints > 0 ? apiPoints : txPoints + refPoints;
  }, [transactions, referralStats]);

  const availablePoints = Math.max(0, earnedPoints - spentPoints);

  const handleRedeem = (item: { name: string; points: number }) => {
    if (availablePoints < item.points) {
      showToast(`You need ${(item.points - availablePoints).toLocaleString()} more points to redeem ${item.name}`, "warning");
      return;
    }
    setSpentPoints((p) => p + item.points);
    showToast(`Redeemed ${item.name} for ${item.points.toLocaleString()} points!`, "success");
  };
  const rewards = [
    { name: "Amazon Gift Card", points: 2500, icon: ShoppingBag, gradient: "bg-amber-600" },
    { name: "Coffee Voucher", points: 500, icon: Coffee, gradient: "bg-amber-600" },
    { name: "Flight Miles", points: 5000, icon: Plane, gradient: "bg-blue-600" },
    { name: "Cash Back", points: 1000, icon: CreditCard, gradient: "bg-emerald-600" },
    { name: "Movie Tickets", points: 800, icon: Star, gradient: "bg-blue-600" },
    { name: "Premium Subscription", points: 3000, icon: Crown, gradient: "bg-blue-600" },
  ];

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Redeem Points"
          subtitle="Exchange your points for exciting rewards"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Rewards", href: "/customer/rewards" },
            { label: "Redeem" },
          ]}
        />
      </motion.div>

      <DashCard className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Available Points</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{availablePoints.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-600 text-white">
            <Star size={24} />
          </div>
        </div>
      </DashCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <motion.div key={r.name} variants={dashboardItemVariants}>
            <DashCard className="h-full flex flex-col">
              <div className={`w-12 h-12 ${r.gradient} rounded-2xl flex items-center justify-center text-white mb-4`}>
                <r.icon size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{r.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{r.points.toLocaleString()} points</p>
              <div className="mt-auto">
                <motion.button
                  onClick={() => handleRedeem(r)}
                  className={`w-full py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${r.gradient} text-white`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Redeem
                </motion.button>
              </div>
            </DashCard>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
};

export default RedeemPoints;
