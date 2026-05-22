import { useState, useEffect } from 'react'
import { fetchAPI } from '../lib/api'
import { Search, CheckCircle, XCircle, Sparkles, Type, Users, Tag } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import BookCover from '../components/BookCover'

const SEARCH_MODES = [
  { value: 'vibe', label: 'AI Vibe', icon: Sparkles },
  { value: 'title', label: 'Title', icon: Type },
  { value: 'author', label: 'Author', icon: Users },
  { value: 'keyword', label: 'Keyword', icon: Tag },
]

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
    <div className="h-52 bg-slate-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
      <div className="h-3 bg-slate-200 rounded-md w-1/2" />
      <div className="h-8 bg-slate-100 rounded-md w-full mt-3" />
    </div>
  </div>
)

export default function Catalog() {
  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('vibe')
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  const executeSearch = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ search_type: searchType })
      if (searchQuery) params.append('query', searchQuery)
      const data = await fetchAPI(`/books/search?${params.toString()}`)
      setBooks(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAPI('/books/')
      .then(data => setBooks(data))
      .finally(() => setLoading(false))
  }, [])

  const handleCheckout = async (bookId) => {
    try {
      await fetchAPI('/transactions/checkout', {
        method: 'POST',
        body: JSON.stringify({ book_id: bookId })
      })
      setBooks(books.map(b => b.id === bookId ? { ...b, status: 'checked_out' } : b))
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Library Catalog</h1>
        <p className="text-slate-500 mt-1">Browse and discover your next read</p>
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {SEARCH_MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSearchType(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                searchType === value
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form
          onSubmit={e => { e.preventDefault(); executeSearch() }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                searchType === 'vibe'
                  ? "e.g. 'a dystopian world with artificial intelligence'…"
                  : `Search by ${searchType}…`
              }
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        {searchType === 'vibe' && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles size={11} /> AI Vibe Search uses semantic embeddings to find conceptually similar books
          </p>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-slate-500">{books.length} book{books.length !== 1 ? 's' : ''} found</p>
      )}

      {/* Book Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : books.length === 0
          ? (
            <div className="col-span-full text-center py-20 text-slate-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No books found</p>
              <p className="text-sm mt-1">Try a different search term or mode</p>
            </div>
          )
          : books.map(book => (
            <div
              key={book.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <BookCover title={book.title} author={book.author} className="h-52 w-full" />

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{book.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{book.author}</p>

                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    book.status === 'available' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {book.status === 'available'
                      ? <><CheckCircle size={12} /> Available</>
                      : <><XCircle size={12} /> Checked Out</>}
                  </span>

                  {user && book.status === 'available' && (
                    <button
                      onClick={() => handleCheckout(book.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Borrow
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
