import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader, Zap } from 'lucide-react';
import api from '../../utils/api';

export const AuthCallback: React.FC = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from state, default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (isLoaded && user) {
        try {
          // Create or update user in our database
          await api.post('/auth/sync-user', {
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            display_name: user.fullName || user.firstName || 'User',
            profile_image: user.imageUrl
          });

          // Redirect to intended destination or dashboard
          navigate(from, { replace: true });
        } catch (error) {
          console.error('Error syncing user:', error);
          // Still redirect to dashboard even if sync fails
          navigate(from, { replace: true });
        }
      }
    };

    handleAuthCallback();
  }, [isLoaded, user, navigate, from]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Billow
            </h1>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Setting up your account...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we prepare your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};