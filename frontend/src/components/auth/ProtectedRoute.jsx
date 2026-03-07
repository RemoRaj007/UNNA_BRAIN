import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  // Login is disabled: allow all routes in demo/frontend mode.
  if (!isAuthenticated) {
    return children
  }

  if (requiredRole && (!user?.roles || !user.roles.includes(requiredRole))) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
