import { useState, useEffect } from 'react'
import { fetchAPI } from '../lib/api'
import { RotateCcw, BookOpen } from 'lucide-react'
import BookCover from '../components/BookCover'

export default function MyBooks() {
  const [borrowedBooks, setBorrowedBooks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBorrowedItems = async () => {
    try {
      const catalog = await fetchAPI('/books/')
      setBorrowedBooks(catalog.filter(book => book.status === 'checked_out'))
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBorrowedItems() }, [])

  const handleReturn = async (bookId) => {
    try {
      await fetchAPI('/transactions/return', {
        method: 'POST',
        body: JSON.stringify({ book_id: bookId })
      })
      loadBorrowedItems()
    } catch (error) {
      alert(error.message)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="text-center space-y-3">
        <BookOpen size={36} className="mx-auto animate-pulse" />
        <p className="text-sm">Loading your books…</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Borrowed Books</h1>
        <p className="text-slate-500 mt-1">{borrowedBooks.length} book{borrowedBooks.length !== 1 ? 's' : ''} currently checked out</p>
      </div>

      {borrowedBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-700 font-semibold text-lg">Your shelf is empty</p>
          <p className="text-slate-400 text-sm mt-1">Head to the Catalog to borrow your first book.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {borrowedBooks.map(book => (
            <div
              key={book.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex hover:shadow-md transition-shadow duration-200"
            >
              <BookCover title={book.title} author={book.author} className="w-20 shrink-0" />

              <div className="p-4 flex flex-col flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{book.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{book.author}</p>

                <div className="mt-auto pt-3">
                  <button
                    onClick={() => handleReturn(book.id)}
                    className="flex items-center gap-1.5 w-full justify-center border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <RotateCcw size={12} /> Return Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
