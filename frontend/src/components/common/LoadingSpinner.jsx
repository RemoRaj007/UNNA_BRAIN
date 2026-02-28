export default function LoadingSpinner({ fullScreen = true }) {
  const spinnerContent = (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}
