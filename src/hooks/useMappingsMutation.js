import { useDataMutation } from "@dhis2/app-runtime"

const useMappingsMutation = (appName, method) => {
  const mutation = {
    type: method,
    data: ({ content }) => content,
    resource: `dataStore/${appName}/mappings`,
  }

  const [mutate, { called, loading, error, data }] = useDataMutation(mutation)

  return {
    data,
    error,
    mutate,
    called,
    loading,
  }
}

export default useMappingsMutation
