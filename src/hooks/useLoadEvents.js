import { useDataQuery } from '@dhis2/app-runtime'
import { DEFAULT_EVENTS_FIELDS } from '../utils/apiFields.defaults'

const EVENTS_QUERY = {
  events: {
    resource: 'tracker/events',
    params: ({
      program,
      orgUnit,
      startDate,
      endDate,
      ouMode,
      eventsFields,
    }) => ({
      fields: eventsFields || DEFAULT_EVENTS_FIELDS,
      program,
      orgUnit,
      occurredAfter: startDate,
      occurredBefore: endDate,
      skipPaging: true,
      ouMode: ouMode ? ouMode : 'SELECTED',
    }),
  },
}

const useLoadEvents = () => {
  const { loading, error, data, refetch } = useDataQuery(EVENTS_QUERY, {
    lazy: true,
  })

  return {
    data,
    error,
    loading,
    refetch,
  }
}

export default useLoadEvents
