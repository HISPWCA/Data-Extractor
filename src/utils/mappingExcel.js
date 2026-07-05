import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export const MAPPING_COLUMNS = [
  'EMPRESS Field',
  'D2 Field',
  'D2 STAGE',
  'Formula',
  'Field',
]

export const OPTIONS_COLUMNS = [
  'EMPRESS Field',
  'D2 Field',
  'EMPRESS Code',
  'D2 Name',
  'D2 Code',
  'D2 UID',
]

export const MAPPING_SHEET_NAME = 'Mappings'
export const OPTIONS_SHEET_NAME = 'Options'

export const isNonEmptyEntry = (entry) => Object.entries(entry).length > 0

export const parseSheetRows = (rows, columns) =>
  rows
    .filter((_, index) => index !== 0)
    .map((row) => {
      const currentRow = {}

      for (let j = 0; j < row.length; j++) {
        if (columns[j]) {
          currentRow[columns[j]] = row[j]
        }
      }

      return currentRow
    })

export const rowsFromEntries = (entries, columns) => {
  const dataRows = (entries || [])
    .filter(isNonEmptyEntry)
    .map((entry) => columns.map((column) => entry[column] ?? ''))

  return [columns, ...dataRows]
}

export const sanitizeFileName = (name) => {
  const sanitized = (name || 'mapping')
    .replace(/[<>:"/\\|?*\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return sanitized || 'mapping'
}

export const exportMappingToExcel = (mapping) => {
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(rowsFromEntries(mapping.mappings, MAPPING_COLUMNS)),
    MAPPING_SHEET_NAME
  )

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(rowsFromEntries(mapping.options, OPTIONS_COLUMNS)),
    OPTIONS_SHEET_NAME
  )

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  saveAs(blob, `${sanitizeFileName(mapping.name)}-mapping.xlsx`)
}
