import { apiClient } from "@/lib/api/ApiClient";
import type { AuthSession, AuthUser } from "@/lib/api/types";
import { authRepository } from "@/repositories/AuthRepository";
import { googleAuthService } from "@/services/GoogleAuthService";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;

  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Login, logout, token refresh and forced logout (expired refresh token)
    // all flow through ApiClient, which pushes the new session here.
    const unsubscribe = apiClient.onSessionChange(setSession);

    const initializeSession = async () => {
      const restored = await apiClient.restoreSession();
      setSession(restored);
      setLoading(false);
    };

    initializeSession();

    return unsubscribe;
  }, []);

  const signUp = useCallback(
    (email: string, password: string, name: string) =>
      authRepository.register(email, password, name),
    []
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      authRepository.login(email, password),
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const idToken = await googleAuthService.promptSignIn();
    if (idToken) {
      await authRepository.loginWithGoogle(idToken);
    }
  }, []);

  const signOut = useCallback(async () => {
    await googleAuthService.signOut();
    await authRepository.logout();
  }, []);

  const contextValue = React.useMemo<AuthContextType>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signUp, signIn, signInWithGoogle, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be within AuthProvider");
  }
  return context;
}
