import React, { useState, useEffect, useRef } from 'react'
import { FaSpinner } from 'react-icons/fa'

/**
 * Animated progress bar displayed during long-running operations.
 * Shows a gradient animation bar + a descriptive message + spinner icon + elapsed time.
 * Uses fixed positioning at the top of the viewport.
 */
const ProgressBar = ({ visible, message = 'Processing...' }) => {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (visible) {
      startRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
      }, 1000)
    } else {
      setElapsed(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [visible])

  const formatElapsed = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down">
      {/* Animated gradient bar */}
      <div className="h-1 w-full overflow-hidden bg-blue-100">
        <div className="h-full w-full origin-left animate-progress-bar bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
      </div>
      {/* Message bar */}
      <div className="flex items-center justify-center gap-2.5 bg-blue-50 px-4 py-2 shadow-sm border-b border-blue-200">
        <FaSpinner className="animate-spin text-sm text-blue-600" />
        <span className="text-sm font-medium text-blue-800">{message}</span>
        <span className="text-xs text-blue-400 font-mono ml-1 min-w-[40px] text-right">
          {formatElapsed(elapsed)}
        </span>
      </div>
    </div>
  )
}

export default ProgressBar
