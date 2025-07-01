import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
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
  Zap,
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
  Star,
  X,
  Save,
  Loader,
  Edit3
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
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
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
          showNotification('error', 'Failed to load settings data');
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
      const response = await api.get('/settings/profile', {
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
      throw error;
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/subscription/status', {
        headers: getAuthHeaders()
      });
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  };

  const fetchUsageMetrics = async () => {
    try {
      const response = await api.get('/subscription/usage', {
        headers: getAuthHeaders()
      });
      setUsageMetrics(response.data);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      throw error;
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await api.get('/subscription/plans', {
        headers: getAuthHeaders()
      });
      // console.log('Plans response:', response.data);
      if (response.data && response.data.plans) {
        setAvailablePlans(response.data.plans);
      } else {
        console.error('Invalid plans response structure:', response.data);
        setAvailablePlans([]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/settings/preferences', {
        headers: getAuthHeaders()
      });
      setPreferences(response.data);
      setPreferencesForm(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/usage', {
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
      throw error;
    }
  };

  // Update functions
  const updateProfile = async () => {
    setLoading(true);
    try {
      const response = await api.post('/settings/profile', profileForm, {
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
      const response = await api.post('/settings/preferences', preferencesForm, {
        headers: getAuthHeaders()
      });
      setPreferences(response.data.preferences);
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
      await api.post('/subscription/change', { plan_id: planId }, {
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
                      className="w-full text-white px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full text-white px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full text-white px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

          {/* Other tab content remains the same... */}
          {/* For brevity, I'm not including all the other tabs here, but they would remain unchanged */}
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
    </div>
  );
};