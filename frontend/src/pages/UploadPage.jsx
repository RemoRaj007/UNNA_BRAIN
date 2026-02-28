import { useState } from 'react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Upload } from 'lucide-react'

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...droppedFiles])
  }

  const handleUpload = async () => {
    setLoading(true)
    try {
      // TODO: Implement file upload
      console.log('Uploading files:', files)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Files</h1>
        <p className="text-gray-600 mt-1">Upload documents for analysis</p>
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
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="hidden"
            />
            <Button as="span">Select Files</Button>
          </label>
          <p className="text-sm text-gray-500 mt-4">Maximum file size: 20 MB</p>
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
      </Card>
    </div>
  )
}
