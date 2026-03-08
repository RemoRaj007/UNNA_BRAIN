import { useState, useEffect } from 'react'
import { Activity, Files, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import StatsCard from '../components/dashboard/StatsCard'
import ChartSection from '../components/dashboard/ChartSection'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../utils/apiUrl'

const DEMO_STATS = {
  total_uploads: 156,
  total_reports: 42,
  completed_reports: 38,
  failed_reports: 2
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const { token } = useAuth()

  const fetchStats = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/dashboard/summary'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        setStats(DEMO_STATS)
        setUsingMockData(true)
        return
      }

      const data = await response.json()
      setStats(data)
      setUsingMockData(false)
    } catch {
      setStats(DEMO_STATS)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [token]) // re-fetch when token changes

  if (loading) {
    return <LoadingSpinner fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome back! Here's your overview.</p>
          {usingMockData && (
            <p className="mt-2 text-sm text-amber-600">
              Showing demo data because backend stats are unavailable.
            </p>
          )}
        </div>
        <Button onClick={fetchStats} variant="secondary" size="sm">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Uploads"
          value={stats?.total_uploads || 0}
          icon={TrendingUp}
          color="blue"
          trend={{ percent: 12, positive: true }}
        />
        <StatsCard
          label="Total Reports"
          value={stats?.total_reports || 0}
          icon={Files}
          color="green"
          trend={{ percent: 8, positive: true }}
        />
        <StatsCard
          label="Completed"
          value={stats?.completed_reports || 0}
          icon={Activity}
          color="purple"
          trend={{ percent: 5, positive: true }}
        />
        <StatsCard
          label="Failed"
          value={stats?.failed_reports || 0}
          icon={AlertCircle}
          color="red"
          trend={{ percent: 2, positive: false }}
        />
      </div>

      <ChartSection />

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/upload">
            <Button>Upload File</Button>
          </a>
          <a href="/reports">
            <Button variant="secondary">View Reports</Button>
          </a>
        </div>
      </Card>
    </div>
  )
}
