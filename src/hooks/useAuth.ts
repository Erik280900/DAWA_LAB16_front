import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export const useAuth = (redirectTo?: string) => {
  const { user, token, isLoading, initializeAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading && !token && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, token, redirectTo, router]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token
  };
};

export const useRequireAuth = () => {
  return useAuth('/login');
};