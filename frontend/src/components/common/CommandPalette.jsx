import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Sun, Bell, Search, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useNotification } from '../../context/NotificationContext'
import { useSearch } from '../../context/SearchContext'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { showNotification } = useNotification()
  const { searchQuery, performSearch, searchResults, isSearching, clearSearch } = useSearch()

  // Keyboard shortcut to open
  useState(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const quickActions = [
    { id: 'upload', label: 'Upload File', icon: '📤', action: () => window.location.href = '/upload' },
    { id: 'reports', label: 'View Reports', icon: '📊', action: () => window.location.href = '/reports' },
    { id: 'dashboard', label: 'Dashboard', icon: '📈', action: () => window.location.href = '/dashboard' },
    { id: 'admin', label: 'Admin Panel', icon: '⚙️', action: () => window.location.href = '/admin' },
    { id: 'theme', label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`, icon: theme === 'light' ? '🌙' : '☀️', action: toggleTheme },
    { id: 'help', label: 'Help & Support', icon: '❓', action: () => showNotification('Help center coming soon!', 'info') },
  ]

  const handleAction = (action) => {
    action()
    setOpen(false)
    clearSearch()
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-600 dark:text-gray-300"
      >
        <Search size={16} />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">⌘K</kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-1/2 top-[20%] w-full max-w-xl -translate-x-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => performSearch(e.target.value)}
                  placeholder="Search reports, uploads, or actions..."
                  className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto p-2">
                {/* Quick Actions */}
                {!searchQuery && (
                  <div className="mb-4">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Quick Actions</p>
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAction(action.action)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                      >
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-gray-900 dark:text-white">{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Search Results */}
                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div>
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Results</p>
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                      >
                        <span className="text-lg">
                          {result.type === 'report' ? '📊' : result.type === 'upload' ? '📤' : '👤'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.date}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <Search size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">ESC</kbd> to close</span>
                  <span className="flex items-center gap-1">
                    <HelpCircle size={12} />
                    Type to search or select a quick action
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
