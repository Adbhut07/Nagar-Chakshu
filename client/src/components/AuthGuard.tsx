'use client';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRegistration?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireRegistration = false 
}) => {
  const { user, loading, isUserRegistered, registrationLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Use Next.js hook instead of window.location

  useEffect(() => {
    if (!loading && !registrationLoading) {
      // Not authenticated - redirect to sign in
      if (!user && pathname !== '/signIn') {
        router.push('/signIn');
        return;
      }

      // User is authenticated but not registered
      if (user && !isUserRegistered && pathname !== '/register') {
        router.push('/register');
        return;
      }

      // User is authenticated and registered - redirect away from auth pages
      if (user && isUserRegistered && (pathname === '/signIn' || pathname === '/register')) {
        router.push('/');
        return;
      }
    }
  }, [user, loading, isUserRegistered, router, registrationLoading, pathname]);

  // Show loading while checking auth status
  if (loading || registrationLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Not authenticated
  if (!user) {
    return pathname === '/signIn' ? <>{children}</> : <LoadingSpinner message="Redirecting to sign in..." />;
  }

  // Authenticated but not registered
  if (!isUserRegistered) {
    return pathname === '/register' ? <>{children}</> : <LoadingSpinner message="Redirecting to registration..." />;
  }

  // Authenticated and registered - check if registration required for this route
  if (requireRegistration && !isUserRegistered) {
    return <LoadingSpinner message="Registration required..." />;
  }

  return <>{children}</>;
};

// Helper component to reduce repetition
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

export default AuthGuard;