import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const SIDEBAR_KEY = 'data-extractor-sidebar'
const SMALL_SCREEN_BREAKPOINT = 768

const SidebarContext = createContext({
  collapsed: false,
  toggleSidebar: () => {},
  setCollapsed: () => {},
  mobileOpen: false,
  toggleMobileOpen: () => {},
  setMobileOpen: () => {},
  isMobile: false,
})

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved !== null) return saved === 'true'
    } catch { /* ignore */ }
    return window.innerWidth < SMALL_SCREEN_BREAKPOINT
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < SMALL_SCREEN_BREAKPOINT)

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)) }
    catch { /* localStorage may not be available */ }
  }, [collapsed])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < SMALL_SCREEN_BREAKPOINT
      setIsMobile(mobile)
      if (mobile) { setCollapsed(true); setMobileOpen(false) }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const toggleMobileOpen = useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, setCollapsed, mobileOpen, toggleMobileOpen, setMobileOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
export default SidebarContext
