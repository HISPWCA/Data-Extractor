import { useDataQuery } from '@dhis2/app-runtime'

const ME_QUERY = {
  me: {
    resource: 'me.json',
    params: {
      fields: ['id', 'displayName', 'name', 'organisationUnits'],
    },
  },
}

const useLoadMe = () => {
  const { loading, error, data } = useDataQuery(ME_QUERY)

  return {
    me: data?.me,
    error,
    loading,
  }
}

export default useLoadMe
