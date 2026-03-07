import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, RefreshCw, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const STATUS_STYLES = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
}

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const { token } = useAuth()
  const { showNotification } = useNotification()

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/reports?limit=50', {
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
      const response = await fetch(`/api/v1/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Could not get download link')
      }
      const data = await response.json()
      window.open(data.signed_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen={false} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">Analysis reports generated from your uploaded files</p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchReports}>
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button
                onClick={fetchReports}
                className="text-xs text-red-600 underline mt-1"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!error && reports.length === 0 && (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No reports yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Upload a file and generate a report to see it here.
            </p>
            <a href="/upload">
              <Button>Upload File</Button>
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const statusStyle = STATUS_STYLES[report.status] || 'bg-gray-100 text-gray-800'
            return (
              <div key={report.id} className="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <FileText size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle}`}>
                    {report.status}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Report ID</span>
                    <p className="text-sm font-mono text-gray-800 break-all">{report.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Requested by</span>
                    <p className="text-sm text-gray-700">{report.requested_by}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">File ID</span>
                    <p className="text-xs font-mono text-gray-500 break-all">{report.file_id}</p>
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
                  <div className="mt-2 w-full rounded-lg bg-gray-100 py-2 text-center text-sm text-gray-500">
                    {report.status === 'PENDING' || report.status === 'PROCESSING'
                      ? 'Processing…'
                      : 'Report unavailable'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
