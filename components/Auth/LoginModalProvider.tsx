'use client';

import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import Image from 'next/image';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

// Minimal inline icons to avoid duplication
const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const DiscordIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const AuthButton = ({
  onClick,
  disabled,
  icon,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-center gap-3 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
  >
    {icon}
    <span className="font-medium">{children}</span>
  </Button>
);

type LoginModalContextType = {
  openLoginModal: () => Promise<boolean>;
  openLoginFullscreen: () => Promise<boolean>;
};

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal must be used within LoginModalProvider');
  return ctx;
}

export default function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const { user, signInWithGoogle, signInWithDiscord, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const openedRef = useRef(false);

  const openLoginModal = useCallback(() => {
    if (!openedRef.current) {
      setIsOpen(true);
      setIsFullscreen(false);
      openedRef.current = true;
    }
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const openLoginFullscreen = useCallback(() => {
    if (!openedRef.current) {
      setIsOpen(true);
      setIsFullscreen(true);
      openedRef.current = true;
    }
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    const handler = (_e: Event) => {
      openLoginModal();
    };
    window.addEventListener('open-login-modal', handler as EventListener);
    return () => window.removeEventListener('open-login-modal', handler as EventListener);
  }, [openLoginModal]);

  useEffect(() => {
    if (user && isOpen) {
      setIsOpen(false);
      openedRef.current = false;
      resolverRef.current?.(true);
      resolverRef.current = null;
    }
  }, [user, isOpen]);

  const close = () => {
    setIsOpen(false);
    setIsFullscreen(false);
    openedRef.current = false;
    resolverRef.current?.(false);
    resolverRef.current = null;
  };

  const handleSignIn = async (fn: () => Promise<void>) => {
    setIsSigningIn(true);
    try {
      await fn();
      // Reload page
      window.location.reload();
    } catch (e) {
      console.error('Sign in failed:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <LoginModalContext.Provider value={{ openLoginModal, openLoginFullscreen }}>
      {children}
      <Modal
        isOpen={isOpen}
        size={isFullscreen ? 'md' : 'sm'}
        onClose={!isFullscreen ? close : undefined}
      >
        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="w-full">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Image
                  src="/llama.png"
                  className="w-24 h-24 dark:brightness-0 dark:invert"
                  alt="Dramamancer Logo"
                  width={96}
                  height={96}
                />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Sign in to continue
              </h1>
            </div>

            <div className="space-y-3">
              <AuthButton
                onClick={() => handleSignIn(signInWithGoogle)}
                disabled={isSigningIn}
                icon={<GoogleIcon />}
              >
                Continue with Google
              </AuthButton>
              <AuthButton
                onClick={() => handleSignIn(signInWithDiscord)}
                disabled={isSigningIn}
                icon={<DiscordIcon />}
              >
                Continue with Discord
              </AuthButton>
            </div>

            <p className="text-xs text-slate-500 text-center mt-4">
              Dramamancer team
            </p>
          </div>
        )}
      </Modal>
    </LoginModalContext.Provider>
  );
}
