import { useState, useRef, useEffect } from 'react'
import { fetchAPI } from '../lib/api'
import { Sparkles, X, Send, Bot, User } from 'lucide-react'

export default function AiAgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi! I'm your AI Librarian. Ask me for a book recommendation or help finding something specific." }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userMsg = { role: 'user', content: input }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setIsTyping(true)

    try {
      const data = await fetchAPI('/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: newHistory })
      })
      setMessages([...newHistory, { role: 'model', content: data.response }])
    } catch {
      setMessages([...newHistory, { role: 'model', content: "Sorry, I couldn't connect to the library system right now." }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-indigo-500/30 hover:shadow-xl flex items-center justify-center transition-all duration-200 z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open AI Librarian"
      >
        <Sparkles size={22} />
      </button>

      {/* Chat Panel */}
      <div className={`fixed bottom-6 right-6 w-96 max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col transition-all duration-300 origin-bottom-right ${
        isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI Librarian</p>
              <p className="text-indigo-200 text-xs">Powered by Cohere</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <Bot size={13} />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about a book…"
            disabled={isTyping}
            className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  )
}
