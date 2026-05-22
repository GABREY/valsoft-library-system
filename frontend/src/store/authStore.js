import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user || null })
    
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null })
    })
  },
  
  // New Local Auth Methods
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    alert("Account created! You are now logged in.")
  },
  
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
  }
}))