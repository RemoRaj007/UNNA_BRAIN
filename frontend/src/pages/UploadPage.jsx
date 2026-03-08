import { useState } from 'react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Upload, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { apiUrl } from '../utils/apiUrl'

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadResults, setUploadResults] = useState([])
  const { token } = useAuth()
  const { showNotification } = useNotification()

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...droppedFiles])
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setLoading(true)
    setUploadResults([])

    const results = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch(apiUrl('/api/v1/upload'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (response.status === 413) {
          results.push({ name: file.name, success: false, error: 'File too large (max 20 MB)' })
          continue
        }

        if (response.status === 400) {
          const data = await response.json()
          results.push({ name: file.name, success: false, error: data.detail || 'Validation failed — check required columns' })
          continue
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          results.push({ name: file.name, success: false, error: data.detail || `Upload failed (${response.status})` })
          continue
        }

        const data = await response.json()
        results.push({ name: file.name, success: true, fileId: data.file_id })
      } catch {
        results.push({ name: file.name, success: false, error: 'Network error — please try again' })
      }
    }

    setUploadResults(results)
    setLoading(false)

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    if (succeeded > 0 && failed === 0) {
      showNotification(`${succeeded} file${succeeded > 1 ? 's' : ''} uploaded successfully`, 'success')
      setFiles([])
    } else if (succeeded > 0) {
      showNotification(`${succeeded} uploaded, ${failed} failed`, 'warning')
    } else {
      showNotification('All uploads failed — check file format (CSV/XLSX with required columns)', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Files</h1>
        <p className="text-gray-600 mt-1">Upload social media CSV or Excel files for analysis</p>
        <p className="text-sm text-gray-500 mt-1">
          Required columns: Date, Post text, Link, Impressions, Reactions, Comments, Shares
        </p>
      </div>

      <Card className="p-8">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-600 transition-colors cursor-pointer"
        >
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drag and drop files here
          </h3>
          <p className="text-gray-600 mb-4">or</p>
          <label>
            <input
              type="file"
              multiple
              accept=".csv,.xls,.xlsx"
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="hidden"
            />
            <Button as="span">Select Files</Button>
          </label>
          <p className="text-sm text-gray-500 mt-4">Maximum file size: 20 MB · Formats: CSV, XLS, XLSX</p>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Files to upload:</h4>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ))}
            </div>
            <Button
              onClick={handleUpload}
              loading={loading}
              className="w-full mt-4"
            >
              Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
            </Button>
          </div>
        )}

        {uploadResults.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-gray-900 mb-3">Upload Results:</h4>
            {uploadResults.map((result, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success
                  ? <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                  : <XCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                }
                <div>
                  <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.name}
                  </p>
                  {result.success
                    ? <p className="text-xs text-green-600">File ID: {result.fileId}</p>
                    : <p className="text-xs text-red-600">{result.error}</p>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
