import React, { useState } from "react";
import UserLeftContainer from "../container/UserLeftContainer";
import UserRightContainer from "../container/UserRightContainer";
import UserRoutes from "../UserRoutes";
import MobileBottomNav from "../presentation/MobileBottomNav";
import { useRealtimeUpdates } from "@hooks/useSocket";
import { useSessionManager } from "@hooks/useSessionManager";
import { SessionExpiredModal } from "@components/shared/SessionExpiredModal";

const UserMainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Activate all real-time WebSocket subscriptions for user role
  useRealtimeUpdates("user");

  // Session management: inactivity timeout, 401 handling, multi-tab sync
  const { modalState, handleExtendSession, handleRedirect } = useSessionManager("user");

  return (
    <>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-white transition-colors duration-200 dark:bg-gray-950">
        {/* Left Container - docked on desktop (lg+), slide-over drawer on mobile/tablet */}
        <UserLeftContainer
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Right Container - full width on mobile, flex-1 on desktop */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white transition-colors duration-200 dark:bg-gray-950">
          <UserRightContainer onOpenMobileMenu={() => setMobileMenuOpen(true)}>
            <UserRoutes />
          </UserRightContainer>
        </div>
      </div>

      {/* Sleek Mobile Bottom Tab Bar (< lg) */}
      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />

      {/* Session expired / inactivity warning modal */}
      <SessionExpiredModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        reason={modalState.reason}
        countdown={modalState.countdown}
        onExtend={handleExtendSession}
        onRedirect={handleRedirect}
      />
    </>
  );
};

export default UserMainLayout;
