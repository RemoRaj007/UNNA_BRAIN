import { useState, useEffect } from 'react'
import { Activity, Files, TrendingUp, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'
import StatsCard from '../components/dashboard/StatsCard'
import ChartSection from '../components/dashboard/ChartSection'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../utils/apiUrl'
import { motion } from 'framer-motion'

const DEMO_STATS = {
  total_uploads: 156,
  total_reports: 42,
  completed_reports: 38,
  failed_reports: 2
}

const RECENT_ACTIVITY = [
  { id: 1, action: 'File uploaded', file: 'social_media_jan.csv', time: '2 min ago', status: 'success' },
  { id: 2, action: 'Report generated', file: 'analysis_report_q1.pdf', time: '15 min ago', status: 'success' },
  { id: 3, action: 'File processing', file: 'instagram_metrics.xlsx', time: '1 hour ago', status: 'processing' },
  { id: 4, action: 'Upload failed', file: 'corrupted_file.csv', time: '2 hours ago', status: 'error' },
  { id: 5, action: 'Report downloaded', file: 'summary_march.pdf', time: '3 hours ago', status: 'success' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const [activity, setActivity] = useState(RECENT_ACTIVITY)
  const [refreshing, setRefreshing] = useState(false)
  const { token } = useAuth()

  const fetchStats = async () => {
    setRefreshing(true)
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
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [token])

  if (loading) {
    return <LoadingSpinner fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold"
            >
              Welcome back! 👋
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-white/90"
            >
              Here's what's happening with your data today.
            </motion.p>
            {usingMockData && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm backdrop-blur-sm"
              >
                <Zap size={14} />
                Showing demo data
              </motion.div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchStats}
            disabled={refreshing}
            className="relative flex items-center gap-2 rounded-xl bg-white/20 px-4 py-3 font-semibold backdrop-blur-sm transition-all hover:bg-white/30 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
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
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ChartSection />
        </div>

        {/* Recent Activity Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Last 24h</span>
            </div>
            
            <div className="space-y-4">
              {activity.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                    item.status === 'success' ? 'bg-green-50 hover:bg-green-100' :
                    item.status === 'error' ? 'bg-red-50 hover:bg-red-100' :
                    'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className={`mt-1 p-1.5 rounded-lg ${
                    item.status === 'success' ? 'bg-green-200 text-green-700' :
                    item.status === 'error' ? 'bg-red-200 text-red-700' :
                    'bg-blue-200 text-blue-700'
                  }`}>
                    {item.status === 'success' ? <ArrowUpRight size={14} /> :
                     item.status === 'error' ? <AlertCircle size={14} /> :
                     <RefreshCw size={14} className="animate-spin" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.action}</p>
                    <p className="text-xs text-gray-600 truncate">{item.file}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="w-full mt-6 py-2.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all">
              View All Activity →
            </button>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <motion.a 
              href="/upload"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="shadow-lg shadow-blue-500/30">
                <Upload size={18} className="mr-2" />
                Upload File
              </Button>
            </motion.a>
            <motion.a 
              href="/reports"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="secondary" className="shadow-lg shadow-purple-500/30">
                <FileText size={18} className="mr-2" />
                View Reports
              </Button>
            </motion.a>
            <motion.a 
              href="/dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" className="shadow-lg shadow-green-500/30">
                <BarChart3 size={18} className="mr-2" />
                Analytics
              </Button>
            </motion.a>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
