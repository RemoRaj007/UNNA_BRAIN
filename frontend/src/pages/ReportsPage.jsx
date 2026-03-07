import { useState } from 'react'

export default function ReportsPage() {
  const [reports] = useState([
    {
      id: 1,
      title: 'Financial Report Analysis',
      date: '2024-03-01',
      accuracy: 96,
      entities: 234,
      insights: 'Strong financial stability'
    },
    {
      id: 2,
      title: 'Market Trends Report',
      date: '2024-02-28',
      accuracy: 92,
      entities: 189,
      insights: 'Growing market opportunities'
    },
    {
      id: 3,
      title: 'Customer Sentiment Analysis',
      date: '2024-02-27',
      accuracy: 89,
      entities: 156,
      insights: 'Positive customer feedback trend'
    }
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">View detailed analysis reports of your documents</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
              <h3 className="mb-3 text-lg font-bold text-gray-900">{report.title}</h3>

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Accuracy</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full bg-green-500" style={{ width: `${report.accuracy}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-green-600">{report.accuracy}%</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Entities Found</span>
                  <span className="text-sm font-semibold text-blue-600">{report.entities}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-500">Key Insight</span>
                  <p className="mt-1 text-sm text-gray-700">{report.insights}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500">
                  Generated: {new Date(report.date).toLocaleDateString()}
                </p>
              </div>

              <button className="mt-4 w-full rounded-lg bg-blue-500 py-2 font-semibold text-white transition hover:bg-blue-600">
                View Full Report
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
