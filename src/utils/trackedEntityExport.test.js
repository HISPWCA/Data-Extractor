import trackedEntitiesFixture from '../../testData/trackedEntities.fixture.json'
import mappingsFixture from '../../testData/mappings.fixture.json'
import {
  buildExportEmptyMessage,
  buildMappingFields,
  diagnoseExportEmpty,
  eventMatchesProgram,
  filterExportEvents,
  findProgramEnrollment,
  getProgramEvents,
  mergeExportRowsByTei,
  parseTrackedEntitiesInstances,
  transformTrackedEntitiesToExport,
} from './trackedEntityExport'

const meningitisMapping = mappingsFixture[0]

describe('trackedEntityExport', () => {
  const programID = meningitisMapping.program.id
  const firstInstance = trackedEntitiesFixture.trackedEntities[0]

  it('finds enrollment when program field is missing from API payload', () => {
    const enrollment = findProgramEnrollment(firstInstance.enrollments, programID)

    expect(enrollment).toBeDefined()
    expect(enrollment.events.length).toBeGreaterThan(0)
  })

  it('keeps events when program field is missing on event payload', () => {
    const enrollment = findProgramEnrollment(firstInstance.enrollments, programID)
    const programStages = new Set(['GIb6Ge9PCc4', 'G0ePNuYPT87', 'F9CrPrvrtb1', 'cSkxPgrdUKE'])

    const events = filterExportEvents(enrollment.events, {
      programID,
      programStages,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    })

    expect(events.length).toBeGreaterThan(0)
    expect(eventMatchesProgram(events[0], programID)).toBe(true)
  })

  it('maps enrolledAt as an enrollment field', () => {
    const fields = buildMappingFields(meningitisMapping.mappings)
    const enrolledAtField = fields.find((field) => field.id === 'enrolledAt')

    expect(enrolledAtField?.type).toBe('ENROLLMENT')
  })

  it('exports rows for Meninigite mapping with full-year date range', () => {
    const { dataToExport } = transformTrackedEntitiesToExport({
      instances: trackedEntitiesFixture.trackedEntities.slice(0, 5),
      mapping: meningitisMapping,
      programID,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      organisationUnits: [],
      organisationUnitLevels: [],
    })

    expect(dataToExport.length).toBeGreaterThan(0)
    expect(dataToExport[0]['Numero Epid']).toBeTruthy()
  })

  it('merges multiple event rows for the same tracked entity', () => {
    const merged = mergeExportRowsByTei([
      { teiID: 'a', colA: 'value-a', colB: '' },
      { teiID: 'a', colA: '', colB: 'value-b' },
      { teiID: 'b', colA: 'only-b', colB: '' },
    ])

    expect(merged).toHaveLength(2)
    expect(merged[0]).toEqual({
      teiID: 'a',
      colA: 'value-a',
      colB: 'value-b',
    })
  })

  it('parses tracked entity instances from alternate refetch shapes', () => {
    const instances = [{ trackedEntity: 'abc' }]

    expect(parseTrackedEntitiesInstances({ instances })).toEqual(instances)
    expect(
      parseTrackedEntitiesInstances({ trackedEntities: { instances } })
    ).toEqual(instances)
  })

  it('collects events from all matching enrollments', () => {
    const events = getProgramEvents(firstInstance.enrollments, programID)

    expect(events.length).toBeGreaterThan(0)
  })

  it('builds a helpful message when events are missing from the API payload', () => {
    const diagnosis = diagnoseExportEmpty({
      instances: trackedEntitiesFixture.trackedEntities.slice(0, 3).map((instance) => ({
        ...instance,
        enrollments: [{ enrollment: 'x', events: [] }],
      })),
      mapping: meningitisMapping,
      programID,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    })

    expect(buildExportEmptyMessage(diagnosis)).toMatch(/no enrollment events/i)
  })
})
