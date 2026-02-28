import { createContext, useState, useContext, useCallback } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now()
    const notification = { id, message, type }

    setNotifications(prev => [...prev, notification])

    if (duration > 0) {
      setTimeout(() => {
        hideNotification(id)
      }, duration)
    }

    return id
  }, [])

  const hideNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const value = {
    notifications,
    showNotification,
    hideNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
