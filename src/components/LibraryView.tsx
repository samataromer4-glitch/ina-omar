import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Bookmark, 
  ArrowUpRight, 
  X,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LibraryBook, LibraryLoan, Student, Teacher } from '../types';

interface LibraryViewProps {
  books: LibraryBook[];
  loans: LibraryLoan[];
  students: Student[];
  teachers?: Teacher[];
  onAddBook: (data: any) => Promise<void>;
  onUpdateBook: (id: string, data: any) => Promise<void>;
  onDeleteBook: (id: string) => Promise<void>;
  onIssueLoan: (data: any) => Promise<void>;
  onReturnLoan: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function LibraryView({
  books,
  loans,
  students,
  teachers = [],
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onIssueLoan,
  onReturnLoan,
  showToast = () => {}
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bookForm, setBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Textbook',
    totalCopies: 5,
    location: 'Shelf A1'
  });

  const [loanForm, setLoanForm] = useState({
    bookId: books[0]?.id || '',
    borrowerType: 'Student' as 'Student' | 'Teacher' | 'Staff',
    borrowerName: students[0]?.fullName || '',
    borrowerId: students[0]?.id || '',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] // 14 days
  });

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      showToast("Cinwaanka iyo qoraaga buugga waa khasab", "error");
      return;
    }
    setLoading(true);
    try {
      await onAddBook(bookForm);
      showToast("Buug cusub ayaa lagu daray maktabadda");
      setShowAddBookModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBook = books.find(b => b.id === loanForm.bookId);
    if (!selectedBook) {
      showToast("Fadlan dooro buug", "error");
      return;
    }
    if (selectedBook.availableCopies <= 0) {
      showToast("Buuggan hadda nuqul (copy) banaan ma jiro", "error");
      return;
    }
    if (!loanForm.borrowerName.trim()) {
      showToast("Magaca qofka buugga amaahanaya waa khasab", "error");
      return;
    }

    setLoading(true);
    try {
      await onIssueLoan({
        ...loanForm,
        bookTitle: selectedBook.title
      });
      showToast("Buugga si guul leh ayaa loo amaahiyey");
      setShowIssueModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: string) => {
    if (!confirm("Ma hubtaa in buuggan dib loo soo celiyey?")) return;
    try {
      await onReturnLoan(loanId);
      showToast("Buugga dib ayaa loo soo celiyey oo maktabadda loogu daray");
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    }
  };

  // Filtered lists
  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLoans = loans.filter(l => 
    l.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.borrowerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCopies = books.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0);
  const totalAvailable = books.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0);
  const activeBorrowed = loans.filter(l => l.status === 'Borrowed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif italic text-[#f5f5f5]">
            Maktabadda Iskuulka (Library)
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">
            Diiwaanka buugaagta, amaahinta ardayda iyo macallimiinta, iyo kormeerka soo celinta
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0f0f0f] border border-[#ffffff10] p-1 rounded-sm">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                activeTab === 'catalog' ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-white'
              }`}
            >
              Buugaagta ({books.length})
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                activeTab === 'loans' ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-white'
              }`}
            >
              Amaahda ({activeBorrowed} Hadda maqan)
            </button>
          </div>

          {activeTab === 'catalog' ? (
            <button
              onClick={() => setShowAddBookModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-sm text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ku dar Buug</span>
            </button>
          ) : (
            <button
              onClick={() => setShowIssueModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-sm text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Amaahi Buug</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-[#737373] uppercase tracking-wider block font-mono">Cinwaannada Buugaagta</span>
          <div className="text-xl font-bold font-mono text-[#f5f5f5] mt-1">{books.length}</div>
          <div className="text-[10px] text-[#525252] mt-0.5">Buug noocyo kala duwan</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-[#737373] uppercase tracking-wider block font-mono">Wadarta Nuqullada (Copies)</span>
          <div className="text-xl font-bold font-mono text-[#f5f5f5] mt-1">{totalCopies}</div>
          <div className="text-[10px] text-[#525252] mt-0.5">Xabbo buugaag ah</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-mono">Diyaar ah (Available)</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{totalAvailable}</div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Ku jira shelf-yada</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-mono">Amaahan (Borrowed)</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{activeBorrowed}</div>
          <div className="text-[10px] text-amber-500/70 mt-0.5">Arday/Macallin gacantooda</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'catalog' ? "Raadi buug cinwaankiisa, qoraaga, ama qaybta..." : "Raadi buug ama qofka amaahday..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm pl-9 pr-3 py-2 text-xs text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]"
          />
        </div>
      </div>

      {/* Catalog Display */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-[#ffffff10] rounded-sm">
              <BookOpen className="w-10 h-10 text-[#525252] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#a3a3a3]">Ma jiraan buugaag la helay</p>
              <p className="text-xs text-[#525252] mt-1">Guji batoonka kore si aad ugu darto buug cusub</p>
            </div>
          ) : (
            filteredBooks.map(book => (
              <div 
                key={book.id}
                className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 flex flex-col justify-between hover:border-[#7c3aed]/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight">{book.title}</h3>
                      <p className="text-[10px] text-[#737373] mt-0.5">By {book.author}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                      book.availableCopies > 0
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                    }`}>
                      {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'All Borrowed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#ffffff05]">
                    <div>
                      <span className="text-[#525252] block text-[10px] uppercase font-mono">Qaybta</span>
                      <span className="text-[#d4d4d4] font-medium">{book.category || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[#525252] block text-[10px] uppercase font-mono">Goobta (Location)</span>
                      <span className="text-[#c4b5fd] font-medium">{book.location || 'Shelf A'}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#737373] font-mono">
                    Wadarta nuqullada: {book.totalCopies} xabbo
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#ffffff05] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setLoanForm({
                        ...loanForm,
                        bookId: book.id
                      });
                      setShowIssueModal(true);
                    }}
                    disabled={book.availableCopies <= 0}
                    className="flex items-center gap-1 text-xs text-[#c4b5fd] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <span>Amaahi Buuggan</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Ma hubtaa inaad tirtirto buugga "${book.title}"?`)) {
                        onDeleteBook(book.id);
                      }
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-sm"
                    title="Tirtir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Loans Display */}
      {activeTab === 'loans' && (
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase font-mono tracking-wider text-[#737373] border-b border-[#ffffff10]">
              <tr>
                <th className="py-3 px-4">Buugga (Book)</th>
                <th className="py-3 px-4">Qofka Qaatay (Borrower)</th>
                <th className="py-3 px-4">Taariikhda Qaadashada</th>
                <th className="py-3 px-4">Waqtiga Soo Celinta (Due)</th>
                <th className="py-3 px-4">Xaaladda</th>
                <th className="py-3 px-4 text-right">Hawsha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05] text-[#d4d4d4]">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#525252]">
                    Ma jiraan buugaag hadda la amaahday
                  </td>
                </tr>
              ) : (
                filteredLoans.map(loan => {
                  const isReturned = loan.status === 'Returned';
                  const isOverdue = !isReturned && new Date(loan.dueDate) < new Date();

                  return (
                    <tr key={loan.id} className="hover:bg-[#ffffff02] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#f5f5f5]">
                        {loan.bookTitle}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#f5f5f5]">{loan.borrowerName}</div>
                        <div className="text-[10px] text-[#737373]">{loan.borrowerType}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#a3a3a3]">
                        {loan.issueDate}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#c4b5fd]">
                        {loan.dueDate}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                          isReturned
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : isOverdue
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        }`}>
                          {isReturned ? 'Returned' : isOverdue ? 'Overdue!' : 'Borrowed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isReturned ? (
                          <button
                            onClick={() => handleReturn(loan.id)}
                            className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-sm text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            Soo Celi
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#525252] font-mono">
                            {loan.returnDate || 'Returned'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddBookModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  Ku dar Buug Maktabadda
                </h2>
                <button onClick={() => setShowAddBookModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddBook} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Cinwaanka Buugga (Title) *</label>
                  <input
                    type="text"
                    required
                    value={bookForm.title}
                    onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                    placeholder="Tusaale: Physics for Secondary Schools"
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Qoraaga (Author) *</label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                    placeholder="Tusaale: Dr. John Smith"
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Qaybta (Category)</label>
                    <input
                      type="text"
                      value={bookForm.category}
                      onChange={e => setBookForm({ ...bookForm, category: e.target.value })}
                      placeholder="Science, Islamic, History"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Nuqullada (Total Copies)</label>
                    <input
                      type="number"
                      min="1"
                      value={bookForm.totalCopies}
                      onChange={e => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Goobta (Shelf Location)</label>
                    <input
                      type="text"
                      value={bookForm.location}
                      onChange={e => setBookForm({ ...bookForm, location: e.target.value })}
                      placeholder="Shelf B2"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">ISBN</label>
                    <input
                      type="text"
                      value={bookForm.isbn}
                      onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })}
                      placeholder="978-..."
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ffffff10]">
                  <button
                    type="button"
                    onClick={() => setShowAddBookModal(false)}
                    className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-sm bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : 'Ku dar Maktabadda'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Issue Loan Modal */}
      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  Amaahi Buug (Issue Book)
                </h2>
                <button onClick={() => setShowIssueModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIssueLoan} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Dooro Buugga *</label>
                  <select
                    value={loanForm.bookId}
                    onChange={e => setLoanForm({ ...loanForm, bookId: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                        {b.title} ({b.availableCopies} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Qofka Qaadanaya</label>
                    <select
                      value={loanForm.borrowerType}
                      onChange={e => setLoanForm({ ...loanForm, borrowerType: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Student">Arday (Student)</option>
                      <option value="Teacher">Macallin (Teacher)</option>
                      <option value="Staff">Shaqaale (Staff)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Taariikhda Soo Celinta *</label>
                    <input
                      type="date"
                      required
                      value={loanForm.dueDate}
                      onChange={e => setLoanForm({ ...loanForm, dueDate: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Magaca Qofka Qaadanaya *</label>
                  <input
                    type="text"
                    required
                    value={loanForm.borrowerName}
                    onChange={e => setLoanForm({ ...loanForm, borrowerName: e.target.value })}
                    placeholder="Magaca ardayda ama macallinka"
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ffffff10]">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-sm bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : 'Amaahi Buugga'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
