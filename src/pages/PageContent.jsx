import React from 'react'
import { useLocation } from 'react-router-dom'
import AppRoutes from '../utils/app.routes'

const PageContent = () => {
  const location = useLocation()

  return (
    <div
      className='my-scrollable bg-slate-200'
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px',
      }}
    >
      <div key={location.pathname} className="animate-fade-in">
        {AppRoutes}
      </div>
    </div>
  )
}

export default PageContent
