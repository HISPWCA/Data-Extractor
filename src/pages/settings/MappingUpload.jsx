import React, { useState, useEffect, useRef, useCallback } from 'react'

import { format } from 'date-fns'
import { FaDownload, FaTrash, FaUndo, FaCheck, FaFileImport, FaTable, FaPlus, FaMinus, FaSave, FaFileExport, FaCog, FaFileAlt, FaList } from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

import { useConfig } from '@dhis2/app-runtime'
import {
  Button,
  ButtonStrip,
  InputField,
  Modal,
  ModalActions,
  ModalContent,
  ModalTitle,
  SingleSelect,
  SingleSelectOption,
  Table,
  TableBody,
  TableCell,
  TableCellHead,
  TableHead,
  TableRow,
  TableRowHead,
  Tooltip,
} from '@dhis2/ui'

import useLoadMappings from '../../hooks/useLoadMappings'
import useLoadPrograms from '../../hooks/useLoadPrograms'
import useLoadMe from '../../hooks/useLoadMe'
import useMappingsMutation from '../../hooks/useMappingsMutation'
import useShowAlerts from '../../hooks/useShowAlerts'
import Method from '../../utils/app.methods'
import {
  exportMappingToExcel,
  MAPPING_COLUMNS,
  OPTIONS_COLUMNS,
  parseSheetRows,
} from '../../utils/mappingExcel'

const EMPTY_MAPPING_ROW = Object.fromEntries(MAPPING_COLUMNS.map((c) => [c, '']))
const EMPTY_OPTIONS_ROW = Object.fromEntries(OPTIONS_COLUMNS.map((c) => [c, '']))

// ── Editable Excel-like table renderer (extracted outside component) ──
const EditableTable = ({ columns, rows, onUpdate, onRemove, onAdd, addLabel }) => (
  <div className="overflow-auto rounded border border-gray-300 shadow-sm" style={{ maxHeight: '420px', fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          {/* Row number header */}
          <th className="sticky top-0 z-10 w-10 border-r border-gray-300 bg-[#217346] px-1.5 py-1.5 text-center text-[11px] font-semibold text-white shadow-sm">
            #
          </th>
          {columns.map((col, ci) => (
            <th
              key={col}
              className="sticky top-0 z-10 whitespace-nowrap border-r border-gray-300 bg-[#217346] px-3 py-1.5 text-left text-[11px] font-semibold tracking-wide text-white shadow-sm"
            >
              {/* Excel-like column letter */}
              <span className="mr-1.5 inline-block rounded bg-white/15 px-1 text-[10px] font-bold uppercase opacity-70">
                {String.fromCharCode(65 + ci)}
              </span>
              {col}
            </th>
          ))}
          <th className="sticky top-0 z-10 w-11 border-r border-gray-300 bg-[#217346] px-1 py-1.5 text-center text-white shadow-sm">
            <FaMinus className="inline-block text-[10px] opacity-60" />
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={idx}
            className={`transition-colors duration-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]'} hover:bg-[#E8F0FE]`}
          >
            {/* Row number */}
            <td className="border-b border-r border-gray-200 bg-gray-50 px-1.5 py-0 text-center text-[11px] font-medium text-gray-400">
              {idx + 1}
            </td>
            {columns.map((col) => (
              <td key={col} className="border-b border-r border-gray-200 p-0">
                <input
                  value={row[col] ?? ''}
                  onChange={(e) => onUpdate(idx, col, e.target.value)}
                  className="w-full min-w-[110px] border-0 bg-transparent px-2.5 py-1.5 text-[13px] text-gray-800 outline-none transition-colors focus:bg-[#E8F0FE] focus:ring-1 focus:ring-inset focus:ring-[#217346]"
                  spellCheck={false}
                />
              </td>
            ))}
            <td className="border-b border-gray-200 p-0 text-center">
              <button
                onClick={() => onRemove(idx)}
                className="p-1.5 text-gray-300 transition-colors hover:text-red-500"
                title="Delete row"
              >
                <FaMinus className="text-[11px]" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {/* Add row button below table */}
    <div className="flex items-center gap-2 border-t border-gray-300 bg-gray-50 px-3 py-1.5">
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium text-[#217346] transition-colors hover:bg-[#217346] hover:text-white"
      >
        <FaPlus className="text-[10px]" /> {addLabel}
      </button>
      <span className="text-[11px] text-gray-400">{rows.length} row{rows.length > 1 ? 's' : ''}</span>
    </div>
  </div>
)

const TabBar = ({ tabs, activeTab, onChange }) => (
  <div className="flex items-end gap-0 border-b border-gray-300 bg-gray-100 px-2 pt-1">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={`
          relative flex items-center gap-1.5 rounded-t-md px-4 py-1.5 text-[12px] font-medium transition-all duration-150
          ${
            activeTab === tab.key
              ? 'z-10 -mb-[1px] border border-b-0 border-gray-300 bg-white text-[#217346] shadow-sm'
              : 'border border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }
        `}
      >
        {tab.icon && <span className="text-[11px]">{tab.icon}</span>}
        {tab.label}
        {tab.count !== undefined && (
          <span
            className={`ml-1 rounded-full px-1.5 text-[10px] font-semibold ${
              activeTab === tab.key ? 'bg-[#217346] text-white' : 'bg-gray-300 text-gray-600'
            }`}
          >
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
)

const MappingUpload = () => {
  const config = useConfig()
  const { show, hide } = useShowAlerts()
  const { programs } = useLoadPrograms()
  const { me: currentUser } = useLoadMe()
  const { mutate, loading: processing } = useMappingsMutation(config.appName, Method.PUT)
  const { data, loading, refetch } = useLoadMappings(config.appName)
  const currentUserName = currentUser?.displayName || currentUser?.name || 'Unknown'

  // ── Import form state ──
  const [file, setFile] = useState(null)
  const [mappingTab, setMappingTab] = useState('')
  const [optionsTab, setOptionsTab] = useState('')
  const [sheetNames, setSheetNames] = useState([])
  const [mappingName, setMappingName] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')

  // ── Deletion state ──
  const [mappingToDelete, setMappingToDelete] = useState(null)

  // ── Undo state ──
  const [undoMapping, setUndoMapping] = useState(null)
  const [undoVisible, setUndoVisible] = useState(false)
  const undoTimerRef = useRef(null)

  // ── Import preview state ──
  const [previewData, setPreviewData] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [proceeding, setProceeding] = useState(false)
  const parsedFileRef = useRef(null)

  // ── Edit mapping meta state ──
  const [editingMapping, setEditingMapping] = useState(null)
  const [editName, setEditName] = useState('')
  const [editProgram, setEditProgram] = useState('')

  // ── Content editor state ──
  const [contentEditorMapping, setContentEditorMapping] = useState(null)
  const [contentEditorMappings, setContentEditorMappings] = useState([])
  const [contentEditorOptions, setContentEditorOptions] = useState([])
  const [contentEditorTab, setContentEditorTab] = useState('mappings')
  const [contentEditorSaving, setContentEditorSaving] = useState(false)

  const initFields = () => {
    setSelectedProgram(''); setMappingName(''); setOptionsTab(''); setMappingTab(''); setFile(null); setSheetNames([]); parsedFileRef.current = null
  }

  const parseFile = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!file || !optionsTab || !mappingTab) { reject(new Error('Missing file or tabs')); return }
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary' })
          const oName = workbook.SheetNames[workbook.SheetNames.indexOf(optionsTab)]
          const mName = workbook.SheetNames[workbook.SheetNames.indexOf(mappingTab)]
          const oRows = XLSX.utils.sheet_to_json(workbook.Sheets[oName], { header: 1 })
          const mRows = XLSX.utils.sheet_to_json(workbook.Sheets[mName], { header: 1 })
          const options = parseSheetRows(oRows, OPTIONS_COLUMNS)
          const mappings = parseSheetRows(mRows, MAPPING_COLUMNS)
          parsedFileRef.current = { options, mappings }
          resolve({ options, mappings, optionsCount: options.length, mappingsCount: mappings.length })
        } catch (e) { reject(e) }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    })
  }, [file, optionsTab, mappingTab])

  const showImportPreview = async () => {
    if (proceeding || !file || !optionsTab || !mappingTab || !mappingName || !selectedProgram) return
    try {
      setProceeding(true)
      const parsed = await parseFile()
      const program = programs?.find((p) => p.id === selectedProgram)
      setPreviewData({ name: mappingName, program: program?.name || selectedProgram, ...parsed })
      setPreviewVisible(true)
    } catch { show({ message: 'Failed to parse the Excel file.', type: { critical: true } }); setTimeout(hide, 1000) }
    finally { setProceeding(false) }
  }

  const confirmImport = async () => {
    if (!parsedFileRef.current) return
    setProceeding(true); setPreviewVisible(false)
    try {
      const { options, mappings } = parsedFileRef.current
      const now = new Date()
      await mutate({
        content: [
          ...(data?.mappings || []),
          { id: uuidv4(), options, mappings, name: mappingName, program: programs?.find((p) => p.id === selectedProgram), createdAt: now, createdBy: currentUserName, updatedAt: now, updatedBy: currentUserName },
        ],
      })
      await refetch(); initFields()
      show({ message: 'File imported successfully', type: { success: true } }); setTimeout(hide, 1000)
    } catch { show({ message: 'An error occured. Please refresh and restart !', type: { critical: true } }); setTimeout(hide, 1000) }
    finally { setProceeding(false) }
  }

  const handleFileUpload = (e) => {
    const currentFile = e.target.files[0]
    if (!currentFile) return
    setFile(currentFile); parsedFileRef.current = null
    const reader = new FileReader()
    reader.onload = (event) => {
      const wb = XLSX.read(event.target.result, { type: 'binary' })
      setSheetNames(wb.SheetNames.filter((s) => s !== 'hiddenWs'))
      setMappingTab(''); setOptionsTab('')
    }
    reader.readAsBinaryString(currentFile)
  }

  const clearFile = () => { setFile(null); setSheetNames([]); setMappingTab(''); setOptionsTab(''); parsedFileRef.current = null }

  const clearUndo = useCallback(() => {
    setUndoMapping(null); setUndoVisible(false)
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null }
  }, [])

  const confirmDeletion = async (id) => {
    const deletedItem = data?.mappings?.find((m) => m.id === id)
    await mutate({ content: data?.mappings?.filter((m) => m.id !== id) }); await refetch()
    setMappingToDelete(null); initFields()
    if (deletedItem) {
      setUndoMapping(deletedItem); setUndoVisible(true)
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      undoTimerRef.current = setTimeout(() => { setUndoVisible(false); setUndoMapping(null) }, 8000)
    }
  }

  const restoreMapping = async () => {
    if (!undoMapping || !data?.mappings) return
    clearTimeout(undoTimerRef.current); setUndoVisible(false)
    await mutate({ content: [...data.mappings, undoMapping] }); await refetch()
    setUndoMapping(null)
    show({ message: `Mapping "${undoMapping.name}" restored`, type: { success: true } }); setTimeout(hide, 1000)
  }

  useEffect(() => { return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current) } }, [])

  const handleTemplateDownload = () => {
    const link = document.createElement('a')
    link.rel = 'noopener noreferrer'
    link.href = `${config.systemInfo.contextPath}/api/apps/${config.appName}/template.xlsx`.replace(' ', '-').toLowerCase()
    link.click()
  }

  const handleMappingExport = (mapping) => {
    try { exportMappingToExcel(mapping); show({ message: 'Mapping exported successfully', type: { success: true } }); setTimeout(hide, 1000) }
    catch { show({ message: 'An error occurred while exporting', type: { critical: true } }); setTimeout(hide, 1000) }
  }

  const openEditModal = (mapping) => { setEditingMapping(mapping); setEditName(mapping.name); setEditProgram(mapping.program?.id || '') }

  const confirmEdit = async () => {
    if (!editingMapping || !editName.trim()) return
    setProceeding(true)
    try {
      const now = new Date()
      await mutate({
        content: (data?.mappings || []).map((m) =>
          m.id === editingMapping.id
            ? { ...m, name: editName.trim(), program: programs?.find((p) => p.id === editProgram) || m.program, updatedAt: now, updatedBy: currentUserName }
            : m,
        ),
      })
      await refetch(); setEditingMapping(null)
      show({ message: 'Mapping updated successfully', type: { success: true } }); setTimeout(hide, 1000)
    } catch { show({ message: 'An error occurred while updating', type: { critical: true } }); setTimeout(hide, 1000) }
    finally { setProceeding(false) }
  }

  // ── Content editor ──
  const openContentEditor = (mapping) => {
    setContentEditorMapping(mapping)
    setContentEditorMappings(JSON.parse(JSON.stringify(mapping.mappings || [])))
    setContentEditorOptions(JSON.parse(JSON.stringify(mapping.options || [])))
    setContentEditorTab('mappings')
  }

  const updateMappingRow = (rowIdx, col, value) => setContentEditorMappings((prev) => { const c = [...prev]; c[rowIdx] = { ...c[rowIdx], [col]: value }; return c })
  const updateOptionsRow = (rowIdx, col, value) => setContentEditorOptions((prev) => { const c = [...prev]; c[rowIdx] = { ...c[rowIdx], [col]: value }; return c })
  const addMappingRow = () => setContentEditorMappings((prev) => [...prev, { ...EMPTY_MAPPING_ROW }])
  const addOptionsRow = () => setContentEditorOptions((prev) => [...prev, { ...EMPTY_OPTIONS_ROW }])
  const removeMappingRow = (idx) => setContentEditorMappings((prev) => prev.filter((_, i) => i !== idx))
  const removeOptionsRow = (idx) => setContentEditorOptions((prev) => prev.filter((_, i) => i !== idx))

  const saveContentEditor = async () => {
    if (!contentEditorMapping) return
    setContentEditorSaving(true)
    try {
      const now = new Date()
      await mutate({
        content: (data?.mappings || []).map((m) =>
          m.id === contentEditorMapping.id
            ? { ...m, mappings: contentEditorMappings, options: contentEditorOptions, updatedAt: now, updatedBy: currentUserName }
            : m,
        ),
      })
      await refetch(); setContentEditorMapping(null)
      show({ message: 'Mapping content updated successfully', type: { success: true } }); setTimeout(hide, 1000)
    } catch { show({ message: 'Failed to save mapping content', type: { critical: true } }); setTimeout(hide, 1000) }
    finally { setContentEditorSaving(false) }
  }

  const isFileReady = sheetNames && sheetNames.length > 0
  const canProceed = isFileReady && !!optionsTab && !!mappingTab && !!mappingName && !!selectedProgram && !proceeding && !loading && !processing
  const isImporting = proceeding || loading || processing

  return (
    <div>
      {/* ── Undo notification bar ── */}
      {undoVisible && undoMapping && (
        <div className="mb-4 flex items-center justify-between rounded border border-green-300 bg-green-50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <FaUndo className="text-green-600" />
            <span>Mapping <strong>&quot;{undoMapping.name}&quot;</strong> deleted. <span className="text-gray-500">Undo available for 8 seconds.</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Button small onClick={clearUndo}>Dismiss</Button>
            <Button small primary onClick={restoreMapping} className="flex items-center gap-1"><FaUndo /> Undo</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 grid-rows-1 gap-4">
        {/* ═══════ LEFT — Import ═══════ */}
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 shadow-sm transition-all duration-300 hover:border-blue-400">
          {!isFileReady ? (
            <label htmlFor="uploadFile1" className="flex h-52 cursor-pointer flex-col items-center justify-center rounded-lg text-base text-black transition-all hover:bg-blue-50">
              <FaFileImport className="mb-3 h-10 w-10 text-blue-500" />
              <span className="font-medium">Upload Excel File</span>
              <input type="file" id="uploadFile1" className="hidden" accept=".xlsx" onChange={handleFileUpload} />
              <p className="mt-2 text-xs text-gray-400">Only Excel Spreadsheets are Allowed</p>
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 truncate"><FaFileImport className="shrink-0 text-blue-500" /><span className="truncate text-blue-700">{file?.name || 'File selected'}</span></div>
                <button onClick={clearFile} className="ml-2 shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600">&times;</button>
              </div>
              <InputField onChange={({ value }) => setMappingName(value)} value={mappingName} className="w-full" label="Mapping Name" placeholder="Enter a name..." />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Mapping Tab</label>
                <SingleSelect filterable clearable clearText="Clear" selected={mappingTab} onChange={({ selected }) => setMappingTab(selected)}>
                  {sheetNames.filter((s) => (optionsTab ? s !== optionsTab : s)).map((s) => (<SingleSelectOption key={uuidv4()} label={s} value={s} />))}
                </SingleSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Options Tab</label>
                <SingleSelect filterable clearable clearText="Clear" selected={optionsTab} onChange={({ selected }) => setOptionsTab(selected)}>
                  {sheetNames.filter((s) => (mappingTab ? s !== mappingTab : s)).map((s) => (<SingleSelectOption key={uuidv4()} label={s} value={s} />))}
                </SingleSelect>
              </div>
              {programs && programs.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Program</label>
                  <SingleSelect filterable selected={selectedProgram} onChange={({ selected }) => setSelectedProgram(selected)}>
                    {programs.map((p) => (<SingleSelectOption key={p.id} value={p.id} label={p.name} />))}
                  </SingleSelect>
                </div>
              )}
              <Button primary disabled={!canProceed} onClick={showImportPreview} loading={isImporting} className="mt-2">
                {isImporting ? 'Processing...' : 'Proceed'}
              </Button>
            </div>
          )}
        </div>

        {/* ═══════ RIGHT — Mappings Table ═══════ */}
        <div className="col-span-4">
          <div className="rounded-lg border-2 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Mappings</span>
                {data?.mappings && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{data.mappings.length}</span>}
              </div>
              <Tooltip content="Download Mapping Template">
                <button onClick={handleTemplateDownload} className="inline-flex items-center gap-1.5 rounded-md bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-300">
                  <FaFileExport className="text-gray-500" /> Template
                </button>
              </Tooltip>
            </div>

            <Table>
              <TableHead>
                <TableRowHead>
                  <TableCellHead>Mapping Name</TableCellHead>
                  <TableCellHead className="w-[115px]">Program</TableCellHead>
                  <TableCellHead className="w-[115px]">Uploaded By</TableCellHead>
                  <TableCellHead className="w-[90px]">Upload Date</TableCellHead>
                  <TableCellHead className="w-[115px]">Updated By</TableCellHead>
                  <TableCellHead className="w-[90px]">Last Update</TableCellHead>
                  <TableCellHead className="w-[155px]">Actions</TableCellHead>
                </TableRowHead>
              </TableHead>
              <TableBody>
                {data && data?.mappings && data.mappings.length > 0 ? (
                  data.mappings.map((mapping) => (
                    <TableRow key={mapping.id} className="transition-colors hover:bg-gray-50">
                      <TableCell><span className="font-medium text-gray-800">{mapping.name}</span></TableCell>
                      <TableCell><span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{mapping.program?.name || '—'}</span></TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">{(mapping.createdBy || '?').charAt(0).toUpperCase()}</span>
                          {mapping.createdBy || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{mapping.createdAt ? format(mapping.createdAt, 'yyyy-MM-dd') : '—'}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {mapping.updatedBy ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">{mapping.updatedBy.charAt(0).toUpperCase()}</span>
                            {mapping.updatedBy}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {mapping.updatedAt ? (
                          <span className="inline-flex items-center gap-1 text-xs"><span>{format(mapping.updatedAt, 'yyyy-MM-dd')}</span><span className="text-gray-400">{format(mapping.updatedAt, 'HH:mm')}</span></span>
                        ) : (mapping.createdAt ? format(mapping.createdAt, 'yyyy-MM-dd') : '—')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {/* Content editor — spreadsheet icon */}
                          <Tooltip content={`Edit content of ${mapping.name}`}>
                            <button className="rounded-md p-1.5 text-emerald-600 transition-all hover:bg-emerald-50 hover:text-emerald-700" onClick={() => openContentEditor(mapping)}>
                              <FaTable className="text-sm" />
                            </button>
                          </Tooltip>
                          {/* Edit meta — gear icon */}
                          <Tooltip content={`Edit ${mapping.name} details`}>
                            <button className="rounded-md p-1.5 text-amber-600 transition-all hover:bg-amber-50 hover:text-amber-700" onClick={() => openEditModal(mapping)}>
                              <FaCog className="text-sm" />
                            </button>
                          </Tooltip>
                          {/* Export — download icon */}
                          <Tooltip content={`Export ${mapping.name} to Excel`}>
                            <button className="rounded-md p-1.5 text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700" onClick={() => handleMappingExport(mapping)}>
                              <FaDownload className="text-sm" />
                            </button>
                          </Tooltip>
                          {/* Delete — trash icon */}
                          <Tooltip content={`Delete ${mapping.name}`}>
                            <button className="rounded-md p-1.5 text-red-500 transition-all hover:bg-red-50 hover:text-red-600" onClick={() => setMappingToDelete(mapping.id)}>
                              <FaTrash className="text-sm" />
                            </button>
                          </Tooltip>
                        </div>
                        {mapping && mappingToDelete === mapping.id && (
                          <Modal onClose={() => { if (!processing) setMappingToDelete(null) }} small position="middle">
                            <ModalTitle className="text-red-800">Confirmation Required !</ModalTitle>
                            <ModalContent>
                              <div>Do you really want to remove <strong className="text-red-800">{mapping.name}</strong> ?</div>
                              <div className="mt-1">This action cannot be undone once confirmed !</div>
                            </ModalContent>
                            <ModalActions>
                              <ButtonStrip end>
                                <Button onClick={() => setMappingToDelete(null)} secondary disabled={processing}>Cancel</Button>
                                <Button destructive onClick={() => confirmDeletion(mapping.id)} loading={processing}>Confirm</Button>
                              </ButtonStrip>
                            </ModalActions>
                          </Modal>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7">
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <FaFileImport className="mb-2 text-xl" />
                        <p className="text-sm">No mappings yet</p>
                        <p className="text-xs">Import an Excel file to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* ═══════ IMPORT PREVIEW MODAL ═══════ */}
      {previewVisible && previewData && (
        <Modal onClose={() => { if (!proceeding) { setPreviewVisible(false); setPreviewData(null) } }} small position="middle">
          <ModalTitle className="text-blue-800"><div className="flex items-center gap-2"><FaFileImport className="text-blue-500" /><span>Confirm Import</span></div></ModalTitle>
          <ModalContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Please review the following information before importing:</p>
              <div className="divide-y rounded-lg border bg-gray-50">
                <div className="flex items-center justify-between px-4 py-2.5"><span className="text-sm font-medium text-gray-600">Mapping Name</span><span className="text-sm font-semibold text-gray-800">{previewData.name}</span></div>
                <div className="flex items-center justify-between px-4 py-2.5"><span className="text-sm font-medium text-gray-600">Program</span><span className="rounded-md bg-purple-50 px-2 py-0.5 text-sm font-medium text-purple-700">{previewData.program}</span></div>
                <div className="flex items-center justify-between px-4 py-2.5"><span className="text-sm font-medium text-gray-600">Mapping Rows</span><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"><FaCheck className="text-xs text-blue-500" /> {previewData.mappingsCount}</span></div>
                <div className="flex items-center justify-between px-4 py-2.5"><span className="text-sm font-medium text-gray-600">Options Rows</span><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"><FaCheck className="text-xs text-blue-500" /> {previewData.optionsCount}</span></div>
              </div>
              <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700"><strong>Note:</strong> This will add a new mapping. You will be identified as <strong>{currentUserName}</strong>.</div>
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

      {/* ═══════ EDIT MAPPING MODAL ═══════ */}
      {editingMapping && (
        <Modal onClose={() => { if (!proceeding) setEditingMapping(null) }} small position="middle">
          <ModalTitle className="text-amber-800"><div className="flex items-center gap-2"><FaCog className="text-amber-500" /><span>Edit Mapping</span></div></ModalTitle>
          <ModalContent>
            <div className="space-y-4">
              <InputField label="Mapping Name" value={editName} onChange={({ value }) => setEditName(value)} className="w-full" placeholder="Enter mapping name..." />
              {programs && programs.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">Program</label>
                  <SingleSelect filterable selected={editProgram} onChange={({ selected }) => setEditProgram(selected)}>
                    {programs.map((p) => (<SingleSelectOption key={p.id} value={p.id} label={p.name} />))}
                  </SingleSelect>
                </div>
              )}
              <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700"><strong>Info:</strong> You (<strong>{currentUserName}</strong>) will be recorded as the last editor.</div>
            </div>
          </ModalContent>
          <ModalActions>
            <ButtonStrip end>
              <Button onClick={() => setEditingMapping(null)} secondary disabled={proceeding}>Cancel</Button>
              <Button primary onClick={confirmEdit} loading={proceeding} disabled={!editName.trim()}><span className="flex items-center gap-2"><FaCheck /> Save Changes</span></Button>
            </ButtonStrip>
          </ModalActions>
        </Modal>
      )}

      {/* ═══════ EXCEL-LIKE CONTENT EDITOR MODAL ═══════ */}
      {contentEditorMapping && (
        <Modal
          onClose={() => { if (!contentEditorSaving) setContentEditorMapping(null) }}
          large
          position="middle"
        >
          <ModalTitle className="border-b border-gray-200 bg-[#217346] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <FaTable className="text-white opacity-80" />
              <span className="font-semibold tracking-wide">{contentEditorMapping.name}</span>
              <span className="ml-auto text-[12px] font-normal text-white/70">Content Editor</span>
            </div>
          </ModalTitle>
          <ModalContent className="!p-0">
            {/* Excel-like sheet tabs at the top of content */}
            <TabBar
              tabs={[
                { key: 'mappings', label: 'Mappings', count: contentEditorMappings.length, icon: <FaTable /> },
                { key: 'options', label: 'Options', count: contentEditorOptions.length, icon: <FaList /> },
              ]}
              activeTab={contentEditorTab}
              onChange={setContentEditorTab}
            />

            <div className="p-3">
              {contentEditorTab === 'mappings' && (
                <EditableTable
                  columns={MAPPING_COLUMNS}
                  rows={contentEditorMappings}
                  onUpdate={updateMappingRow}
                  onRemove={removeMappingRow}
                  onAdd={addMappingRow}
                  addLabel="Add Mapping Row"
                />
              )}
              {contentEditorTab === 'options' && (
                <EditableTable
                  columns={OPTIONS_COLUMNS}
                  rows={contentEditorOptions}
                  onUpdate={updateOptionsRow}
                  onRemove={removeOptionsRow}
                  onAdd={addOptionsRow}
                  addLabel="Add Options Row"
                />
              )}
            </div>
          </ModalContent>
          <ModalActions className="border-t border-gray-200 bg-gray-50">
            <ButtonStrip end>
              <Button onClick={() => setContentEditorMapping(null)} secondary disabled={contentEditorSaving}>Cancel</Button>
              <Button primary onClick={saveContentEditor} loading={contentEditorSaving}>
                <span className="flex items-center gap-2"><FaSave /> Save Content</span>
              </Button>
            </ButtonStrip>
          </ModalActions>
        </Modal>
      )}
    </div>
  )
}

export default MappingUpload
