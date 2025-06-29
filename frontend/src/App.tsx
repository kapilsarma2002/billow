import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Landing } from './components/pages/Landing';
import { Dashboard } from './components/pages/Dashboard';
import { Invoices } from './components/pages/Invoices';
import { Clients } from './components/pages/Clients';
import { Reports } from './components/pages/Reports';
import { Settings } from './components/pages/Settings';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { AuthCallback } from './components/auth/AuthCallback';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-all duration-500">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <SignedIn>
                <Layout>
                  <Dashboard />
                </Layout>
              </SignedIn>
            } />
            <Route path="/invoices" element={
              <SignedIn>
                <Layout>
                  <Invoices />
                </Layout>
              </SignedIn>
            } />
            <Route path="/clients" element={
              <SignedIn>
                <Layout>
                  <Clients />
                </Layout>
              </SignedIn>
            } />
            <Route path="/reports" element={
              <SignedIn>
                <Layout>
                  <Reports />
                </Layout>
              </SignedIn>
            } />
            <Route path="/settings" element={
              <SignedIn>
                <Layout>
                  <Settings />
                </Layout>
              </SignedIn>
            } />
            
            {/* Redirect unauthenticated users */}
            <Route path="*" element={
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            } />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;