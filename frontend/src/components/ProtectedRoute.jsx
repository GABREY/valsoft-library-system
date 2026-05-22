import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, session } = useAuthStore()

  // Extract the role from Supabase user metadata (defaults to client)
  const userRole = user?.app_metadata?.role || 'client'

  if (!session) {
    // If not logged in, redirect to login/home screen
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If logged in but lacking permissions, redirect to catalog
    return <Navigate to="/" replace />
  }

  return children
}