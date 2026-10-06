import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { ScreenLoader } from '@/components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

/**
 * ProtectedRoute component - Guards routes based on authentication and roles in React Native
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectPath = '/(auth)/login',
}) => {
  const { isAuthenticated, user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <ScreenLoader message="Authenticating..." />;
  }

  // Not authenticated? Redirect to login
  if (!isAuthenticated) {
    return <Redirect href={redirectPath as any} />;
  }

  // Authenticated but role not allowed?
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
