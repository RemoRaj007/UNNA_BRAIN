import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function AdvancedChart({ data, type = 'line', title }) {
  const chartData = data || [
    { name: 'Jan', value: 400, uv: 240 },
    { name: 'Feb', value: 300, uv: 139 },
    { name: 'Mar', value: 550, uv: 980 },
    { name: 'Apr', value: 450, uv: 390 },
    { name: 'May', value: 650, uv: 480 },
    { name: 'Jun', value: 700, uv: 380 },
  ]

  const maxValue = Math.max(...chartData.map(d => Math.max(d.value, d.uv || 0)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      
      {/* Chart Area */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
          {[100, 75, 50, 25, 0].map((pct) => (
            <span key={pct}>{Math.round(maxValue * pct / 100)}</span>
          ))}
        </div>

        {/* Chart bars/lines */}
        <div className="ml-14 h-full flex items-end gap-2 pb-8">
          {chartData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '100%' }}
              transition={{ delay: index * 0.1 }}
              className="flex-1 flex flex-col justify-end gap-1"
            >
              {/* Main value bar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md relative group cursor-pointer"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              >
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.name}: {item.value}
                </div>
              </motion.div>
              
              {/* Secondary value bar (if exists) */}
              {item.uv && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-md relative group cursor-pointer"
                  style={{ height: `${(item.uv / maxValue) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    UV: {item.uv}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="ml-14 flex justify-between text-xs text-gray-500 pt-2">
          {chartData.map((item) => (
            <span key={item.name}>{item.name}</span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Main Value</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Secondary</span>
        </div>
      </div>
    </motion.div>
  )
}

export function StatTrend({ value, trend }) {
  const isPositive = trend > 0
  const isNeutral = trend === 0
  
  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${
      isPositive ? 'text-green-600' : isNeutral ? 'text-gray-600' : 'text-red-600'
    }`}>
      {isPositive ? <TrendingUp size={14} /> : isNeutral ? <Minus size={14} /> : <TrendingDown size={14} />}
      <span>{Math.abs(trend)}%</span>
    </div>
  )
}
