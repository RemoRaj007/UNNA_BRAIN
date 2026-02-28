import Card from '../common/Card'
import clsx from 'clsx'

export default function StatsCard({ label, value, icon: Icon, trend = null, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={clsx(
                'text-sm font-semibold',
                trend.positive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.percent)}%
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={clsx(
            'p-3 rounded-lg',
            colorClasses[color]
          )}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </Card>
  )
}
