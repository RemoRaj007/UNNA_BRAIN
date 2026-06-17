import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { Menu, LogOut, User, Moon, Sun, Bell } from 'lucide-react'
import { useState } from 'react'
import CommandPalette from '../common/CommandPalette'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { toggleSidebar } = useApp()
  const { theme, toggleTheme, isDark } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const notifications = [
    { id: 1, title: 'Report Generated', message: 'Q4 Analysis report is ready', time: '5m ago', unread: true },
    { id: 2, title: 'Upload Complete', message: 'social_media_jan.csv processed successfully', time: '1h ago', unread: true },
    { id: 3, title: 'System Update', message: 'New features available', time: '2h ago', unread: false },
  ]

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Command Palette Trigger */}
          <CommandPalette />
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <button className="text-xs text-blue-600 hover:text-blue-700">Mark all as read</button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        notif.unread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full ${notif.unread ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <User size={20} className="text-gray-600 dark:text-gray-300" />
              <div className="text-left text-sm hidden md:block">
                <div className="font-medium text-gray-900 dark:text-white">{user?.email || 'User'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles?.[0] || 'Guest'}
                </div>
              </div>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <a
                  href="/profile"
                  className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-xl"
                >
                  Profile
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Settings
                </a>
                <button
                  onClick={() => {
                    logout()
                    setProfileOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 last:rounded-b-xl flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
