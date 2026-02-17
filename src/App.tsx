import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import NavbarAuth from './components/NavbarAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CatalogOptimized from './pages/CatalogOptimized';
import Contacts from './pages/Contacts';
import BookReader from './pages/BookReader';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import Footer from './components/Footer';
import './App.css';

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
                <Catalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalog-optimized"
            element={
              <ProtectedRoute>
                <CatalogOptimized />
              </ProtectedRoute>
            }
          />
          <Route path="/contacts" element={<Contacts />} />
          <Route
            path="/read/:bookId"
            element={
              <ProtectedRoute>
                <BookReader />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
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
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout />
      </Router>
    </QueryClientProvider>
  );
}
