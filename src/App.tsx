/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth';
import React, { ErrorInfo, ReactNode } from 'react';

// Pages to be created
import Home from './pages/Home';
import About from './pages/About';
import BlogList from './pages/BlogList';
import BlogDetails from './pages/BlogDetails';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const queryClient = new QueryClient();

function Layout() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 pt-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="min-h-screen font-sans bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-12">
      <Outlet />
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children?: ReactNode }, { hasError: boolean; error: Error | null }> {
  public state = {
    hasError: false,
    error: null as Error | null
  };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-3xl text-rose-900 dark:text-rose-200">
          <h2 className="text-2xl font-black mb-4">Something went wrong</h2>
          <pre className="p-4 bg-black/5 dark:bg-black/30 rounded-2xl overflow-auto text-sm font-mono leading-relaxed max-h-[300px]">
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button 
             onClick={() => window.location.reload()} 
             className="mt-6 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md transition-colors"
          >
             Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AdminLayout() {
  return (
    <div className="min-h-screen font-sans">
      <ErrorBoundary>
        <AdminDashboard />
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/admin" element={<AdminLayout />} />
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="blog" element={<BlogList />} />
                <Route path="blog/:slug" element={<BlogDetails />} />
                <Route path="contact" element={<Contact />} />
              </Route>
            </Routes>
          </Router>
          <Toaster position="bottom-center" />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
