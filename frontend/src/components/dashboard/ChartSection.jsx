import Card from '../common/Card'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#0B63CE', '#F57C00', '#067647', '#B42318']

export default function ChartSection() {
  const timeSeriesData = [
    { date: 'Jan', uploads: 4, reports: 2 },
    { date: 'Feb', uploads: 8, reports: 5 },
    { date: 'Mar', uploads: 12, reports: 8 },
    { date: 'Apr', uploads: 18, reports: 12 },
    { date: 'May', uploads: 25, reports: 18 },
    { date: 'Jun', uploads: 32, reports: 28 },
  ]

  const statusData = [
    { name: 'Completed', value: 38 },
    { name: 'Processing', value: 4 },
    { name: 'Failed', value: 2 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="uploads" stroke="#0B63CE" />
            <Line type="monotone" dataKey="reports" stroke="#F57C00" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Pie Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
