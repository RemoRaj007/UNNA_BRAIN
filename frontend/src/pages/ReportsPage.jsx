import { motion } from 'framer-motion'
import { FileText, Download, RefreshCw, AlertCircle, Plus, Filter, Calendar } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { apiUrl } from '../utils/apiUrl'

const STATUS_STYLES = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const { token } = useAuth()
  const { showNotification } = useNotification()

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(apiUrl('/api/v1/reports?limit=50'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error(`Failed to load reports (${response.status})`)
      }
      const data = await response.json()
      setReports(data.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleDownload = async (reportId) => {
    setDownloadingId(reportId)
    try {
      const response = await fetch(apiUrl(`/api/v1/reports/${reportId}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Could not get download link')
      }
      const data = await response.json()
      window.open(data.signed_url, '_blank', 'noopener,noreferrer')
      showNotification('Download started!', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => filter === 'all' || report.status === filter)
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return 0
    })

  if (loading) {
    return <LoadingSpinner fullScreen={false} />
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">Analysis reports generated from your uploaded files</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={fetchReports}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
            <Button>
              <Plus size={16} /> New Report
            </Button>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
          >
            <AlertCircle className="text-red-600 dark:text-red-400 shrink-0" size={20} />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={fetchReports}
                className="text-xs text-red-600 dark:text-red-400 underline mt-1"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Filters and View Toggle */}
        {!error && reports.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center gap-3"
          >
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="2" width="5" height="5" rx="1" />
                  <rect x="9" y="2" width="5" height="5" rx="1" />
                  <rect x="2" y="9" width="5" height="5" rx="1" />
                  <rect x="9" y="9" width="5" height="5" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="3" width="12" height="2" rx="1" />
                  <rect x="2" y="7" width="12" height="2" rx="1" />
                  <rect x="2" y="11" width="12" height="2" rx="1" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!error && reports.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No reports yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Upload a file and generate a report to see it here.
            </p>
            <a href="/upload">
              <Button>Upload File</Button>
            </a>
          </motion.div>
        )}

        {/* Reports Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {filteredReports.map((report, index) => {
            const statusStyle = STATUS_STYLES[report.status] || 'bg-gray-100 text-gray-800'
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`${viewMode === 'grid' ? 'rounded-lg bg-white dark:bg-gray-900 p-6 shadow-md hover:shadow-xl card-hover' : 'rounded-lg bg-white dark:bg-gray-900 p-4 shadow-md flex items-center gap-4'}`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <FileText size={20} className="text-blue-500 shrink-0 mt-0.5" />
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle}`}>
                        {report.status}
                      </span>
                    </div>

                    <div className="mb-4 space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Report ID</span>
                        <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{report.id}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Requested by</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{report.requested_by}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">File ID</span>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-500 break-all">{report.file_id}</p>
                      </div>
                    </div>

                    {report.status === 'COMPLETED' ? (
                      <button
                        onClick={() => handleDownload(report.id)}
                        disabled={downloadingId === report.id}
                        className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500 py-2 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Download size={16} />
                        {downloadingId === report.id ? 'Getting link…' : 'Download Report'}
                      </button>
                    ) : (
                      <div className="mt-2 w-full rounded-lg bg-gray-100 dark:bg-gray-800 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                        {report.status === 'PENDING' || report.status === 'PROCESSING'
                          ? 'Processing…'
                          : 'Report unavailable'}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <FileText size={20} className="text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">{report.id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{report.requested_by}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle}`}>
                      {report.status}
                    </span>
                    {report.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleDownload(report.id)}
                        disabled={downloadingId === report.id}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Download size={18} />
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
