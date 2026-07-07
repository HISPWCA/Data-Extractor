import dayjs from 'dayjs'

const ENROLLMENT_FIELD_IDS = new Set(['enrolledAt', 'enrollmentOrgUnitName', 'createdAt'])

export const dateFormatter = (date, format) => {
  const value = dayjs(date).format(format)
  return value === 'Invalid Date' ? '' : value
}

export const findProgramEnrollment = (enrollments, programID) => {
  if (!enrollments?.length) {
    return undefined
  }

  return (
    enrollments.find((enrollment) => enrollment.program === programID) ||
    enrollments[0]
  )
}

export const eventMatchesProgram = (event, programID) =>
  !event.program || event.program === programID

export const isEventInDateRange = (occurredAt, startDate, endDate) => {
  if (!occurredAt) {
    return false
  }

  const eventDate = dayjs(occurredAt).startOf('day')
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')

  return (
    !eventDate.isBefore(start, 'day') && !eventDate.isAfter(end, 'day')
  )
}

export const parseTrackedEntitiesInstances = (response) => {
  if (response && response?.instances && Array.isArray(response?.instances)) {
    return response.instances
  } else if (response && response?.trackedEntities && response?.trackedEntities?.instances && Array.isArray(response?.trackedEntities?.instances)) {
    return response.trackedEntities.instances
  } else if (response && response?.trackedEntities && Array.isArray(response?.trackedEntities)) {
    return response.trackedEntities
  } else if (response && response?.trackedEntities?.trackedEntities && Array.isArray(response?.trackedEntities?.trackedEntities)) {
    return response.trackedEntities.trackedEntities
  } else {
    return []
  }
}

export const getProgramEvents = (enrollments, programID) => {
  if (!enrollments?.length) {
    return []
  }

  const matchingEnrollments = enrollments.filter(
    (enrollment) => !enrollment.program || enrollment.program === programID
  )

  const enrollmentsToUse =
    matchingEnrollments.length > 0 ? matchingEnrollments : [enrollments[0]]

  return enrollmentsToUse.flatMap((enrollment) => enrollment.events || [])
}

export const filterExportEvents = (
  events,
  { programID, programStages, startDate, endDate }
) =>
  (events || []).filter(
    (event) =>
      eventMatchesProgram(event, programID) &&
      programStages.has(event.programStage) &&
      isEventInDateRange(event.occurredAt, startDate, endDate)
  )

export const buildMappingFields = (mappingRows = []) => {
  const fields = []

  for (const row of mappingRows.filter((m) => Object.entries(m).length > 0)) {
    if (fields.some((field) => field.output === row['EMPRESS Field'])) {
      continue
    }

    const fieldId = row['D2 Field']
    let type = 'ATTRIBUTE'

    if (ENROLLMENT_FIELD_IDS.has(fieldId)) {
      type = 'ENROLLMENT'
    } else if (Object.keys(row).includes('D2 STAGE')) {
      type = 'DATA_ELEMENT'
    }

    fields.push({
      id: fieldId,
      type,
      output: row['EMPRESS Field'],
      stage: row['D2 STAGE'],
      formula: row['Formula'],
      field: row['Field'],
    })
  }

  return fields
}

export const buildProgramStages = (mappingRows = []) =>
  new Set(
    buildMappingFields(mappingRows)
      .map((field) => field.stage)
      .filter(Boolean)
  )

export const buildExportEmptyMessage = ({
  totalInstances,
  afterAttributeFilter,
  afterOrgUnitFilter,
  withEvents,
  totalEvents,
  eventsMatchingStage,
  eventsInDateRange,
  programStages,
  observedStages,
  startDate,
  endDate,
  selectedAttribute,
  selectedAttributeValue,
  selectedTypeOU,
  selectedOrganisationUnitLevel,
}) => {
  if (totalInstances === 0) {
    return 'No tracked entities returned by the API for this program, organisation unit, and date range.'
  }

  if (selectedAttribute && selectedAttributeValue && afterAttributeFilter === 0) {
    return 'No tracked entities match the selected attribute filter.'
  }

  if (
    selectedTypeOU === 'DESCENDANTS' &&
    selectedOrganisationUnitLevel &&
    afterOrgUnitFilter === 0
  ) {
    return 'No tracked entities match the selected organisation unit level filter.'
  }

  if (withEvents === 0) {
    return (
      'Tracked entities were returned but no enrollment events were included in the API response. ' +
      'Open Settings → API Fields and reset trackedEntitiesFields to the default (must include enrollments and events).'
    )
  }

  if (totalEvents > 0 && eventsMatchingStage === 0) {
    return (
      `Found ${totalEvents} event(s), but none match the mapped program stages. ` +
      `Mapped stages: ${[...programStages].join(', ')}. ` +
      `Stages in data: ${[...observedStages].join(', ')}.`
    )
  }

  if (eventsMatchingStage > 0 && eventsInDateRange === 0) {
    return (
      `Found ${eventsMatchingStage} event(s) in mapped stages, but none fall within ` +
      `${startDate} to ${endDate}. Widen the date range and try again.`
    )
  }

  return (
    'No events found in the selected date range for the mapped program stages.'
  )
}

export const diagnoseExportEmpty = ({
  instances = [],
  mapping,
  programID,
  startDate,
  endDate,
  organisationUnits = [],
  selectedAttribute = null,
  selectedAttributeValue = '',
  selectedTypeOU = 'SELECTED',
  selectedOrganisationUnitLevel = null,
}) => {
  const programStages = buildProgramStages(mapping?.mappings)
  const observedStages = new Set()
  let afterAttributeFilter = 0
  let afterOrgUnitFilter = 0
  let withEvents = 0
  let totalEvents = 0
  let eventsMatchingStage = 0
  let eventsInDateRange = 0

  for (const trackedEntity of instances) {
    const matchesAttribute =
      !selectedAttribute ||
      !selectedAttributeValue ||
      trackedEntity.attributes?.some(
        (attribute) =>
          attribute.attribute === selectedAttribute.id &&
          attribute.value === selectedAttributeValue
      )

    if (!matchesAttribute) {
      continue
    }

    afterAttributeFilter += 1

    const matchesOrgUnitLevel =
      selectedTypeOU !== 'DESCENDANTS' ||
      !selectedOrganisationUnitLevel ||
      organisationUnits.find((ou) => ou.id === trackedEntity.orgUnit)?.level ===
      selectedOrganisationUnitLevel?.level

    if (!matchesOrgUnitLevel) {
      continue
    }

    afterOrgUnitFilter += 1

    const events = getProgramEvents(trackedEntity.enrollments, programID)

    if (events.length === 0) {
      continue
    }

    withEvents += 1
    totalEvents += events.length

    for (const event of events) {
      if (event.programStage) {
        observedStages.add(event.programStage)
      }

      if (
        eventMatchesProgram(event, programID) &&
        programStages.has(event.programStage)
      ) {
        eventsMatchingStage += 1

        if (isEventInDateRange(event.occurredAt, startDate, endDate)) {
          eventsInDateRange += 1
        }
      }
    }
  }

  return {
    totalInstances: instances.length,
    afterAttributeFilter,
    afterOrgUnitFilter,
    withEvents,
    totalEvents,
    eventsMatchingStage,
    eventsInDateRange,
    programStages,
    observedStages,
    startDate,
    endDate,
    selectedAttribute,
    selectedAttributeValue,
    selectedTypeOU,
    selectedOrganisationUnitLevel,
  }
}

const getOptionValue = (entry, options = []) => {
  let value = entry

  for (const option of options.filter((op) => Object.entries(op).length > 0)) {
    if (entry && entry.length > 0 && entry === option['D2 Code']) {
      value = option['EMPRESS Code'] || ''
      return value === undefined || value === 'undefined' ? '' : value
    }
  }

  return value
}

const getStageDataElementValue = (
  enrollments,
  programID,
  stageDataElementPath,
  currentEvent
) => {
  const [stage, dataElement] = stageDataElementPath.split('.')

  if (currentEvent?.programStage === stage) {
    return (
      currentEvent.dataValues?.find(
        (dataValue) => dataValue.dataElement === dataElement
      )?.value || ''
    )
  }

  const enrollment = findProgramEnrollment(enrollments, programID)
  const stageEvent = enrollment?.events?.find(
    (event) =>
      event.programStage === stage && eventMatchesProgram(event, programID)
  )

  return (
    stageEvent?.dataValues?.find(
      (dataValue) => dataValue.dataElement === dataElement
    )?.value || ''
  )
}

const resolveFieldValue = ({
  field,
  curr,
  event,
  programID,
  mappingOptions,
  organisationUnits,
  organisationUnitLevels,
}) => {
  const adminLevelID = organisationUnitLevels.find(
    (ouLevel) => ouLevel.id === field.id
  )
  const adminLevel = adminLevelID?.level

  if (adminLevel) {
    const eventOrgUnit = event.orgUnit || curr.orgUnit
    const ou = organisationUnits?.find((o) => o.id === eventOrgUnit)

    if (ou) {
      return (
        organisationUnits
          ?.filter((o) => o.level === adminLevel)
          ?.find((o) => ou.path?.includes(o.id))?.displayName || ''
      )
    }

    return ''
  }

  const enrollment = findProgramEnrollment(curr.enrollments, programID)

  if (field?.id === 'createdAt') {
    const enrollmentDate =
      curr.enrollments?.find(
        (item) =>
          item.program === programID &&
          item.enrollment === (event.enrollment || enrollment?.enrollment)
      )?.createdAt ||
      enrollment?.createdAt ||
      ''

    return dateFormatter(enrollmentDate, 'DD/MM/YYYY')
  }

  if (field?.type === 'ENROLLMENT') {
    if (field.id === 'enrolledAt') {
      const enrolledAt = enrollment?.enrolledAt || ''
      return field?.formula?.startsWith('FORMAT')
        ? dateFormatter(
          enrolledAt,
          field.formula.split('|')[1]?.toUpperCase() || 'DD/MM/YYYY'
        )
        : dateFormatter(enrolledAt, 'DD/MM/YYYY')
    }

    if (field.id === 'enrollmentOrgUnitName') {
      const orgUnitId = enrollment?.orgUnit || curr.orgUnit
      return (
        organisationUnits?.find((ou) => ou.id === orgUnitId)?.displayName || ''
      )
    }
  }

  if (field?.formula?.startsWith('FIX')) {
    return field.formula.split('|')[1]
  }

  if (field?.formula?.startsWith('IF')) {
    const [, conditionSource, expectedValue, valueSource] =
      field.formula.split('|')
    const conditionValue = getStageDataElementValue(
      curr.enrollments,
      programID,
      conditionSource,
      event
    )

    if (conditionValue !== expectedValue) {
      return ''
    }

    const rawValue = getStageDataElementValue(
      curr.enrollments,
      programID,
      valueSource,
      event
    )

    return getOptionValue(rawValue, mappingOptions)
  }

  if (field?.formula?.startsWith('SPLIT')) {
    const source = field.formula.split('|')[1]
    const delimiter = field.formula.split('|')[2]
    const position = +field.formula.split('|')[3]

    if (source.includes('.')) {
      const eventValue = getStageDataElementValue(
        curr.enrollments,
        programID,
        source,
        event
      )
      let value = eventValue.split(delimiter)[position]

      for (const replacement of field.formula.split('|')[5]?.split(',') || []) {
        value = value?.replace(replacement, field.formula.split('|')[6])
      }

      return value === undefined || value === 'undefined' ? '' : value
    }

    const attributeValue =
      curr.attributes?.find((a) => a.attribute === source)?.value || ''
    let value = attributeValue.split(delimiter)[position]

    for (const replacement of field.formula.split('|')[5]?.split(',') || []) {
      value = value?.replace(replacement, field.formula.split('|')[6])
    }

    return value === undefined || value === 'undefined' ? '' : value
  }

  if (field?.formula?.startsWith('JOIN')) {
    const formulaParts = field.formula.split('|')[1]?.split(',') || []
    const separator = field.formula.split('|')[2]
    const values = []

    for (const part of formulaParts) {
      if (part.includes('.')) {
        const value = getOptionValue(
          getStageDataElementValue(curr.enrollments, programID, part, event),
          mappingOptions
        )

        if (value) {
          values.push(value)
        }
      } else {
        const value =
          curr.attributes?.find((attr) => attr.attribute === part)?.value || ''

        if (value) {
          values.push(value)
        }
      }
    }

    return values.join(separator)
  }

  if (field?.type === 'ATTRIBUTE') {
    const attributeValue = field.field
      ? curr.attributes?.find((a) => a.attribute === field.id)?.[field.field] ||
      ''
      : curr.attributes?.find((a) => a.attribute === field.id)?.value || ''

    return field?.formula?.startsWith('FORMAT')
      ? dateFormatter(
        attributeValue,
        field.formula.split('|')[1]?.toUpperCase() || 'DD/MM/YYYY'
      )
      : getOptionValue(attributeValue, mappingOptions)
  }

  if (field?.type === 'DATA_ELEMENT') {
    const dataValue = event.dataValues?.find(
      (item) => item.dataElement === field.id
    )
    const eventValue = field.field
      ? dataValue?.[field.field] || ''
      : dataValue?.value || ''

    return field?.formula?.startsWith('FORMAT')
      ? dateFormatter(
        eventValue,
        field.formula.split('|')[1]?.toUpperCase() || 'DD/MM/YYYY'
      )
      : getOptionValue(eventValue, mappingOptions)
  }

  return ''
}

export const transformTrackedEntitiesToExport = ({
  instances = [],
  mapping,
  programID,
  startDate,
  endDate,
  organisationUnits = [],
  organisationUnitLevels = [],
  selectedAttribute = null,
  selectedAttributeValue = '',
  selectedTypeOU = 'SELECTED',
  selectedOrganisationUnitLevel = null,
}) => {
  const fields = buildMappingFields(mapping?.mappings)
  const programStages = buildProgramStages(mapping?.mappings)
  const mappingOptions = mapping?.options || []

  const dataToExport = instances
    .filter((trackedEntity) =>
      selectedAttribute && selectedAttributeValue
        ? trackedEntity.attributes?.some(
          (attribute) =>
            attribute.attribute === selectedAttribute.id &&
            attribute.value === selectedAttributeValue
        )
        : true
    )
    .filter((trackedEntity) =>
      selectedTypeOU === 'DESCENDANTS' && selectedOrganisationUnitLevel
        ? organisationUnits.find((ou) => ou.id === trackedEntity.orgUnit)
          ?.level === selectedOrganisationUnitLevel?.level
        : true
    )
    .reduce((prev, curr) => {
      const enrollment = findProgramEnrollment(curr.enrollments, programID)
      const programEvents = getProgramEvents(curr.enrollments, programID)

      if (programEvents.length === 0) {
        return prev
      }

      const events = filterExportEvents(programEvents, {
        programID,
        programStages,
        startDate,
        endDate,
      })

      const rows = events.map((event) => {
        const element = {
          eventID: event.event,
          teiID: event.trackedEntity || curr.trackedEntity,
          programStageID: event.programStage,
          enrollmentID: event.enrollment || enrollment?.enrollment,
        }

        for (const field of fields.filter((item) => item?.id || item?.formula)) {
          if (!field.id && !field.formula?.startsWith('FIX')) {
            continue
          }

          element[field.output] = resolveFieldValue({
            field,
            curr,
            event,
            programID,
            mappingOptions,
            organisationUnits,
            organisationUnitLevels,
          })
        }

        return element
      })

      return [...prev, ...rows]
    }, [])

  return { dataToExport, fields }
}

export const mergeExportRowsByTei = (dataToExport) => {
  const getValue = (v1, v2) => {
    if (v1?.length > 0) {
      return v1
    }
    if (v2?.length > 0) {
      return v2
    }
    return ''
  }

  const mergedRows = []
  const teiIds = new Set(dataToExport.map((row) => row.teiID))

  for (const teiID of teiIds) {
    const rows = dataToExport.filter((row) => row.teiID === teiID)

    if (rows.length > 1) {
      const keys = Object.keys(rows[0])
      const mergedRow = {}

      for (const key of keys) {
        mergedRow[key] = rows.reduce(
          (acc, row) => getValue(acc, row[key]),
          ''
        )
      }

      mergedRows.push(mergedRow)
    } else {
      mergedRows.push(rows[0])
    }
  }

  return mergedRows
}

export const stripInternalExportFields = (rows) =>
  rows.map((element) => {
    const cleaned = { ...element }
    delete cleaned.undefined
    delete cleaned.eventID
    delete cleaned.teiID
    delete cleaned.programStageID
    delete cleaned.enrollmentID
    return cleaned
  })
