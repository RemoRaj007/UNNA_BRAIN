import { useState, useEffect } from 'react'
import { Activity, Files, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import StatsCard from '../components/dashboard/StatsCard'
import ChartSection from '../components/dashboard/ChartSection'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <LoadingSpinner fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
        </div>
        <Button onClick={fetchStats} variant="secondary" size="sm">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Charts */}
      <ChartSection />

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
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
