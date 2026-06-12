import { useInternetIdentity } from "@caffeineai/core-infrastructure";

/**
 * useAuth — Internet Identity authentication hook.
 * Wraps useInternetIdentity for Career City.
 */
export function useAuth() {
  const { identity, loginStatus, login, clear } = useInternetIdentity();

  const isAuthenticated = loginStatus === "success" && identity !== null;
  const isLoading = loginStatus === "idle" || loginStatus === "logging-in";

  return {
    identity,
    isAuthenticated,
    isLoading,
    loginStatus,
    login,
    logout: clear,
    principal: identity?.getPrincipal() ?? null,
  };
}
