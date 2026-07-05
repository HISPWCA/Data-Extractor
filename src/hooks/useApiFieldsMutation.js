import { useDataMutation } from '@dhis2/app-runtime'

const useApiFieldsMutation = (appName, fieldKey, method) => {
  const mutation = {
    type: method,
    data: ({ content }) => content,
    resource: `dataStore/${appName}/${fieldKey}`,
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

export default useApiFieldsMutation
