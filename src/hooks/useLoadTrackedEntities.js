import { useDataQuery } from '@dhis2/app-runtime'
import { DEFAULT_TRACKED_ENTITIES_FIELDS } from '../utils/apiFields.defaults'

const TRACKED_ENTITIES_QUERY = {
  trackedEntities: {
    resource: 'tracker/trackedEntities',
    params: ({
      urlFilter,
      program,
      orgUnit,
      startDate,
      endDate,
      ouMode,
      trackedEntitiesFields,
    }) => ({
      fields: trackedEntitiesFields || DEFAULT_TRACKED_ENTITIES_FIELDS,
      program,
      orgUnit,
      eventOccuredAfter: startDate,
      eventOccuredBefore: endDate,
      skipPaging: true,
      ouMode: ouMode ? ouMode : 'SELECTED',
      filter: urlFilter,
    }),
  },
}

const useLoadTrackedEntities = () => {
  const { loading, error, data, refetch } = useDataQuery(TRACKED_ENTITIES_QUERY, {
    lazy: true,
  })

  return {
    data,
    error,
    loading,
    refetch,
  }
}

export default useLoadTrackedEntities
