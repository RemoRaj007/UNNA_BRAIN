import { createContext, useState, useContext } from 'react'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    // Add to recent searches if not already present
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== query)
      return [query, ...filtered].slice(0, 5)
    })

    // Simulate search - in real app, this would call API
    setTimeout(() => {
      setSearchResults([
        { id: 1, type: 'report', title: `Report matching "${query}"`, date: '2024-01-15' },
        { id: 2, type: 'upload', title: `Upload containing "${query}"`, date: '2024-01-14' },
        { id: 3, type: 'user', title: `User activity for "${query}"`, date: '2024-01-13' },
      ])
      setIsSearching(false)
    }, 500)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const removeRecentSearch = (search) => {
    setRecentSearches(prev => prev.filter(s => s !== search))
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
  }

  const value = {
    searchQuery,
    searchResults,
    isSearching,
    recentSearches,
    performSearch,
    clearSearch,
    removeRecentSearch,
    clearRecentSearches
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider')
  }
  return context
}
