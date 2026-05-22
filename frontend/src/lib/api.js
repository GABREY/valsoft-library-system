import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const fetchAPI = async (endpoint, options = {}) => {
  const session = useAuthStore.getState().session
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'An API error occurred')
  }
  
  return response.json()
}