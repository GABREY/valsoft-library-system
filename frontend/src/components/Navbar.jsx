import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BookOpen, LogOut, ShieldCheck, Bookmark, User, X } from 'lucide-react'

export default function Navbar() {
  const { user, signIn, signUp, signOut } = useAuthStore()
  const role = user?.app_metadata?.role || 'client'
  const location = useLocation()

  const [showAuthForm, setShowAuthForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    try {
      isSignUp ? await signUp(email, password) : await signIn(email, password)
      setShowAuthForm(false)
      setEmail('')
      setPassword('')
    } catch (error) {
      alert(error.message)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-slate-900 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Left: Logo + Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-xl tracking-tight">
              <div className="bg-indigo-500 p-1.5 rounded-lg">
                <BookOpen size={18} />
              </div>
              ValLib
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Catalog
              </Link>

              {user && (
                <Link
                  to="/my-books"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive('/my-books') ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Bookmark size={14} /> My Books
                </Link>
              )}

              {(role === 'admin' || role === 'librarian') && (
                <Link
                  to="/inventory"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive('/inventory') ? 'bg-indigo-500/20 text-indigo-300' : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                  }`}
                >
                  <ShieldCheck size={14} /> Management
                </Link>
              )}
            </div>
          </div>

          {/* Right: Auth */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-7 h-7 bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <User size={14} className="text-indigo-300" />
                  </div>
                  <span className="text-slate-300">{user.email}</span>
                  <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">{role}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setShowAuthForm(!showAuthForm)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </button>

                {showAuthForm && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
                      <button onClick={() => setShowAuthForm(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                      </button>
                    </div>
                    <form onSubmit={handleAuthSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="you@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="••••••••"
                        />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </button>
                    </form>
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="w-full text-center mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
