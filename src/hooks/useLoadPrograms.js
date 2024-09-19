import { useDataQuery } from "@dhis2/app-runtime";

const PROGRAMS_QUERY = {
  programs: {
    resource: "programs.json",
    params: {
      fields: ["id", "displayName~rename(name)", "level", "programType"],
      filter: ["programType:eq:WITH_REGISTRATION", "name:ne:default"],
      order: "displayName:asc",
      paging: false,
    },
  },
};

const useLoadPrograms = () => {
  const { loading, error, data } = useDataQuery(PROGRAMS_QUERY);

  return {
    programs: data?.programs?.programs,
    error,
    loading,
  };
};

export default useLoadPrograms;
