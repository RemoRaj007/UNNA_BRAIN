import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { Menu, LogOut, User } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { toggleSidebar } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User size={20} className="text-gray-600" />
              <div className="text-left text-sm">
                <div className="font-medium text-gray-900">{user?.email || 'User'}</div>
                <div className="text-xs text-gray-500">
                  {user?.roles?.[0] || 'Guest'}
                </div>
              </div>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                >
                  Profile
                </a>
                <button
                  onClick={() => {
                    logout()
                    setProfileOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-gray-100 last:rounded-b-lg flex items-center gap-2"
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
