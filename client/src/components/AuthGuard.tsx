// components/AuthGuard.tsx
'use client';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (!loading && !registrationLoading) {
      const currentPath = window.location.pathname;
      
      // Not authenticated - redirect to sign in
      if (!user) {
        if (currentPath !== '/signin') {
          router.push('/signin');
        }
        return;
      }

      // User is authenticated but not registered
      if (user && !isUserRegistered) {
        if (currentPath !== '/register') {
          router.push('/register');
        }
        return;
      }

      // User is authenticated and registered
      if (user && isUserRegistered) {
        // Redirect away from auth pages
        if (currentPath === '/signin' || currentPath === '/register') {
          router.push('/dashboard');
          return;
        }
        
        // If registration is required for this route and user is registered, allow access
        if (requireRegistration && !isUserRegistered) {
          router.push('/register');
          return;
        }
      }
    }
  }, [user, loading, isUserRegistered, requireRegistration, router, registrationLoading]);

  // Show loading while checking auth status or registration
  if (loading || registrationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message while navigation is happening
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (user && !isUserRegistered && window.location.pathname !== '/register') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to registration...</p>
        </div>
      </div>
    );
  }

  if (requireRegistration && !isUserRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Registration required...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;