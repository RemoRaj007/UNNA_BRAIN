import clsx from 'clsx'
import { motion } from 'framer-motion'

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-600 shadow-md shadow-blue-500/20',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 shadow-md',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-gray-400 shadow-sm',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger shadow-md shadow-red-500/20',
    success: 'bg-success text-white hover:bg-green-700 focus:ring-success shadow-md shadow-green-500/20'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-2',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
    xl: 'px-8 py-4 text-lg gap-3'
  }
  
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </motion.button>
  )
}
