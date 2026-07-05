import { useDataQuery } from '@dhis2/app-runtime'
import {
  API_FIELDS_KEYS,
  DEFAULT_API_FIELDS,
} from '../utils/apiFields.defaults'

const useLoadApiField = (appName, fieldKey, defaultValue) => {
  const query = useDataQuery(
    {
      [fieldKey]: {
        resource: `dataStore/${appName}/${fieldKey}`,
      },
    },
    {
      variables: { appName },
    }
  )

  return {
    value: query.data?.[fieldKey] ?? defaultValue,
    error: query.error,
    loading: query.loading,
    refetch: query.refetch,
  }
}

const useLoadApiFields = (appName) => {
  const trackedEntities = useLoadApiField(
    appName,
    API_FIELDS_KEYS.TRACKED_ENTITIES,
    DEFAULT_API_FIELDS[API_FIELDS_KEYS.TRACKED_ENTITIES]
  )

  const events = useLoadApiField(
    appName,
    API_FIELDS_KEYS.EVENTS,
    DEFAULT_API_FIELDS[API_FIELDS_KEYS.EVENTS]
  )

  return {
    trackedEntitiesFields: trackedEntities.value,
    eventsFields: events.value,
    trackedEntitiesError: trackedEntities.error,
    eventsError: events.error,
    loading: trackedEntities.loading || events.loading,
    refetch: async () => {
      await trackedEntities.refetch()
      await events.refetch()
    },
  }
}

export default useLoadApiFields
