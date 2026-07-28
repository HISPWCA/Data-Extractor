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

/**
 * Export data array to a properly formatted .xlsx file using ExcelJS
 * @param {Array<Object>} data - Array of row objects
 * @param {string} fileName - Output file name (without extension)
 * @param {Array<string>} fields - Ordered field names (output headers)
 * @param {Object} options - Optional formatting options
 */
export const exportDataToXLSX = async (data, fileName = 'data', fields, options = {}) => {
  const {
    sheetName = 'Data Export',
    headerRow = 1,
    addAutoFilter = true,
  } = options

  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  const Workbook = window.ExcelJS?.Workbook
  if (!Workbook) {
    throw new Error('ExcelJS library is not loaded')
  }

  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // Determine column headers: use provided fields or extract from first data row
  let headers
  if (fields && fields.length > 0) {
    headers = fields
  } else {
    headers = Object.keys(data[0])
  }

  // Define columns with proper widths
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 5, 15),
  }))

  // Style the header row
  const headerRowRef = worksheet.getRow(headerRow)
  headerRowRef.font = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 11,
    name: 'Calibri',
  }
  headerRowRef.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2C3E50' },
  }
  headerRowRef.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
  }
  headerRowRef.height = 25

  // Add data rows
  for (let i = 0; i < data.length; i++) {
    const row = worksheet.addRow(data[i])

    // Alternate row colors for readability
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F6FA' },
        }
      })
    }

    row.alignment = { vertical: 'middle', wrapText: true }
  }

  // Add auto-filter (only for up to 26 columns to avoid A-Z limit)
  if (addAutoFilter && headers.length > 0 && headers.length <= 26) {
    worksheet.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: headerRow, column: headers.length },
    }
  }

  // Freeze the header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  saveAs(blob, `${fileName}.xlsx`)

  return buffer
}
