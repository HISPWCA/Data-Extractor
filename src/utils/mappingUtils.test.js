// ── Pure functions extracted from MappingUpload.jsx logic ──

const reorderArray = (arr, from, to) => {
  const cp = [...arr]
  const [removed] = cp.splice(from, 1)
  cp.splice(to, 0, removed)
  return cp
}

const filterMappings = (mappings, query) => {
  if (!query) return mappings || []
  return (mappings || []).filter((m) =>
    m.name?.toLowerCase().includes(query.toLowerCase()) ||
    m.program?.name?.toLowerCase().includes(query.toLowerCase())
  )
}

const getTotalPages = (total, perPage) => Math.max(1, Math.ceil(total / perPage))

const getPagedItems = (items, page, perPage) =>
  items.slice((page - 1) * perPage, page * perPage)

const getSafePage = (page, totalPages) => (page > totalPages ? totalPages : page)

// ── Tests ──

describe('reorderArray', () => {
  it('moves an item from lower to higher index', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item from higher to lower index', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('keeps array unchanged when from === to', () => {
    expect(reorderArray(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('handles edge: moving first to last', () => {
    expect(reorderArray(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  it('handles edge: moving last to first', () => {
    expect(reorderArray(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('does not mutate original array', () => {
    const original = ['a', 'b', 'c']
    const result = reorderArray(original, 0, 2)
    expect(original).toEqual(['a', 'b', 'c'])
    expect(result).toEqual(['b', 'c', 'a'])
  })
})

describe('filterMappings', () => {
  const mappings = [
    { name: 'Alpha', program: { name: 'Program A' } },
    { name: 'Beta', program: { name: 'Program B' } },
    { name: 'Gamma', program: { name: 'Program Alpha' } },
  ]

  it('returns all mappings when query is empty', () => {
    expect(filterMappings(mappings, '')).toHaveLength(3)
  })

  it('filters by mapping name (case insensitive)', () => {
    const result = filterMappings(mappings, 'alpha')
    expect(result).toHaveLength(2) // Alpha + Gamma (via program name)
  })

  it('filters by program name', () => {
    const result = filterMappings(mappings, 'Program B')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Beta')
  })

  it('returns empty array when no matches', () => {
    expect(filterMappings(mappings, 'zzzz')).toHaveLength(0)
  })

  it('handles null/undefined mappings', () => {
    expect(filterMappings(null, 'test')).toEqual([])
    expect(filterMappings(undefined, 'test')).toEqual([])
  })
})

describe('Pagination helpers', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  it('getTotalPages returns at least 1', () => {
    expect(getTotalPages(0, 10)).toBe(1)
    expect(getTotalPages(5, 10)).toBe(1)
  })

  it('getTotalPages calculates correctly', () => {
    expect(getTotalPages(12, 10)).toBe(2)
    expect(getTotalPages(20, 10)).toBe(2)
    expect(getTotalPages(21, 10)).toBe(3)
  })

  it('getPagedItems returns correct slice', () => {
    expect(getPagedItems(items, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(getPagedItems(items, 2, 10)).toEqual([11, 12])
  })

  it('getSafePage clamps to totalPages', () => {
    expect(getSafePage(5, 3)).toBe(3)
    expect(getSafePage(0, 3)).toBe(0) // 0 is < 1, but the calling code handles that
    expect(getSafePage(1, 3)).toBe(1)
  })
})
