import { useState, useEffect } from 'react'
import { fetchAPI } from '../lib/api'
import { Plus, Trash2, Edit2, X, Loader2, CheckCircle2 } from 'lucide-react'
import BookCover from '../components/BookCover'
import { useAuthStore } from '../store/authStore'

export default function Inventory() {
  const { user } = useAuthStore()
  const isAdmin = user?.app_metadata?.role === 'admin'
  const [books, setBooks] = useState([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pubDate, setPubDate] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadInventory() }, [])

  const loadInventory = () => {
    fetchAPI('/books/').then(data => setBooks(data))
  }

  const handleAddBook = async (e) => {
    e.preventDefault()
    if (!title || !author) return
    setAdding(true)
    try {
      await fetchAPI('/books/', {
        method: 'POST',
        body: JSON.stringify({ title, author, publication_date: pubDate || null })
      })
      setTitle('')
      setAuthor('')
      setPubDate('')
      loadInventory()
    } catch (err) {
      alert(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Permanently delete this book from the catalog?')) return
    try {
      await fetchAPI(`/books/${id}`, { method: 'DELETE' })
      setBooks(books.filter(b => b.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdateBook = async (e) => {
    e.preventDefault()
    try {
      await fetchAPI(`/books/${editModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editModal.title,
          author: editModal.author,
          publication_date: editModal.publication_date
        })
      })
      setEditModal(null)
      loadInventory()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
        <p className="text-slate-500 mt-1">{books.length} books in catalog</p>
      </div>

      {/* Add Book Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Add New Book</h2>
        <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              placeholder="e.g. Dune"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Author</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              placeholder="e.g. Frank Herbert"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Publication Date</label>
            <input
              type="date"
              value={pubDate}
              onChange={e => setPubDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors h-10"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {adding ? 'Adding…' : 'Add Book'}
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-3">AI will automatically generate keywords and semantic embeddings in the background.</p>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Book</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Keywords</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {books.map(book => (
              <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <BookCover title={book.title} author={book.author} className="w-9 h-12 rounded-md shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{book.title}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{book.author}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {book.keywords?.length > 0
                      ? book.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {kw}
                          </span>
                        ))
                      : <span className="text-slate-300 text-xs italic animate-pulse">Generating…</span>
                    }
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    book.status === 'available'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {book.status === 'available' && <CheckCircle2 size={11} />}
                    {book.status === 'available' ? 'Available' : 'Checked Out'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditModal(book)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {books.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">No books in inventory yet. Add one above.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdateBook} className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Book</h2>
              <button type="button" onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  value={editModal.title}
                  onChange={e => setEditModal({ ...editModal, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Author</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  value={editModal.author}
                  onChange={e => setEditModal({ ...editModal, author: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Publication Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  value={editModal.publication_date || ''}
                  onChange={e => setEditModal({ ...editModal, publication_date: e.target.value })}
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button type="button" onClick={() => setEditModal(null)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
