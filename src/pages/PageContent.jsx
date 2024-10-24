import React from 'react'
import AppRoutes from '../utils/app.routes'

const PageContent = () => {
  return (
    <div
    style={{
      height: "100vh-80px",
      width: "100%",
      overflowY: "auto",
      padding: "20px",
    }}
    className='bg-slate-200'
  >
    {AppRoutes}
  </div>
  )
}

export default PageContent
