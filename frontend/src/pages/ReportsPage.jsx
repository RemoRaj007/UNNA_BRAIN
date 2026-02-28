import Card from '../components/common/Card'
import Button from '../components/common/Button'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Manage your generated reports</p>
        </div>
        <Button>Generate Report</Button>
      </div>

      <Card className="p-8 text-center">
        <p className="text-gray-500">No reports yet. Generate your first report to get started.</p>
      </Card>
    </div>
  )
}
