// ============================================================================
// REWARDS SUB-PAGES — My Rewards, Redeem, Special Offers, Partner Discounts
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// ============================================================================

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Gift, Star, Trophy, Zap, Crown,
} from "@constants/icons";
import PageHeader from "@components/shared/PageHeader";
import {
  PageContainer, DashCard, StatCard, StatsGrid,
} from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientReferralStats } from "../../client-usecase/useprofile-client-usecase";
import { useClientTransactions } from "../../client-usecase/usetransaction-client-usecase";

const MyRewards: React.FC = () => {
  const { stats: referralStats, isLoading: rLoading } = useClientReferralStats();
  const { transactions, isLoading: tLoading } = useClientTransactions({ limit: 50 });
  const isLoading = rLoading || tLoading;

  const tiers = [
    { name: "Silver", min: 0, max: 5000, color: "from-gray-400 to-gray-500" },
    { name: "Gold", min: 5000, max: 15000, color: "bg-amber-600" },
    { name: "Platinum", min: 15000, max: 50000, color: "bg-blue-600" },
    { name: "Diamond", min: 50000, max: 100000, color: "bg-blue-600" },
  ];

  const { points, thisMonthPoints, redeemedPoints } = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    let totalTxPoints = 0;
    let monthTxPoints = 0;

    for (const tx of transactions) {
      const amt = Math.round(Math.abs(Number(tx.amount || 0)));
      totalTxPoints += amt;
      const d = tx.createdAt || tx.date ? new Date(tx.createdAt || tx.date) : null;
      if (d && d.getMonth() === curMonth && d.getFullYear() === curYear) {
        monthTxPoints += amt;
      }
    }

    const referralBonus = Number(referralStats.totalReferrals || 0) * 1000;
    const apiPoints = Number(referralStats.rewardPoints || referralStats.totalPoints || 0);
    const total = apiPoints > 0 ? apiPoints : totalTxPoints + referralBonus;
    const redeemed = Number(referralStats.redeemedPoints || 0);

    return {
      points: total,
      thisMonthPoints: monthTxPoints,
      redeemedPoints: redeemed,
    };
  }, [transactions, referralStats]);

  const currentTier = tiers.find((t) => points >= t.min && points < t.max) || tiers[tiers.length - 1];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progress = nextTier
    ? Math.min(100, Math.max(0, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100))
    : 100;

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="My Rewards"
          subtitle="Track your rewards and loyalty points"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Rewards", href: "/customer/rewards" },
            { label: "My Rewards" },
          ]}
        />
      </motion.div>

      <DashCard className="mb-6 text-center py-8">
        <div className="w-16 h-16 mx-auto bg-amber-600 rounded-3xl flex items-center justify-center text-white mb-4">
          <Trophy size={28} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {points.toLocaleString()}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">Total Reward Points</p>
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${currentTier.color} text-white text-xs sm:text-sm font-medium`}>
          <Crown size={14} /> {currentTier.name} Member
        </div>
        {nextTier && (
          <div className="mt-6 max-w-xs mx-auto">
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{currentTier.name}</span>
              <span>{nextTier.name}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${nextTier.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {(nextTier.min - points).toLocaleString()} points to {nextTier.name}
            </p>
          </div>
        )}
      </DashCard>

      {isLoading ? (
        <StatsGridSkeleton count={3} />
      ) : (
        <StatsGrid cols={3}>
          <StatCard
            label="This Month"
            value={`+${thisMonthPoints.toLocaleString()}`}
            icon={<Zap size={20} />}
            iconColor="bg-emerald-600"
          />
          <StatCard
            label="Redeemed"
            value={redeemedPoints.toLocaleString()}
            icon={<Gift size={20} />}
            iconColor="bg-blue-600"
          />
          <StatCard
            label="Referral Bonus"
            value={(Number(referralStats.totalReferrals || 0) * 1000).toLocaleString()}
            icon={<Star size={20} />}
            iconColor="bg-amber-600"
          />
        </StatsGrid>
      )}
    </PageContainer>
  );
};

export default MyRewards;
