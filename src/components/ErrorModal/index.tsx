import React from 'react'
import './index.scss'

interface ErrorPageProps {
  title: string
  message: string
  onRetry?: () => void
}

const ErrorPage: React.FC<ErrorPageProps> = ({ title, message, onRetry }) => {
  return (
    <div className="error-page">
      <div className="error-page-content">
        <div className="error-page-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="#FF3B30" strokeWidth="2" fill="none"/>
            <path d="M22 22L42 42M42 22L22 42" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="error-page-title">{title}</div>
        <div className="error-page-message">{message}</div>
        {onRetry && (
          <button className="error-page-button" onClick={onRetry}>
            重试
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorPage
