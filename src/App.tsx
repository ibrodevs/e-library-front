import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './contexts/ThemeContext';
import NavbarAuth from './components/NavbarAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Footer from './components/Footer';
import './App.css';

const CatalogOptimized = lazy(() => import('./pages/CatalogOptimized'));
const Contacts = lazy(() => import('./pages/Contacts'));
const BookReaderOptimized = lazy(() => import('./pages/BookReaderOptimized'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-brand-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Загрузка...</p>
      </div>
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/read/');
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex flex-col min-h-screen">
      {!isReaderPage && !isLoginPage && <NavbarAuth />}
      <main className={isReaderPage || isLoginPage ? "flex-grow" : "flex-grow"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageFallback />}>
                  <CatalogOptimized />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <Suspense fallback={<PageFallback />}>
                <Contacts />
              </Suspense>
            }
          />
          <Route
            path="/read/:bookId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageFallback />}>
                  <BookReaderOptimized />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <Suspense fallback={<PageFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageFallback />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isReaderPage && !isLoginPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout />
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
