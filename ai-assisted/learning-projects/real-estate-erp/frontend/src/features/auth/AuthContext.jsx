import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearAuthTokens,
  getRefreshToken,
  registerUnauthorizedHandler,
  setAuthTokens,
} from '../../services/apiClient';
import { authService } from '../../services/erpServices';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [backendReachable, setBackendReachable] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const handleForceLogout = useCallback(() => {
    clearAuthTokens();
    setUser(null);
  }, []);

  const bootstrapSession = useCallback(async () => {
    setInitializing(true);
    try {
      const status = await authService.getSetupStatus();
      setBackendReachable(true);
      setNeedsSetup(Boolean(status.needs_setup));

      if (!status.needs_setup) {
        try {
          // Attempt silent refresh via HttpOnly cookie if present
          const refreshed = await authService.refresh(getRefreshToken());
          setAuthTokens(refreshed.access_token, refreshed.refresh_token);
          setUser(refreshed.employee);
        } catch {
          clearAuthTokens();
          setUser(null);
        }
      }
    } catch (err) {
      if (err?.code === 'ERR_NETWORK' || !err?.response) {
        setBackendReachable(false);
      }
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(handleForceLogout);
    bootstrapSession();
  }, [bootstrapSession, handleForceLogout]);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    setAuthTokens(res.access_token, res.refresh_token);
    setUser(res.employee);
    setNeedsSetup(false);
    setBackendReachable(true);
    return res.employee;
  }, []);

  const setupInitialAdmin = useCallback(async (payload) => {
    const res = await authService.setupInitialAdmin(payload);
    setAuthTokens(res.access_token, res.refresh_token);
    setUser(res.employee);
    setNeedsSetup(false);
    setBackendReachable(true);
    return res.employee;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout(getRefreshToken());
    } catch {
      // Clear local session regardless of network outcome
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        backendReachable,
        needsSetup,
        login,
        setupInitialAdmin,
        logout,
        refreshProfile,
        retryConnection: bootstrapSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
