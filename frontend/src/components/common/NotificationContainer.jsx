import { useNotification } from '../../context/NotificationContext'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'

const typeConfig = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-600'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info,
    iconColor: 'text-blue-600'
  }
}

export default function NotificationContainer() {
  const { notifications, hideNotification } = useNotification()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map(notification => {
        const config = typeConfig[notification.type] || typeConfig.info
        const Icon = config.icon

        return (
          <div
            key={notification.id}
            className={clsx(
              'flex items-center gap-3 p-4 rounded-lg border animate-slide-down',
              config.bg,
              config.border,
              config.text
            )}
          >
            <Icon size={20} className={config.iconColor} />
            <span className="flex-1 text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => hideNotification(notification.id)}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
