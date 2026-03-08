import { useState, useEffect } from 'react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Settings, Users, Activity, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../utils/apiUrl'

export default function AdminPage() {
  const [systemStatus, setSystemStatus] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [statusRes, usersRes] = await Promise.all([
        fetch(apiUrl('/api/v1/admin/status'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/v1/admin/users'), { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (statusRes.ok) {
        setSystemStatus(await statusRes.json())
      }
      if (usersRes.ok) {
        const userData = await usersRes.json()
        setUsers(userData.items || [])
      }
    } catch {
      // Silently handle; cards show fallback state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [token])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">System administration and management</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchAdminData} loading={loading}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* System Status */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-900">System Status</h3>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : systemStatus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-medium text-green-700">API Online</span>
              </div>
              <p className="text-xs text-gray-500">Logged in as: {systemStatus.user}</p>
              <p className="text-xs text-gray-500">Status: {systemStatus.status}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm text-red-600">API unreachable</span>
            </div>
          )}
        </Card>

        {/* User Management */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-green-600" size={24} />
            <h3 className="font-semibold text-gray-900">User Management</h3>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">
                {users.length === 1 ? 'active user' : 'active users'}
              </p>
              {users.slice(0, 3).map((u, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex justify-between">
                  <span>{u.email}</span>
                  <span className="text-gray-400">{u.roles?.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Audit Log */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-purple-600" size={24} />
            <h3 className="font-semibold text-gray-900">Audit Log</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">System activity is recorded automatically for all uploads, report generations, and downloads.</p>
          <p className="text-xs text-gray-400">Audit logs are stored in the database and linked to each action.</p>
        </Card>
      </div>
    </div>
  )
}
