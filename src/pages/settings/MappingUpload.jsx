import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import {
  FaDownload, FaTrashAlt, FaUndo, FaCheck, FaFileImport,
  FaTable, FaPlus, FaMinus, FaSave, FaFileExport,
  FaList, FaFileDownload, FaArrowUp, FaArrowDown, FaExclamationTriangle,
  FaSearch, FaChevronLeft as FaChevLeft, FaChevronRight as FaChevRight,
  FaAngleDoubleLeft, FaAngleDoubleRight, FaArrowsAlt, FaCopy,
} from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'
import ProgressBar from '../../components/ProgressBar'
import * as XLSX from 'xlsx'
import { useConfig } from '@dhis2/app-runtime'
import {
  Button, ButtonStrip, InputField,
  Modal, ModalActions, ModalContent, ModalTitle,
  SingleSelect, SingleSelectOption,
  Tooltip,
} from '@dhis2/ui'
import useLoadMappings from '../../hooks/useLoadMappings'
import useLoadPrograms from '../../hooks/useLoadPrograms'
import useLoadMe from '../../hooks/useLoadMe'
import useMappingsMutation from '../../hooks/useMappingsMutation'
import useShowAlerts from '../../hooks/useShowAlerts'
import Method from '../../utils/app.methods'
import {
  exportMappingToExcel, MAPPING_COLUMNS, OPTIONS_COLUMNS, parseSheetRows,
} from '../../utils/mappingExcel'

const EMPTY_MAPPING_ROW = Object.fromEntries(MAPPING_COLUMNS.map((c) => [c, '']))
const EMPTY_OPTIONS_ROW = Object.fromEntries(OPTIONS_COLUMNS.map((c) => [c, '']))
const ITEMS_PER_PAGE = 10

const reorderArray = (arr, from, to) => {
  const cp = [...arr]
  const [removed] = cp.splice(from, 1)
  cp.splice(to, 0, removed)
  return cp
}

// ── Editable Excel-like table with Drag & Drop (memoized) ──
const EditableTable = React.memo(({ columns, rows, onUpdate, onRemove, onAdd, onMoveUp, onMoveDown, onReorder, addLabel }) => {
  const [dragRowIdx, setDragRowIdx] = useState(null)
  const [dropRowIdx, setDropRowIdx] = useState(null)
  const dragRowTimer = useRef(null)

  const handleRowDragStart = useCallback((idx) => { setDragRowIdx(idx); setDropRowIdx(null) }, [])
  const handleRowDragOver = useCallback((e, idx) => {
    e.preventDefault()
    if (dragRowTimer.current) clearTimeout(dragRowTimer.current)
    dragRowTimer.current = setTimeout(() => { if (dragRowIdx !== idx) setDropRowIdx(idx) }, 20)
  }, [dragRowIdx])
  const handleRowDragLeave = useCallback((e) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
      if (dragRowTimer.current) clearTimeout(dragRowTimer.current); setDropRowIdx(null)
    }
  }, [])
  const handleRowDrop = useCallback((e, idx) => {
    e.preventDefault()
    if (dragRowTimer.current) clearTimeout(dragRowTimer.current)
    if (dragRowIdx !== null && dragRowIdx !== idx && onReorder) onReorder(dragRowIdx, idx)
    setDragRowIdx(null); setDropRowIdx(null)
  }, [dragRowIdx, onReorder])
  const handleRowDragEnd = useCallback(() => { setDragRowIdx(null); setDropRowIdx(null) }, [])

  useEffect(() => () => { if (dragRowTimer.current) clearTimeout(dragRowTimer.current) }, [])

  return (
  <div className="overflow-auto rounded border border-gray-300 shadow-sm" style={{ maxHeight: '420px', fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="sticky top-0 z-10 w-10 border-r border-gray-300 bg-[#217346] px-1.5 py-1.5 text-center text-[11px] font-semibold text-white shadow-sm">#</th>
          {columns.map((col, ci) => (
            <th key={col} className="sticky top-0 z-10 whitespace-nowrap border-r border-gray-300 bg-[#217346] px-3 py-1.5 text-left text-[11px] font-semibold tracking-wide text-white shadow-sm">
              <span className="mr-1.5 inline-block rounded bg-white/15 px-1 text-[10px] font-bold uppercase opacity-70">{String.fromCharCode(65 + ci)}</span>
              {col}
            </th>
          ))}
          <th className="sticky top-0 z-10 w-24 border-r border-gray-300 bg-[#217346] px-1 py-1.5 text-center text-white shadow-sm">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          const isDragging = dragRowIdx === idx
          const isDropTarget = dropRowIdx === idx
          return (
          <tr key={idx} draggable onDragStart={() => handleRowDragStart(idx)} onDragOver={(e) => handleRowDragOver(e, idx)} onDragLeave={handleRowDragLeave} onDrop={(e) => handleRowDrop(e, idx)} onDragEnd={handleRowDragEnd}
            className={`transition-all duration-100 cursor-grab active:cursor-grabbing ${
              idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'
            } hover:bg-[#E8F0FE] ${
              isDragging ? 'opacity-40 ring-2 ring-blue-400' : ''
            } ${isDropTarget ? 'border-t-2 border-blue-400' : ''}`}>
            <td className="border-b border-r border-gray-200 bg-gray-50 px-1.5 py-0 text-center text-[11px] font-medium text-gray-400">
              <FaArrowsAlt className="inline-block mr-1 text-[9px] text-gray-300" />
              {idx + 1}
            </td>
            {columns.map((col) => (
              <td key={col} className="border-b border-r border-gray-200 p-0">
                <input value={row[col] ?? ''} onChange={(e) => onUpdate(idx, col, e.target.value)}
                  className="w-full min-w-[110px] border-0 bg-transparent px-2.5 py-1.5 text-[13px] text-gray-800 outline-none transition-colors focus:bg-[#E8F0FE] focus:ring-1 focus:ring-inset focus:ring-[#217346]" spellCheck={false} />
              </td>
            ))}
            <td className="border-b border-gray-200 p-0 text-center">
              <div className="inline-flex items-center gap-0.5">
                <button onClick={() => onMoveUp(idx)} disabled={idx === 0}
                  className={`p-1 transition-colors ${idx === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-blue-500'}`} title="Move up">
                  <FaArrowUp className="text-[10px]" />
                </button>
                <button onClick={() => onMoveDown(idx)} disabled={idx === rows.length - 1}
                  className={`p-1 transition-colors ${idx === rows.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-blue-500'}`} title="Move down">
                  <FaArrowDown className="text-[10px]" />
                </button>
                <button onClick={() => onRemove(idx)} className="p-1 text-gray-300 transition-colors hover:text-red-500" title="Delete row">
                  <FaMinus className="text-[10px]" />
                </button>
              </div>
            </td>
          </tr>
        )})}
      </tbody>
    </table>
    <div className="flex items-center gap-2 border-t border-gray-300 bg-gray-50 px-3 py-1.5">
      <button onClick={onAdd} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium text-[#217346] transition-colors hover:bg-[#217346] hover:text-white">
        <FaPlus className="text-[10px]" /> {addLabel}
      </button>
      <span className="text-[11px] text-gray-400">{rows.length} {rows.length > 1 ? 'rows' : 'row'}</span>
    </div>
  </div>
)})

const TabBar = ({ tabs, activeTab, onChange }) => (
  <div className="flex items-end gap-0 border-b border-gray-300 bg-gray-100 px-2 pt-1">
    {tabs.map((tab) => (
      <button key={tab.key} onClick={() => onChange(tab.key)}
        className={`relative flex items-center gap-1.5 rounded-t-md px-4 py-1.5 text-[12px] font-medium transition-all duration-150 ${
          activeTab === tab.key
            ? 'z-10 -mb-[1px] border border-b-0 border-gray-300 bg-white text-[#217346] shadow-sm'
            : 'border border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
        }`}>
        {tab.icon && <span className="text-[11px]">{tab.icon}</span>}
        {tab.label}
        {tab.count !== undefined && (
          <span className={`ml-1 rounded-full px-1.5 text-[10px] font-semibold ${activeTab === tab.key ? 'bg-[#217346] text-white' : 'bg-gray-300 text-gray-600'}`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
)

// ── Icon-only action button ──
const ActionBtn = ({ icon, color, tooltip, onClick }) => (
  <Tooltip content={tooltip}>
    <button onClick={onClick}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-110 ${color.bg} ${color.text} ${color.hoverBg} ${color.hoverText}`}>
      <span className="text-sm">{icon}</span>
    </button>
  </Tooltip>
)

const COLORS = {
  content: { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'hover:bg-emerald-100', hoverText: 'hover:text-emerald-700' },
  edit: { bg: 'bg-amber-50', text: 'text-amber-600', hoverBg: 'hover:bg-amber-100', hoverText: 'hover:text-amber-700' },
  export: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBg: 'hover:bg-blue-100', hoverText: 'hover:text-blue-700' },
  delete: { bg: 'bg-red-50', text: 'text-red-500', hoverBg: 'hover:bg-red-100', hoverText: 'hover:text-red-600' },
  clone: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBg: 'hover:bg-purple-100', hoverText: 'hover:text-purple-700' },
}

const MappingUpload = () => {
  const config = useConfig()
  const { show, hide } = useShowAlerts()
  const { programs } = useLoadPrograms()
  const { me: currentUser } = useLoadMe()
  const { mutate, loading: processing } = useMappingsMutation(config.appName, Method.PUT)
  const { data, loading, refetch } = useLoadMappings(config.appName)
  const currentUserName = currentUser?.displayName || currentUser?.name || 'Unknown'

  const [file, setFile] = useState(null)
  const [mappingTab, setMappingTab] = useState('')
  const [optionsTab, setOptionsTab] = useState('')
  const [sheetNames, setSheetNames] = useState([])
  const [mappingName, setMappingName] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [mappingToDelete, setMappingToDelete] = useState(null)
  const [undoMapping, setUndoMapping] = useState(null)
  const [undoVisible, setUndoVisible] = useState(false)
  const undoTimerRef = useRef(null)
  const [previewData, setPreviewData] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [proceeding, setProceeding] = useState(false)
  const parsedFileRef = useRef(null)
  const [contentEditorMapping, setContentEditorMapping] = useState(null)
  const [contentEditorName, setContentEditorName] = useState('')
  const [contentEditorProgram, setContentEditorProgram] = useState('')
  const [contentEditorMappings, setContentEditorMappings] = useState([])
  const [contentEditorOptions, setContentEditorOptions] = useState([])
  const [contentEditorTab, setContentEditorTab] = useState('mappings')
  const [contentEditorSaving, setContentEditorSaving] = useState(false)
  const saveRef = useRef(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [showValidationWarning, setShowValidationWarning] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [fileDragOver, setFileDragOver] = useState(false)
  const [progress, setProgress] = useState({ visible: false, message: '' })

  // ── Helper: run an async operation with a progress bar ──
  // Manages progress bar visibility + refreshes data. Errors propagate to callers.
  const runWithProgress = useCallback(async (message, fn) => {
    setProgress({ visible: true, message })
    try {
      await fn()
      try { await refetch() } catch { /* silent: mutation succeeded even if refresh fails */ }
    } finally {
      setProgress({ visible: false, message: '' })
    }
  }, [refetch])

  const initFields = () => { setSelectedProgram(''); setMappingName(''); setOptionsTab(''); setMappingTab(''); setFile(null); setSheetNames([]); parsedFileRef.current = null }

  const parseFile = useCallback(() => new Promise((resolve, reject) => {
    if (!file || !optionsTab || !mappingTab) { reject(new Error('Missing file or tabs')); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        // Use readAsArrayBuffer for faster parsing
        const data = e.target.result
        const wb = XLSX.read(data, { type: 'array' })
        const oName = wb.SheetNames[wb.SheetNames.indexOf(optionsTab)]
        const mName = wb.SheetNames[wb.SheetNames.indexOf(mappingTab)]
        const opt = parseSheetRows(XLSX.utils.sheet_to_json(wb.Sheets[oName], { header: 1 }), OPTIONS_COLUMNS)
        const map = parseSheetRows(XLSX.utils.sheet_to_json(wb.Sheets[mName], { header: 1 }), MAPPING_COLUMNS)
        parsedFileRef.current = { options: opt, mappings: map }
        resolve({ options: opt, mappings: map, optionsCount: opt.length, mappingsCount: map.length })
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    // Use readAsArrayBuffer for faster binary parsing vs readAsBinaryString
    reader.readAsArrayBuffer(file)
  }), [file, optionsTab, mappingTab])

  const showImportPreview = async () => {
    if (proceeding || !file || !optionsTab || !mappingTab || !mappingName || !selectedProgram) return
    try { setProceeding(true); const p = await parseFile(); setPreviewData({ name: mappingName, program: programs?.find((pr) => pr.id === selectedProgram)?.name || selectedProgram, ...p }); setPreviewVisible(true) }
    catch { show({ message: 'Failed to parse the Excel file.', type: { critical: true } }); setTimeout(hide, 1000) }
    finally { setProceeding(false) }
  }

  const confirmImport = async () => {
    if (!parsedFileRef.current) return; setProceeding(true); setPreviewVisible(false)
    try {
      const { options, mappings } = parsedFileRef.current; const now = new Date()
      await runWithProgress('Importing mapping...', async () => {
        await mutate({ content: [...(data?.mappings || []), { id: uuidv4(), options, mappings, name: mappingName, program: programs?.find((p) => p.id === selectedProgram), createdAt: now, createdBy: currentUserName, updatedAt: now, updatedBy: currentUserName }] })
        initFields()
      })
      show({ message: 'File imported successfully', type: { success: true } }); setTimeout(hide, 1000)
    } catch { show({ message: 'An error occured. Please refresh and restart !', type: { critical: true } }); setTimeout(hide, 1000) }
    finally { setProceeding(false) }
  }

  const setFileAndParse = (f) => {
    if (!f) return; setFile(f); parsedFileRef.current = null
    const r = new FileReader(); r.onload = (ev) => { const wb = XLSX.read(ev.target.result, { type: 'binary' }); setSheetNames(wb.SheetNames.filter((s) => s !== 'hiddenWs')); setMappingTab(''); setOptionsTab('') }; r.readAsBinaryString(f)
  }

  const handleFileUpload = (e) => setFileAndParse(e.target.files[0])
  const handleFileDrop = (e) => { e.preventDefault(); setFileDragOver(false); const f = e.dataTransfer.files[0]; if (f && f.name.endsWith('.xlsx')) setFileAndParse(f); else show({ message: 'Please drop a .xlsx file', type: { critical: true } }); setTimeout(hide, 1000) }
  const handleFileDragOver = (e) => { e.preventDefault(); setFileDragOver(true) }
  const handleFileDragLeave = (e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) setFileDragOver(false) }

  const clearFile = () => { setFile(null); setSheetNames([]); setMappingTab(''); setOptionsTab(''); parsedFileRef.current = null }
  const clearUndo = useCallback(() => { setUndoMapping(null); setUndoVisible(false); if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null } }, [])

  const confirmDeletion = async (id) => {
    const del = data?.mappings?.find((m) => m.id === id)
    try {
      await runWithProgress('Deleting mapping...', async () => {
        await mutate({ content: data?.mappings?.filter((m) => m.id !== id) })
      })
      setMappingToDelete(null); initFields()
      // Reset to page 1 so the list always refreshes from the start after deletion
      setPage(1)
      if (del) { setUndoMapping(del); setUndoVisible(true); if (undoTimerRef.current) clearTimeout(undoTimerRef.current); undoTimerRef.current = setTimeout(() => { setUndoVisible(false); setUndoMapping(null) }, 8000) }
    } catch { show({ message: 'An error occurred while deleting', type: { critical: true } }); setTimeout(hide, 1000) }
  }
  const restoreMapping = async () => {
    if (!undoMapping || !data?.mappings) return; clearTimeout(undoTimerRef.current); setUndoVisible(false)
    try {
      await runWithProgress('Restoring mapping...', async () => {
        await mutate({ content: [...data.mappings, undoMapping] })
      })
      setUndoMapping(null)
      // Reset to page 1 to see the restored mapping at the top of the list
      setPage(1)
      show({ message: `Mapping "${undoMapping.name}" restored`, type: { success: true } }); setTimeout(hide, 1000)
    } catch { show({ message: 'Failed to restore mapping', type: { critical: true } }); setTimeout(hide, 1000) }
  }
  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    if (dragOverTimerRef.current) clearTimeout(dragOverTimerRef.current)
  }, [])

  const handleTemplateDownload = () => {
    const l = document.createElement('a'); l.rel = 'noopener noreferrer'
    l.href = `${config.systemInfo.contextPath}/api/apps/${config.appName}/template.xlsx`.replace(' ', '-').toLowerCase(); l.click()
  }
  const handleMappingExport = (mapping) => {
    try { exportMappingToExcel(mapping); show({ message: 'Mapping exported successfully', type: { success: true } }); setTimeout(hide, 1000) }
    catch { show({ message: 'An error occurred while exporting', type: { critical: true } }); setTimeout(hide, 1000) }
  }
  const openContentEditor = (m) => {
    setContentEditorMapping(m)
    setContentEditorName(m.name || '')
    setContentEditorProgram(m.program?.id || '')
    // Use spread for shallow copy instead of JSON.parse(JSON.stringify(...)) for performance
    setContentEditorMappings(m.mappings ? m.mappings.map(r => ({ ...r })) : [])
    setContentEditorOptions(m.options ? m.options.map(r => ({ ...r })) : [])
    setContentEditorTab('mappings')
    setValidationErrors([])
    setShowValidationWarning(false)
  }

  const moveMappingRow = useCallback((idx, direction) => setContentEditorMappings((prev) => {
    const cp = [...prev]; const target = idx + direction
    if (target < 0 || target >= cp.length) return cp;
    [cp[idx], cp[target]] = [cp[target], cp[idx]]
    return cp
  }), [])
  const moveOptionsRow = useCallback((idx, direction) => setContentEditorOptions((prev) => {
    const cp = [...prev]; const target = idx + direction
    if (target < 0 || target >= cp.length) return cp;
    [cp[idx], cp[target]] = [cp[target], cp[idx]]
    return cp
  }), [])

  const updateMappingRow = useCallback((idx, col, val) => setContentEditorMappings((prev) => { const cp = [...prev]; cp[idx] = { ...cp[idx], [col]: val }; return cp }), [])
  const addMappingRow = useCallback(() => setContentEditorMappings((prev) => [...prev, { ...EMPTY_MAPPING_ROW }]), [])
  const removeMappingRow = useCallback((idx) => setContentEditorMappings((prev) => prev.filter((_, i) => i !== idx)), [])
  const updateOptionsRow = useCallback((idx, col, val) => setContentEditorOptions((prev) => { const cp = [...prev]; cp[idx] = { ...cp[idx], [col]: val }; return cp }), [])
  const addOptionsRow = useCallback(() => setContentEditorOptions((prev) => [...prev, { ...EMPTY_OPTIONS_ROW }]), [])
  const removeOptionsRow = useCallback((idx) => setContentEditorOptions((prev) => prev.filter((_, i) => i !== idx)), [])

  const reorderMappings = useCallback((from, to) => { const arr = [...contentEditorMappings]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); setContentEditorMappings(arr) }, [contentEditorMappings])
  const reorderOptions = useCallback((from, to) => { const arr = [...contentEditorOptions]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); setContentEditorOptions(arr) }, [contentEditorOptions])

  const validateContent = useCallback(() => {
    const errors = []
    contentEditorMappings.forEach((row, i) => {
      MAPPING_COLUMNS.forEach((col) => {
        if (!row[col] || !row[col].trim()) errors.push(`Mappings row ${i + 1}: "${col}" is empty`)
      })
    })
    contentEditorOptions.forEach((row, i) => {
      OPTIONS_COLUMNS.forEach((col) => {
        if (!row[col] || !row[col].trim()) errors.push(`Options row ${i + 1}: "${col}" is empty`)
      })
    })
    return errors
  }, [contentEditorMappings, contentEditorOptions])

  const saveContentEditor = async (force = false) => {
    if (!contentEditorMapping) return
    if (!contentEditorName.trim()) {
      show({ message: 'Mapping name cannot be empty', type: { critical: true } }); setTimeout(hide, 1000)
      return
    }
    if (!force) {
      const errors = validateContent()
      if (errors.length > 0) { setValidationErrors(errors.slice(0, 5)); setShowValidationWarning(true); return }
    }
    setContentEditorSaving(true)
    try {
      const now = new Date()
      await runWithProgress('Saving content...', async () => {
        await mutate({ content: (data?.mappings || []).map((m) => m.id === contentEditorMapping.id ? {
          ...m,
          name: contentEditorName.trim(),
          program: programs?.find((p) => p.id === contentEditorProgram) || m.program,
          mappings: contentEditorMappings,
          options: contentEditorOptions,
          updatedAt: now,
          updatedBy: currentUserName,
        } : m) })
      })
      setContentEditorMapping(null); show({ message: 'Mapping saved successfully', type: { success: true } }); setTimeout(hide, 1000)
    } catch { show({ message: 'Failed to save', type: { critical: true } }); setTimeout(hide, 1000) }
    finally { setContentEditorSaving(false) }
  }
  saveRef.current = saveContentEditor

  // ── Keyboard shortcut: Ctrl+S to save ──
  useEffect(() => {
    if (!contentEditorMapping) return
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [contentEditorMapping])

  // ── Clone mapping ──
  const handleClone = async (mapping) => {
    if (!mapping) return
    try {
      const now = new Date()
      // Shallow clone for performance instead of JSON.parse(JSON.stringify)
      const { id: _id, name: _name, createdAt: _ca, createdBy: _cb, updatedAt: _ua, updatedBy: _ub, ...rest } = mapping
      const clone = {
        ...rest,
        mappings: rest.mappings?.map(r => ({ ...r })),
        options: rest.options?.map(r => ({ ...r })),
        id: uuidv4(),
        name: `${mapping.name} (Copy)`,
        createdAt: now,
        createdBy: currentUserName,
        updatedAt: now,
        updatedBy: currentUserName,
      }
      await runWithProgress(`Cloning "${mapping.name}"...`, async () => {
        await mutate({ content: [...(data?.mappings || []), clone] })
      })
      show({ message: `Mapping "${mapping.name}" cloned successfully`, type: { success: true } })
      setTimeout(hide, 1000)
    } catch {
      show({ message: 'An error occurred while cloning', type: { critical: true } })
      setTimeout(hide, 1000)
    }
  }

  // ── Drag & Drop handlers for table rows ──
  const dragOverTimerRef = useRef(null)
  const handleDragStart = useCallback((idx) => { setDragIndex(idx); setDropIndex(null) }, [])
  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault()
    if (dragOverTimerRef.current) clearTimeout(dragOverTimerRef.current)
    dragOverTimerRef.current = setTimeout(() => { if (dragIndex !== idx) setDropIndex(idx) }, 30)
  }, [dragIndex])
  const handleDragLeave = useCallback((e) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverTimerRef.current) clearTimeout(dragOverTimerRef.current); setDropIndex(null)
    }
  }, [])
  const handleDrop = useCallback(async (e, idx) => {
    e.preventDefault()
    if (dragOverTimerRef.current) clearTimeout(dragOverTimerRef.current)
    if (dragIndex === null || dragIndex === idx || !data?.mappings) { setDragIndex(null); setDropIndex(null); return }
    const reordered = reorderArray(data.mappings, dragIndex, idx)
    setDragIndex(null); setDropIndex(null)
    try {
      await runWithProgress('Reordering mappings...', async () => {
        await mutate({ content: reordered })
      })
    } catch { show({ message: 'An error occurred while updating', type: { critical: true } }); setTimeout(hide, 1000) }
  }, [dragIndex, data, mutate, runWithProgress])
  const handleDragEnd = useCallback(() => { setDragIndex(null); setDropIndex(null) }, [])

  // ── Stable callbacks for EditableTable (must be top-level, not inside JSX) ──
  const onMoveUpMapping = useCallback((i) => moveMappingRow(i, -1), [moveMappingRow])
  const onMoveDownMapping = useCallback((i) => moveMappingRow(i, 1), [moveMappingRow])
  const onMoveUpOptions = useCallback((i) => moveOptionsRow(i, -1), [moveOptionsRow])
  const onMoveDownOptions = useCallback((i) => moveOptionsRow(i, 1), [moveOptionsRow])

  // ── Search & Pagination (memoized) ──
  const filteredMappings = useMemo(() =>
    (data?.mappings || []).filter((m) =>
      !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.program?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [data?.mappings, searchQuery])
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredMappings.length / ITEMS_PER_PAGE)), [filteredMappings.length])
  const safePage = useMemo(() => page > totalPages ? totalPages : page, [page, totalPages])
  const pagedMappings = useMemo(() => filteredMappings.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE), [filteredMappings, safePage])
  const goToPage = useCallback((p) => { if (p >= 1 && p <= totalPages) setPage(p) }, [totalPages])

  const isFileReady = sheetNames?.length > 0
  const canProceed = isFileReady && !!optionsTab && !!mappingTab && !!mappingName && !!selectedProgram && !proceeding && !loading && !processing

  return (
    <div className="space-y-4">
      <ProgressBar visible={progress.visible} message={progress.message} />
      {undoVisible && undoMapping && (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 shadow-sm animate-scale-in">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <FaUndo className="text-green-500" />
            <span>Mapping <strong>&quot;{undoMapping.name}&quot;</strong> deleted. <span className="text-gray-400 text-xs">Undo available for 8s.</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Button small onClick={clearUndo}>Dismiss</Button>
            <Button small primary onClick={restoreMapping} className="flex items-center gap-1"><FaUndo /> Undo</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 p-2 overflow-hidden">
        {/* ═══════ LEFT — Import Panel with Drag & Drop ═══════ */}
        <div className="lg:col-span-1 my-4">
          <div
            onDragOver={handleFileDragOver} onDragLeave={handleFileDragLeave} onDrop={handleFileDrop}
            className={`rounded-xl border-2 border-dashed p-4 shadow-sm transition-all duration-300 ${
              fileDragOver
                ? 'border-blue-400 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
            }`}>
            {!isFileReady ? (
              <label htmlFor="uploadFile1" className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg text-center transition-all hover:bg-blue-50/50">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${fileDragOver ? 'bg-blue-200 text-blue-700 scale-110' : 'bg-blue-100 text-blue-500'}`}>
                  <FaFileImport className="text-xl" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{fileDragOver ? 'Drop file here' : 'Upload Excel File'}</span>
                <span className="mt-1 text-[11px] text-gray-400">{fileDragOver ? 'Release to import' : '.xlsx format'}</span>
                <input type="file" id="uploadFile1" className="hidden" accept=".xlsx" onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="flex flex-col gap-3 my-4">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 truncate"><FaFileImport className="shrink-0 text-blue-500" /><span className="truncate text-blue-700 text-xs">{file?.name || 'File selected'}</span></div>
                  <button onClick={clearFile} className="ml-2 shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-500">&times;</button>
                </div>
                <InputField onChange={({ value }) => setMappingName(value)} value={mappingName} className="w-full" label="Mapping Name" placeholder="Enter a name..." />
                <div><label className="mb-1 block text-xs font-medium text-gray-500">Mapping Tab</label>
                  <SingleSelect filterable clearable clearText="Clear" selected={mappingTab} onChange={({ selected }) => setMappingTab(selected)}>
                    {sheetNames.filter((s) => (optionsTab ? s !== optionsTab : s)).map((s) => (<SingleSelectOption key={uuidv4()} label={s} value={s} />))}
                  </SingleSelect></div>
                <div><label className="mb-1 block text-xs font-medium text-gray-500">Options Tab</label>
                  <SingleSelect filterable clearable clearText="Clear" selected={optionsTab} onChange={({ selected }) => setOptionsTab(selected)}>
                    {sheetNames.filter((s) => (mappingTab ? s !== mappingTab : s)).map((s) => (<SingleSelectOption key={uuidv4()} label={s} value={s} />))}
                  </SingleSelect></div>
                {programs?.length > 0 && (
                  <div><label className="mb-1 block text-xs font-medium text-gray-500">Program</label>
                    <SingleSelect filterable selected={selectedProgram} onChange={({ selected }) => setSelectedProgram(selected)}>
                      {programs.map((p) => (<SingleSelectOption key={p.id} value={p.id} label={p.name} />))}
                    </SingleSelect></div>
                )}
                <Button primary disabled={!canProceed} onClick={showImportPreview} loading={proceeding || loading || processing} className="mt-1">
                  {proceeding || loading || processing ? 'Processing...' : 'Proceed'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════ RIGHT — Mappings Table ═══════ */}
        <div className="lg:col-span-4 my-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><FaTable className="text-sm" /></div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Mappings</span>
                  <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">{filteredMappings.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400" />
                  <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                    placeholder="Search..."
                    className="w-36 rounded-lg border border-gray-200 bg-white py-1.5 pl-7 pr-2.5 text-xs text-gray-600 outline-none transition-all focus:w-48 focus:border-blue-300" />
                </div>
                <Tooltip content="Download Mapping Template">
                  <button onClick={handleTemplateDownload} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow">
                    <FaFileDownload className="text-gray-400" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mapping Name</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Program</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Uploaded By</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Upload Date</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Updated By</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Last Update</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pagedMappings.length > 0 ? (
                    pagedMappings.map((mapping, idx) => {
                      const globalIdx = (safePage - 1) * ITEMS_PER_PAGE + idx
                      const isDragging = dragIndex === globalIdx
                      const isDropTarget = dropIndex === globalIdx
                      return (
                      <tr key={mapping.id} draggable onDragStart={() => handleDragStart(globalIdx)} onDragOver={(e) => handleDragOver(e, globalIdx)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, globalIdx)} onDragEnd={handleDragEnd}
                        className={`group transition-all duration-200 hover:bg-blue-50/30 cursor-grab active:cursor-grabbing ${
                          isDragging ? 'opacity-40 ring-2 ring-blue-400' : ''
                        } ${isDropTarget ? 'border-t-2 border-blue-400' : ''} animate-fade-in`}
                        style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}>
                        <td className="px-4 py-3"><span className="font-medium text-gray-800">{mapping.name}</span></td>
                        <td className="px-4 py-3"><span className="inline-block rounded-md bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 ring-1 ring-purple-100">{mapping.program?.name || '\u2014'}</span></td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 ring-1 ring-blue-200">{(mapping.createdBy || '?').charAt(0).toUpperCase()}</span>
                          {mapping.createdBy || '\u2014'}
                        </span></td>
                        <td className="px-4 py-3 text-xs text-gray-500">{mapping.createdAt ? format(mapping.createdAt, 'yyyy-MM-dd') : '\u2014'}</td>
                        <td className="px-4 py-3">
                          {mapping.updatedBy ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600 ring-1 ring-amber-200">{mapping.updatedBy.charAt(0).toUpperCase()}</span>
                              {mapping.updatedBy}
                            </span>
                          ) : <span className="text-xs text-gray-300">\u2014</span>}
                        </td>
                        <td className="px-4 py-3">
                          {mapping.updatedAt ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <span>{format(mapping.updatedAt, 'yyyy-MM-dd')}</span>
                              <span className="text-gray-300">{format(mapping.updatedAt, 'HH:mm')}</span>
                            </span>
                          ) : (mapping.createdAt ? <span className="text-xs text-gray-500">{format(mapping.createdAt, 'yyyy-MM-dd')}</span> : <span className="text-xs text-gray-300">\u2014</span>)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <ActionBtn icon={<FaTable />} color={COLORS.content} tooltip={`Edit content of ${mapping.name}`} onClick={() => openContentEditor(mapping)} />
                            <ActionBtn icon={<FaCopy />} color={COLORS.clone} tooltip={`Clone ${mapping.name}`} onClick={() => handleClone(mapping)} />
                            <ActionBtn icon={<FaFileExport />} color={COLORS.export} tooltip={`Export ${mapping.name}`} onClick={() => handleMappingExport(mapping)} />
                            <ActionBtn icon={<FaTrashAlt />} color={COLORS.delete} tooltip={`Delete ${mapping.name}`} onClick={() => setMappingToDelete(mapping.id)} />
                          </div>
                          {mapping && mappingToDelete === mapping.id && (
                            <Modal onClose={() => { if (!processing) setMappingToDelete(null) }} small position="middle">
                              <ModalTitle className="text-red-800">Confirmation Required !</ModalTitle>
                              <ModalContent>
                                <div>Do you really want to remove <strong className="text-red-800">{mapping.name}</strong> ?</div>
                                <div className="mt-1 text-sm text-gray-500">This action cannot be undone once confirmed !</div>
                              </ModalContent>
                              <ModalActions>
                                <ButtonStrip end>
                                  <Button onClick={() => setMappingToDelete(null)} secondary disabled={processing}>Cancel</Button>
                                  <Button destructive onClick={() => confirmDeletion(mapping.id)} loading={processing}>Confirm</Button>
                                </ButtonStrip>
                              </ModalActions>
                            </Modal>
                          )}
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <FaSearch className="text-2xl text-gray-300" />
                          <p className="text-sm font-medium">{searchQuery ? 'No results found' : 'No mappings yet'}</p>
                          <p className="text-xs">{searchQuery ? 'Try a different search' : 'Import an Excel file to get started'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredMappings.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-4 py-2.5">
                <span className="text-[11px] text-gray-400">
                  {((safePage - 1) * ITEMS_PER_PAGE) + 1}\u2013{Math.min(safePage * ITEMS_PER_PAGE, filteredMappings.length)} / {filteredMappings.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => goToPage(1)} disabled={safePage <= 1} className={`p-1.5 rounded ${safePage <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} transition-colors`}><FaAngleDoubleLeft className="text-[11px]" /></button>
                  <button onClick={() => goToPage(safePage - 1)} disabled={safePage <= 1} className={`p-1.5 rounded ${safePage <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} transition-colors`}><FaChevLeft className="text-[11px]" /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-[11px] text-gray-300">{'\u2026'}</span>}
                        <button onClick={() => goToPage(p)}
                          className={`min-w-[28px] px-1.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            p === safePage ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                          }`}>{p}</button>
                      </React.Fragment>
                    ))}
                  <button onClick={() => goToPage(safePage + 1)} disabled={safePage >= totalPages} className={`p-1.5 rounded ${safePage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} transition-colors`}><FaChevRight className="text-[11px]" /></button>
                  <button onClick={() => goToPage(totalPages)} disabled={safePage >= totalPages} className={`p-1.5 rounded ${safePage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} transition-colors`}><FaAngleDoubleRight className="text-[11px]" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ MODALS ═══════ */}
      {previewVisible && previewData && (
        <Modal onClose={() => { if (!proceeding) { setPreviewVisible(false); setPreviewData(null) } }} small position="middle">
          <ModalTitle className="text-blue-800"><div className="flex items-center gap-2"><FaFileImport className="text-blue-500" /><span>Confirm Import</span></div></ModalTitle>
          <ModalContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Review before importing:</p>
              <div className="divide-y rounded-lg border bg-gray-50 text-sm">
                <div className="flex items-center justify-between px-4 py-2.5"><span className="font-medium text-gray-600">Name</span><span className="font-semibold text-gray-800">{previewData.name}</span></div>
                <div className="flex items-center justify-between px-4 py-2.5"><span className="font-medium text-gray-600">Program</span><span className="rounded-md bg-purple-50 px-2 py-0.5 text-sm font-medium text-purple-700">{previewData.program}</span></div>
                <div className="flex items-center justify-between px-4 py-2.5"><span className="font-medium text-gray-600">Mapping Rows</span><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"><FaCheck className="text-xs text-blue-500" /> {previewData.mappingsCount}</span></div>
                <div className="flex items-center justify-between px-4 py-2.5"><span className="font-medium text-gray-600">Options Rows</span><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"><FaCheck className="text-xs text-blue-500" /> {previewData.optionsCount}</span></div>
              </div>
            </div>
          </ModalContent>
          <ModalActions>
            <ButtonStrip end>
              <Button onClick={() => { setPreviewVisible(false); setPreviewData(null) }} secondary disabled={proceeding}>Cancel</Button>
              <Button primary onClick={confirmImport} loading={proceeding}><span className="flex items-center gap-2"><FaCheck /> Confirm Import</span></Button>
            </ButtonStrip>
          </ModalActions>
        </Modal>
      )}

      {showValidationWarning && (
        <Modal onClose={() => setShowValidationWarning(false)} small position="middle">
          <ModalTitle className="text-amber-800"><div className="flex items-center gap-2"><FaExclamationTriangle className="text-amber-500" /><span>Empty Cells Detected</span></div></ModalTitle>
          <ModalContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">The following cells are empty and may cause export issues:</p>
              <div className="max-h-40 overflow-y-auto rounded border bg-amber-50 p-2 text-xs text-amber-800">
                {validationErrors.map((err, i) => <div key={i} className="py-0.5">{err}</div>)}
                {validationErrors.length >= 5 && <div className="py-0.5 text-amber-500">...and more</div>}
              </div>
              <p className="text-xs text-gray-500">You can still save or go back to fill them.</p>
            </div>
          </ModalContent>
          <ModalActions>
            <ButtonStrip end>
              <Button onClick={() => setShowValidationWarning(false)} secondary>Go Back & Fill</Button>
              <Button primary onClick={() => { setShowValidationWarning(false); saveContentEditor(true) }}>Save Anyway</Button>
            </ButtonStrip>
          </ModalActions>
        </Modal>
      )}

      {contentEditorMapping && (
        <Modal onClose={() => { if (!contentEditorSaving) setContentEditorMapping(null) }} large position="middle">
          <ModalTitle className="border-b border-gray-200 bg-[#217346] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <FaTable className="text-white opacity-80 shrink-0" />
              <span className="font-semibold tracking-wide shrink-0">Content Editor</span>
              {/* ── Editable mapping title inline ── */}
              <div className="flex-1 min-w-0">
                <input type="text" value={contentEditorName} onChange={(e) => setContentEditorName(e.target.value)}
                  className="w-full rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-sm font-medium text-white placeholder-white/30 outline-none transition-all focus:border-white/60 focus:bg-white/20"
                  placeholder="Mapping name..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {/* ── Program selector inline ── */}
              <div className="w-40 shrink-0">
                <div className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80">
                  <SingleSelect
                    selected={contentEditorProgram}
                    onChange={({ selected }) => setContentEditorProgram(selected)}
                    className="!border-0 !bg-transparent !text-white [&_*]:!text-white [&_*]:!border-white/20"
                  >
                    {programs?.map((p) => (
                      <SingleSelectOption key={p.id} value={p.id} label={p.name} />
                    ))}
                  </SingleSelect>
                </div>
              </div>
              <span className="text-[10px] text-white/40 font-normal shrink-0">Ctrl+S</span>
            </div>
          </ModalTitle>
          <ModalContent className="!p-0">
            <TabBar tabs={[
              { key: 'mappings', label: 'Mappings', count: contentEditorMappings.length, icon: <FaTable /> },
              { key: 'options', label: 'Options', count: contentEditorOptions.length, icon: <FaList /> },
            ]} activeTab={contentEditorTab} onChange={setContentEditorTab} />
            <div className="p-3">
              {contentEditorTab === 'mappings' && (
                <EditableTable columns={MAPPING_COLUMNS} rows={contentEditorMappings}
                  onUpdate={updateMappingRow} onRemove={removeMappingRow} onAdd={addMappingRow}
                  onReorder={reorderMappings}
                  onMoveUp={onMoveUpMapping} onMoveDown={onMoveDownMapping}
                  addLabel="Add Mapping Row" />
              )}
              {contentEditorTab === 'options' && (
                <EditableTable columns={OPTIONS_COLUMNS} rows={contentEditorOptions}
                  onUpdate={updateOptionsRow} onRemove={removeOptionsRow} onAdd={addOptionsRow}
                  onReorder={reorderOptions}
                  onMoveUp={onMoveUpOptions} onMoveDown={onMoveDownOptions}
                  addLabel="Add Options Row" />
              )}
            </div>
          </ModalContent>
          <ModalActions className="border-t border-gray-200 bg-gray-50">
            <ButtonStrip end>
              <Button onClick={() => setContentEditorMapping(null)} secondary disabled={contentEditorSaving}>Cancel</Button>
              <Button primary onClick={saveContentEditor} loading={contentEditorSaving}>
                <span className="flex items-center gap-2"><FaSave /> {contentEditorSaving ? 'Saving...' : 'Save Content'}</span>
              </Button>
            </ButtonStrip>
          </ModalActions>
        </Modal>
      )}
    </div>
  )
}

export default MappingUpload
