import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Navbar from './components/Navbar'
import Catalog from './pages/Catalog'
import Inventory from './pages/Inventory'
import MyBooks from './pages/MyBooks'
import AiAgentChat from './components/AiAgentChat'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const { initialize, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Open / Public Access Routes */}
            <Route path="/" element={<Catalog />} />

            {/* Client-Only Functional Area */}
            <Route path="/my-books" element={
              <ProtectedRoute allowedRoles={['client', 'librarian', 'admin']}>
                <MyBooks />
              </ProtectedRoute>
            } />

            {/* Core Administration Module Access Control */}
            <Route path="/inventory" element={
              <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                <Inventory />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        
        {/* Floating Context-Aware Agent Component */}
        {user && <AiAgentChat />}
      </div>
    </BrowserRouter>
  )
}