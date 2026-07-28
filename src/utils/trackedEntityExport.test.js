import {
  buildOptionsMap,
  getOptionValue,
  mergeExportRowsByTei,
  parseTrackedEntitiesInstances,
  isEventInDateRange,
  dateFormatter,
} from './trackedEntityExport'

// ── dateFormatter ─────────────────────────────────────────────────
describe('dateFormatter', () => {
  it('formats a date correctly', () => {
    expect(dateFormatter(new Date('2024-03-15'), 'YYYY-MM-DD')).toBe('2024-03-15')
  })

  it('returns empty string for invalid date', () => {
    expect(dateFormatter(new Date('invalid'), 'YYYY-MM-DD')).toBe('')
  })
})

// ── parseTrackedEntitiesInstances ─────────────────────────────────
describe('parseTrackedEntitiesInstances', () => {
  it('extracts instances from response.instances', () => {
    const result = parseTrackedEntitiesInstances({ instances: [{ id: 'a' }] })
    expect(result).toEqual([{ id: 'a' }])
  })

  it('extracts from response.trackedEntities.instances', () => {
    const result = parseTrackedEntitiesInstances({
      trackedEntities: { instances: [{ id: 'b' }] },
    })
    expect(result).toEqual([{ id: 'b' }])
  })

  it('extracts from response.trackedEntities array', () => {
    const result = parseTrackedEntitiesInstances({
      trackedEntities: [{ id: 'c' }],
    })
    expect(result).toEqual([{ id: 'c' }])
  })

  it('returns empty array for unknown shape', () => {
    expect(parseTrackedEntitiesInstances({})).toEqual([])
    expect(parseTrackedEntitiesInstances(null)).toEqual([])
    expect(parseTrackedEntitiesInstances(undefined)).toEqual([])
  })
})

// ── buildOptionsMap ───────────────────────────────────────────────
describe('buildOptionsMap', () => {
  it('builds a Map from an array of option objects', () => {
    const options = [
      { 'D2 Code': 'M', 'EMPRESS Code': 'MALE' },
      { 'D2 Code': 'F', 'EMPRESS Code': 'FEMALE' },
    ]
    const map = buildOptionsMap(options)
    expect(map.get('M')).toBe('MALE')
    expect(map.get('F')).toBe('FEMALE')
    expect(map.size).toBe(2)
  })

  it('skips empty entries', () => {
    const options = [{}, { 'D2 Code': 'A', 'EMPRESS Code': 'B' }]
    const map = buildOptionsMap(options)
    expect(map.size).toBe(1)
    expect(map.get('A')).toBe('B')
  })

  it('returns empty Map for empty input', () => {
    const map = buildOptionsMap([])
    expect(map.size).toBe(0)
  })

  it('handles undefined EMPRESS Code gracefully', () => {
    const options = [{ 'D2 Code': 'X' }]
    const map = buildOptionsMap(options)
    expect(map.get('X')).toBe('')
  })
})

// ── getOptionValue ────────────────────────────────────────────────
describe('getOptionValue', () => {
  it('returns mapped value when entry matches', () => {
    const map = new Map([['A', 'APPLE']])
    expect(getOptionValue('A', map)).toBe('APPLE')
  })

  it('returns entry when no match found', () => {
    const map = new Map([['A', 'APPLE']])
    expect(getOptionValue('B', map)).toBe('B')
  })

  it('returns entry when map is empty', () => {
    expect(getOptionValue('hello', new Map())).toBe('hello')
  })

  it('returns entry when map is null/undefined', () => {
    expect(getOptionValue('hello', null)).toBe('hello')
    expect(getOptionValue('hello', undefined)).toBe('hello')
  })
})

// ── isEventInDateRange ────────────────────────────────────────────
describe('isEventInDateRange', () => {
  it('returns true when event is within range', () => {
    expect(
      isEventInDateRange('2024-06-15', '2024-01-01', '2024-12-31')
    ).toBe(true)
  })

  it('returns false when event is before range', () => {
    expect(
      isEventInDateRange('2023-01-01', '2024-01-01', '2024-12-31')
    ).toBe(false)
  })

  it('returns false when event is after range', () => {
    expect(
      isEventInDateRange('2025-01-01', '2024-01-01', '2024-12-31')
    ).toBe(false)
  })

  it('returns false when occurredAt is null', () => {
    expect(isEventInDateRange(null, '2024-01-01', '2024-12-31')).toBe(false)
  })
})

// ── mergeExportRowsByTei ──────────────────────────────────────────
describe('mergeExportRowsByTei', () => {
  it('groups rows by teiID and merges with first non-empty value', () => {
    const rows = [
      { teiID: '1', name: 'Alice', age: '' },
      { teiID: '1', name: '', age: '30' },
    ]
    const result = mergeExportRowsByTei(rows)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
    expect(result[0].age).toBe('30')
  })

  it('keeps single-row TEIs unchanged', () => {
    const rows = [{ teiID: '1', name: 'Alice' }]
    const result = mergeExportRowsByTei(rows)
    expect(result).toEqual(rows)
  })

  it('returns empty array for empty input', () => {
    expect(mergeExportRowsByTei([])).toEqual([])
  })

  it('handles rows with missing teiID', () => {
    const rows = [{ name: 'NoID' }]
    const result = mergeExportRowsByTei(rows)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('NoID')
  })
})
