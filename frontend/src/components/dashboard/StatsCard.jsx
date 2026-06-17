import Card from '../common/Card'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ label, value, icon: Icon, trend = null, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm',
    green: 'text-green-600 bg-gradient-to-br from-green-50 to-green-100 shadow-sm',
    purple: 'text-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm',
    red: 'text-red-600 bg-gradient-to-br from-red-50 to-red-100 shadow-sm',
  }

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl font-bold text-gray-900"
              >
                {value}
              </motion.p>
              {trend && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={clsx(
                    'text-sm font-semibold flex items-center gap-1',
                    trend.positive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(trend.percent)}%
                </motion.span>
              )}
            </div>
          </div>
          {Icon && (
            <motion.div 
              className={clsx(
                'p-3 rounded-xl',
                colorClasses[color]
              )}
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon size={24} />
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
