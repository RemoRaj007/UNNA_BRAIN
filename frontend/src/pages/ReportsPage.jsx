import { useState } from 'react'

export default function ReportsPage() {
    const [reports] = useState([
      { id: 1, title: 'Financial Report Analysis', date: '2024-03-01', accuracy: 96, entities: 234, insights: 'Strong financial stability' },
      { id: 2, title: 'Market Trends Report', date: '2024-02-28', accuracy: 92, entities: 189, insights: 'Growing market opportunities' },
      { id: 3, title: 'Customer Sentiment Analysis', date: '2024-02-27', accuracy: 89, entities: 156, insights: 'Positive customer feedback trend' }
        ])

  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                      <div className="mb-8">
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports</h1>h1>
                                <p className="text-gray-600">View detailed analysis reports of your documents</p>p>
                      </div>div>
              
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map((report) => (
                      <div key={report.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">{report.title}</h3>h3>
                                    
                                    <div className="space-y-3 mb-4">
                                                    <div className="flex justify-between items-center">
                                                                      <span className="text-sm text-gray-600">Accuracy</span>span>
                                                                      <div className="flex items-center gap-2">
                                                                                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                                                                <div className="h-full bg-green-500" style={{width: `${report.accuracy}%`}}></div>div>
                                                                                            </div>div>
                                                                                          <span className="text-sm font-semibold text-green-600">{report.accuracy}%</span>span>
                                                                      </div>div>
                                                    </div>div>
                                                    
                                                    <div className="flex justify-between">
                                                                      <span className="text-sm text-gray-600">Entities Found</span>span>
                                                                      <span className="text-sm font-semibold text-blue-600">{report.entities}</span>span>
                                                    </div>div>
                                                    
                                                    <div>
                                                                      <span className="text-xs text-gray-500">Key Insight</span>span>
                                                                      <p className="text-sm text-gray-700 mt-1">{report.insights}</p>p>
                                                    </div>div>
                                    </div>div>
                      
                                    <div className="pt-4 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500">Generated: {new Date(report.date).toLocaleDateString()}</p>p>
                                    </div>div>
                      
                                    <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition">
                                                    View Full Report
                                    </button>button>
                      </div>div>
                    ))}
                      </div>div>
              </div>div>
        </div>div>
      )
}</div>
