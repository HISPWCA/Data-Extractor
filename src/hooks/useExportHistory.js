import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const HISTORY_KEY = 'data-extractor-export-history'
const MAX_HISTORY = 50

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveHistory = (entries) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch { /* localStorage full or unavailable */ }
}

const useExportHistory = () => {
  const [history, setHistory] = useState(loadHistory)

  const addEntry = useCallback(({ format, mappingName, programName, rowCount, dateRange }) => {
    const entry = {
      id: uuidv4(),
      format,
      mappingName: mappingName || 'Unknown',
      programName: programName || 'Unknown',
      rowCount: rowCount || 0,
      dateRange: dateRange || '',
      timestamp: new Date().toISOString(),
    }
    const updated = [entry, ...history].slice(0, MAX_HISTORY)
    setHistory(updated)
    saveHistory(updated)
    return entry
  }, [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  const removeEntry = useCallback((id) => {
    const updated = history.filter((e) => e.id !== id)
    setHistory(updated)
    saveHistory(updated)
  }, [history])

  return { history, addEntry, clearHistory, removeEntry }
}

export default useExportHistory
