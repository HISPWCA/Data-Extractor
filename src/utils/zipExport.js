import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * Compress data into a ZIP file and trigger download.
 * @param {Array<{filename: string, data: any, type?: string}>} files
 * @param {string} zipName - Output ZIP file name (without .zip)
 */
export const downloadAsZip = async (files, zipName = 'export') => {
  const zip = new JSZip()

  for (const file of files) {
    if (file.data instanceof Blob) {
      zip.file(file.filename, file.data)
    } else if (typeof file.data === 'string') {
      zip.file(file.filename, file.data)
    } else {
      // ArrayBuffer or other binary
      zip.file(file.filename, file.data, { binary: true })
    }
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  saveAs(blob, `${zipName}.zip`)
}

/**
 * Convert an array of row objects to CSV string
 */
export const rowsToCsv = (rows, headers) => {
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? ''
      const str = String(val)
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  )
  return [headerLine, ...dataLines].join('\n')
}
