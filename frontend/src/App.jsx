// Frontend build trigger - v2 - Deploying frontend build
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { SearchProvider } from './context/SearchContext'

// Pages
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import ReportsPage from './pages/ReportsPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <NotificationProvider>
              <SearchProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />

                  {/* Protected Routes */}
                  <Route element={<Layout />}>
                    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute requiredRole="Analyst"><UploadPage /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requiredRole="Admin"><AdminPage /></ProtectedRoute>} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </SearchProvider>
            </NotificationProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
