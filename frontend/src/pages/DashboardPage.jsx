import { useState, useEffect } from 'react'
import { Activity, Files, TrendingUp, AlertCircle } from 'lucide-react'
import Card from '../components/common/Card'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useNotification } from '../context/NotificationContext'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showNotification } = useNotification()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/dashboard/summary')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Mock data for demo
        setStats({
          total_uploads: 156,
          total_reports: 42,
          completed_reports: 38,
          failed_reports: 2
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <LoadingSpinner fullScreen={false} />
  }

  const metrics = [
    { label: 'Total Uploads', value: stats?.total_uploads || 0, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Total Reports', value: stats?.total_reports || 0, icon: Files, color: 'text-green-600' },
    { label: 'Completed', value: stats?.completed_reports || 0, icon: Activity, color: 'text-purple-600' },
    { label: 'Failed', value: stats?.failed_reports || 0, icon: AlertCircle, color: 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <Card key={idx} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                </div>
                <Icon className={`${metric.color} opacity-20`} size={40} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a
            href="/upload"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Upload File
          </a>
          <a
            href="/reports"
            className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          >
            View Reports
          </a>
        </div>
      </Card>
    </div>
  )
}
