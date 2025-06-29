import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Upload,
  Download,
  FileText,
  Sun,
  Moon,
  Check,
  Crown,
  TrendingUp,
  BarChart3,
  Globe,
  Mail,
  Smartphone,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  Image,
  Mic,
  Headphones,
  X,
  Save,
  Loader
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  profile_image: string;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    invoice_limit: number;
    client_limit: number;
    messages_per_day: number;
    image_generation: boolean;
    custom_voice: boolean;
    priority_support: boolean;
    advanced_analytics: boolean;
    api_access: boolean;
    white_label: boolean;
  };
}

interface UsageMetrics {
  current_usage: {
    invoices_created: number;
    clients_created: number;
    messages_sent: number;
    images_generated: number;
  };
  limits: {
    invoice_limit: number;
    client_limit: number;
    messages_per_day: number;
    image_generation: boolean;
    custom_voice: boolean;
    priority_support: boolean;
    advanced_analytics: boolean;
    api_access: boolean;
    white_label: boolean;
  };
  period: {
    start: string;
    end: string;
  };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  popular?: boolean;
  features: string[];
}

interface UserPreferences {
  theme: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  weekly_reports: boolean;
  security_alerts: boolean;
  currency: string;
  timezone: string;
}

interface AnalyticsData {
  date: string;
  invoices_created: number;
  clients_added: number;
  revenue_generated: number;
}

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user: clerkUser } = useUser();
  
  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Ref to track if data has been fetched
  const dataFetchedRef = useRef(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    email: '',
    profile_image: ''
  });

  const [preferencesForm, setPreferencesForm] = useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    email_notifications: true,
    push_notifications: true,
    weekly_reports: true,
    security_alerts: true,
    currency: 'USD',
    timezone: 'UTC'
  });

  // Configure axios to use Clerk ID
  const getAuthHeaders = () => {
    return {
      'X-Clerk-ID': clerkUser?.id || '',
      'Content-Type': 'application/json'
    };
  };

  // Sync user from Clerk to database
  const syncUser = async () => {
    if (!clerkUser?.id) return;
    
    try {
      await axios.post('/api/auth/sync-user', {
        clerk_id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        display_name: clerkUser.fullName || clerkUser.firstName || '',
        profile_image: clerkUser.imageUrl || ''
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error syncing user:', error);
      // Don't throw error here, as user might already exist
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    // Prevent duplicate API calls in React strict mode
    if (dataFetchedRef.current || !clerkUser?.id) return;
    dataFetchedRef.current = true;
    
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        // First sync user from Clerk
        await syncUser();
        
        // Then fetch all settings data
        await Promise.all([
          fetchProfile(),
          fetchSubscription(),
          fetchUsageMetrics(),
          fetchAvailablePlans(),
          fetchPreferences(),
          fetchAnalytics()
        ]);
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching data:', error);
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            showNotification('error', 'Authentication failed. Please sign in again.');
          } else {
            showNotification('error', 'Failed to load settings data');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function to prevent memory leaks and duplicate calls
    return () => {
      isMounted = false;
    };
  }, [clerkUser?.id]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/settings/profile', {
        headers: getAuthHeaders()
      });
      setProfile(response.data);
      setProfileForm({
        display_name: response.data.display_name || '',
        email: response.data.email || '',
        profile_image: response.data.profile_image || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw error; // Re-throw 401 errors to be handled by the main error handler
      }
      // For other errors, set default values
      setProfileForm({
        display_name: clerkUser?.fullName || clerkUser?.firstName || '',
        email: clerkUser?.primaryEmailAddress?.emailAddress || '',
        profile_image: clerkUser?.imageUrl || ''
      });
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await axios.get('/api/subscription/status', {
        headers: getAuthHeaders()
      });
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw error;
      }
      // Set default subscription data
      setSubscription(null);
    }
  };

  const fetchUsageMetrics = async () => {
    try {
      const response = await axios.get('/api/subscription/usage', {
        headers: getAuthHeaders()
      });
      setUsageMetrics(response.data);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw error;
      }
      // Set default usage metrics
      setUsageMetrics(null);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await axios.get('/api/subscription/plans', {
        headers: getAuthHeaders()
      });
      console.log('Plans response:', response.data);
      if (response.data && response.data.plans) {
        setAvailablePlans(response.data.plans);
      } else {
        console.error('Invalid plans response structure:', response.data);
        setAvailablePlans([]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw error;
      }
      setAvailablePlans([]);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/settings/preferences', {
        headers: getAuthHeaders()
      });
      setPreferencesForm(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw error;
      }
      // Keep default preferences form values
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/analytics/usage', {
        headers: getAuthHeaders()
      });
      if (response.data && response.data.analytics) {
        setAnalytics(response.data.analytics);
      } else {
        console.error('Invalid analytics response structure:', response.data);
        setAnalytics([]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw error;
      }
      setAnalytics([]);
    }
  };

  // Update functions
  const updateProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/settings/profile', profileForm, {
        headers: getAuthHeaders()
      });
      setProfile(response.data.user);
      showNotification('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    setLoading(true);
    try {
      await axios.post('/api/settings/preferences', preferencesForm, {
        headers: getAuthHeaders()
      });
      showNotification('success', 'Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      showNotification('error', 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (planId: string) => {
    setLoading(true);
    try {
      await axios.post('/api/subscription/change', { plan_id: planId }, {
        headers: getAuthHeaders()
      });
      await fetchSubscription();
      await fetchUsageMetrics();
      setIsUpgradeModalOpen(false);
      showNotification('success', 'Subscription updated successfully');
    } catch (error) {
      console.error('Error changing plan:', error);
      showNotification('error', 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(amount);

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Bell className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and billing information</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <Card className="p-2" variant="glass">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card className="p-6" variant="glass">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {profileForm.profile_image || clerkUser?.imageUrl ? (
                      <img
                        src={profileForm.profile_image || clerkUser?.imageUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/20"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {profileForm.display_name?.charAt(0) || clerkUser?.firstName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">Profile Picture</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new profile picture</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.display_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    value={profileForm.profile_image}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, profile_image: e.target.value }))}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="gradient" onClick={updateProfile} disabled={loading}>
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Billing & Subscription */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <Card className="p-6" variant="glass">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h3>
                  </div>
                  <Button variant="secondary" onClick={() => setIsUpgradeModalOpen(true)}>
                    {subscription ? 'Upgrade Plan' : 'Choose Plan'}
                  </Button>
                </div>

                {subscription ? (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{subscription.plan.name} Plan</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {formatCurrency(subscription.plan.price)}/{subscription.plan.interval}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Next billing</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Invoices</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {subscription.plan.invoice_limit === -1 ? 'Unlimited' : subscription.plan.invoice_limit}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Clients</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {subscription.plan.client_limit === -1 ? 'Unlimited' : subscription.plan.client_limit}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Messages/Day</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {subscription.plan.messages_per_day === -1 ? 'Unlimited' : subscription.plan.messages_per_day}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Headphones className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Support</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {subscription.plan.priority_support ? 'Priority' : 'Standard'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 rounded-xl text-center">
                    <div className="mb-4">
                      <Crown className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Plan</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Choose a plan to unlock all features and start creating invoices
                      </p>
                    </div>
                    <Button variant="gradient" onClick={() => setIsUpgradeModalOpen(true)}>
                      Choose Your Plan
                    </Button>
                  </div>
                )}
              </Card>

              {/* Usage Metrics */}
              {usageMetrics ? (
                <Card className="p-6" variant="glass">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usage This Month</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoices Created</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {usageMetrics.current_usage?.invoices_created || 0} / {usageMetrics.limits?.invoice_limit === -1 ? '∞' : usageMetrics.limits?.invoice_limit || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${getUsagePercentage(usageMetrics.current_usage?.invoices_created || 0, usageMetrics.limits?.invoice_limit || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clients Added</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {usageMetrics.current_usage?.clients_created || 0} / {usageMetrics.limits?.client_limit === -1 ? '∞' : usageMetrics.limits?.client_limit || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${getUsagePercentage(usageMetrics.current_usage?.clients_created || 0, usageMetrics.limits?.client_limit || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Messages Sent</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {usageMetrics.current_usage?.messages_sent || 0} / {usageMetrics.limits?.messages_per_day === -1 ? '∞' : usageMetrics.limits?.messages_per_day || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${getUsagePercentage(usageMetrics.current_usage?.messages_sent || 0, usageMetrics.limits?.messages_per_day || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <div className="inline-flex p-2 rounded-lg mb-2 bg-blue-100 text-blue-600">
                          <Image className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Image Gen</p>
                        <p className="text-sm font-medium">{usageMetrics.limits?.image_generation ? 'Enabled' : 'Disabled'}</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex p-2 rounded-lg mb-2 bg-emerald-100 text-emerald-600">
                          <Mic className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Custom Voice</p>
                        <p className="text-sm font-medium">{usageMetrics.limits?.custom_voice ? 'Enabled' : 'Disabled'}</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex p-2 rounded-lg mb-2 bg-purple-100 text-purple-600">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Analytics</p>
                        <p className="text-sm font-medium">{usageMetrics.limits?.advanced_analytics ? 'Advanced' : 'Basic'}</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex p-2 rounded-lg mb-2 bg-orange-100 text-orange-600">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Support</p>
                        <p className="text-sm font-medium">{usageMetrics.limits?.priority_support ? 'Priority' : 'Standard'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6" variant="glass">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usage This Month</h3>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-900/20 dark:to-orange-900/20 rounded-xl text-center">
                    <div className="mb-4">
                      <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Usage Data</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Usage metrics will appear here once you start using the platform
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Theme Settings */}
              <Card className="p-6" variant="glass">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['light', 'dark', 'auto'].map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => {
                            setPreferencesForm(prev => ({ ...prev, theme: themeOption }));
                            if (themeOption !== 'auto') {
                              if ((themeOption === 'dark' && theme === 'light') || (themeOption === 'light' && theme === 'dark')) {
                                toggleTheme();
                              }
                            }
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            preferencesForm.theme === themeOption
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            {themeOption === 'light' && <Sun className="w-6 h-6" />}
                            {themeOption === 'dark' && <Moon className="w-6 h-6" />}
                            {themeOption === 'auto' && <Globe className="w-6 h-6" />}
                          </div>
                          <p className="text-sm font-medium capitalize">{themeOption}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                    <select
                      value={preferencesForm.language}
                      onChange={(e) => setPreferencesForm(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                      <select
                        value={preferencesForm.currency}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                      <select
                        value={preferencesForm.timezone}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card className="p-6" variant="glass">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'email_notifications', label: 'Email notifications', icon: <Mail className="w-4 h-4" /> },
                    { key: 'push_notifications', label: 'Push notifications', icon: <Smartphone className="w-4 h-4" /> },
                    { key: 'weekly_reports', label: 'Weekly reports', icon: <Calendar className="w-4 h-4" /> },
                    { key: 'security_alerts', label: 'Security alerts', icon: <Shield className="w-4 h-4" /> },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-500 dark:text-gray-400">
                          {setting.icon}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{setting.label}</span>
                      </div>
                      <button
                        onClick={() => setPreferencesForm(prev => ({ 
                          ...prev, 
                          [setting.key]: !prev[setting.key as keyof UserPreferences] 
                        }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferencesForm[setting.key as keyof UserPreferences] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferencesForm[setting.key as keyof UserPreferences] ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end">
                <Button variant="gradient" onClick={updatePreferences} disabled={loading}>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <Card className="p-6" variant="glass">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usage Analytics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics && analytics.length > 0 
                        ? formatCurrency(analytics.reduce((sum, data) => sum + data.revenue_generated, 0))
                        : '$0'
                      }
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Generated</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics && analytics.length > 0 
                        ? analytics.reduce((sum, data) => sum + data.invoices_created, 0)
                        : '0'
                      }
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Invoices Created</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics && analytics.length > 0 
                        ? analytics.reduce((sum, data) => sum + data.clients_added, 0)
                        : '0'
                      }
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clients Added</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {usageMetrics?.current_usage?.messages_sent || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</p>
                  </div>
                </div>

                {/* Simple chart representation */}
                <div className="h-64 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-6 flex items-end justify-between">
                  {analytics && analytics.length > 0 ? analytics.slice(0, 7).map((data, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg mb-2"
                        style={{ height: `${Math.max(data.invoices_created * 20, 10)}px` }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  )) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card className="p-6" variant="glass">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Account Security</h4>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-500/20">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-400">Secured by Clerk</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Your account is protected by Clerk's enterprise-grade security
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Authenticator App</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Use an authenticator app for additional security</p>
                    </div>
                    <Button variant="secondary" size="sm">Enable</Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Account Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                      </div>
                      <Button variant="secondary" size="sm">Change</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Manage Account</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Access your Clerk account settings</p>
                      </div>
                      <Button variant="secondary" size="sm">Manage</Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Danger Zone</h4>
                  <div className="p-4 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <h5 className="font-medium text-red-900 dark:text-red-400 mb-2">Delete Account</h5>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="secondary" className="text-red-600 border-red-300 hover:bg-red-50">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6" variant="glass">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Account Status</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics && analytics.length > 0 
                    ? analytics.reduce((sum, data) => sum + data.invoices_created, 0)
                    : '0'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics && analytics.length > 0 
                    ? formatCurrency(analytics.reduce((sum, data) => sum + data.revenue_generated, 0))
                    : '$0'
                  }
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6" variant="glass">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Import Clients
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Choose Your Plan"
        size="xl"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upgrade Your Plan</h3>
            <p className="text-gray-600 dark:text-gray-400">Choose the plan that best fits your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans && availablePlans.length > 0 ? availablePlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className="cursor-pointer"
              >
                <Card 
                  className={`p-6 relative transition-all ${
                    plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                  } ${selectedPlan === plan.id ? 'ring-2 ring-purple-500' : ''}`}
                  variant="glass"
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h4>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">/{plan.interval}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.popular ? "gradient" : "secondary"} 
                    className="w-full"
                    onClick={() => changePlan(plan.id)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <div className="flex items-center space-x-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Upgrading...</span>
                      </div>
                    ) : (
                      subscription?.plan.id === plan.id ? 'Current Plan' : 'Select Plan'
                    )}
                  </Button>
                </Card>
              </div>
            )) : (
              <div className="col-span-3 text-center py-8">
                <div className="flex items-center justify-center mb-4">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Loading available plans...</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};