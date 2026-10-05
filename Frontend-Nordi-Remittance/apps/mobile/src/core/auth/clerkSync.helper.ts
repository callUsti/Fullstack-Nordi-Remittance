// ============================================================================
// CLERK SYNC HELPER - Centralizes post-authentication state & routing logic
// ============================================================================

const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "compliance_officer",
  "support_agent",
  "analyst",
];

export type MobileNavigator = 
  | { replace: (href: any) => void; push?: (href: any) => void }
  | ((path: any, options?: any) => void);

/**
 * Handles backend sync response after Clerk authentication completes on Mobile.
 * Centralizes OTP step-up routing, user formatting, and tab navigation.
 */
export function processAuthSyncResponse(
  response: any,
  navigator: MobileNavigator,
  setAuthenticated: (user: any) => void,
  defaultEmail?: string,
): void {
  const doReplace = (target: any) => {
    if (typeof navigator === "function") {
      navigator(target);
    } else if (navigator && typeof navigator.replace === "function") {
      navigator.replace(target);
    }
  };

  // 1. Handle OTP Step-Up verification
  if (response.requiresOtp) {
    doReplace({
      pathname: "/(auth)/otp",
      params: {
        otpSessionToken: response.otpSessionToken || "",
        email: response.email || defaultEmail || "",
        isAdmin: String(Boolean(response.isAdmin)),
      },
    });
    return;
  }

  // 2. Resolve authenticated user or admin account
  const userData: any = response.user || response.admin;
  if (!userData) return;

  const userRole: string = userData.role || "";
  const isAdmin = ADMIN_ROLES.includes(userRole) || Boolean(response.admin);
  const normalizedRole = isAdmin && !userRole ? "admin" : userRole || (isAdmin ? "admin" : "user");

  // 3. Update global authentication store
  setAuthenticated({
    id: userData.id || userData._id,
    email: userData.email,
    firstName: userData.firstName || (isAdmin ? "Admin" : "User"),
    lastName: userData.lastName || "",
    avatar: userData.avatar || userData.profilePicture,
    role: normalizedRole,
    kycStatus: userData.kycStatus || (isAdmin ? "verified" : "pending"),
    isEmailVerified: userData.emailVerified ?? true,
    isPhoneVerified: userData.phoneVerified ?? false,
  });

  // 4. Navigate to main tabs on mobile
  doReplace("/(tabs)");
}
