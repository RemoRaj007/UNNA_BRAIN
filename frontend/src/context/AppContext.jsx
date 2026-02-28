import { createContext, useState, useContext } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, type: null, data: null })

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const openModal = (type, data = null) => {
    setModal({ open: true, type, data })
  }

  const closeModal = () => {
    setModal({ open: false, type: null, data: null })
  }

  const value = {
    sidebarOpen,
    toggleSidebar,
    loading,
    setLoading,
    modal,
    openModal,
    closeModal
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
