import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader, Zap } from 'lucide-react';
import axios from 'axios';

interface UserSyncWrapperProps {
  children: React.ReactNode;
}

export const UserSyncWrapper: React.FC<UserSyncWrapperProps> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [isUserSynced, setIsUserSynced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Sync user with our backend
        const response = await axios.post('/api/auth/sync-user', {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress,
          display_name: user.fullName || user.firstName || 'User',
          profile_image: user.imageUrl
        });

        console.log('User sync response:', response.data);
        setIsUserSynced(true);
      } catch (error) {
        console.error('Error syncing user:', error);
        setError('Failed to sync user data. Please try refreshing the page.');
        
        // Still allow access even if sync fails
        setIsUserSynced(true);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, user]);

  // Show loading while Clerk is loading or while syncing user
  if (!isLoaded || isLoading) {
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
              {!isLoaded ? 'Loading...' : 'Setting up your account...'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {!isLoaded ? 'Please wait while we verify your authentication' : 'Syncing your profile data'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if sync failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Billow
              </h1>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Setup Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is synced, render the protected content
  return <>{children}</>;
};