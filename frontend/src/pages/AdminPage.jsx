import Card from '../components/common/Card'
import { Settings, Users, Activity } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">System administration and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-900">System Status</h3>
          </div>
          <p className="text-sm text-gray-600">Monitor API and database health</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-green-600" size={24} />
            <h3 className="font-semibold text-gray-900">User Management</h3>
          </div>
          <p className="text-sm text-gray-600">Manage users and permissions</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-purple-600" size={24} />
            <h3 className="font-semibold text-gray-900">Audit Log</h3>
          </div>
          <p className="text-sm text-gray-600">View system activity history</p>
        </Card>
      </div>
    </div>
  )
}
