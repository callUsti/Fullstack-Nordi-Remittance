import React, { ReactNode } from "react";
import RightContainerNav from "../presentation/RightContainerNav";
import RightContainerFooter from "../presentation/RightContainerFooter";

interface AdminRightContainerProps {
  children?: ReactNode;
  onOpenMobileMenu?: () => void;
}

const AdminRightContainer = ({ children, onOpenMobileMenu }: AdminRightContainerProps) => {
  return (
    <div className="flex h-[100dvh] min-w-0 flex-col bg-white transition-colors duration-200 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/90 shadow-sm backdrop-blur-md dark:bg-gray-900/90 dark:shadow-gray-800/50">
        <RightContainerNav onOpenMobileMenu={onOpenMobileMenu} />
      </div>
      {/* Scrollable Content with bottom clearance for mobile bottom nav */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 pb-20 dark:bg-gray-950 lg:pb-0"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>

      <div className="hidden dark:bg-gray-900 lg:block">
        <RightContainerFooter />
      </div>
    </div>
  );
};

export default AdminRightContainer;
