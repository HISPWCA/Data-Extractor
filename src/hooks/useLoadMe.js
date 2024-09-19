import { useDataQuery } from "@dhis2/app-runtime";

const ME_QUERY = {
  me: {
    resource: "me.json",
    params: () => ({
      fields: "organisationUnits",
    }),
  },
};

const useLoadMe = () => {
  const { loading, error, data } = useDataQuery(ME_QUERY);

  return {
    me: data,
    error,
    loading,
  };
};

export default useLoadMe;
