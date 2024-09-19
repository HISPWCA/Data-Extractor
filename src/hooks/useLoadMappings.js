import { useDataQuery } from "@dhis2/app-runtime"


const useLoadMappings = (appName) => {
  const MAPPINGS_QUERY = {
    mappings: {
      resource: `dataStore/${appName}/mappings`,
    },
  }
  const { loading, error, data, refetch } = useDataQuery(MAPPINGS_QUERY, {
    variables: { appName },
  })

  return {
    data,
    error,
    loading,
    refetch,
  }
}

export default useLoadMappings
