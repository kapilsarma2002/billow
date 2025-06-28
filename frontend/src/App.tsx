import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Landing } from './components/pages/Landing';
import { Dashboard } from './components/pages/Dashboard';
import { Invoices } from './components/pages/Invoices';
import { Clients } from './components/pages/Clients';
import { Reports } from './components/pages/Reports';
import { Settings } from './components/pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-all duration-500">
          <Routes>
            {/* Landing page - no authentication required */}
            <Route path="/" element={<Landing />} />
            
            {/* Dashboard routes - wrapped in Layout */}
            <Route path="/dashboard" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />
            <Route path="/invoices" element={
              <Layout>
                <Invoices />
              </Layout>
            } />
            <Route path="/clients" element={
              <Layout>
                <Clients />
              </Layout>
            } />
            <Route path="/reports" element={
              <Layout>
                <Reports />
              </Layout>
            } />
            <Route path="/settings" element={
              <Layout>
                <Settings />
              </Layout>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;