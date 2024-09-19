import { useDataQuery } from "@dhis2/app-runtime";

const PROGRAM_ATTRIBUTE_QUERY = {
  programAttributes: {
    resource: "programs.json",
    params: ({ id }) => ({
      fields:
        "programTrackedEntityAttributes[trackedEntityAttribute[id,displayName]]",
      filter: `id:eq:${id}`,
      paging: false,    
      //   filter: `id:eq:${programStageId}`,
    }),
  },
};

const useLoadProgramAttributes = () => {
  const { loading, error, data, refetch } = useDataQuery(
    PROGRAM_ATTRIBUTE_QUERY,
    { lazy: true }
  );

  const getProgramAttributes = async (id) => {
    if (id) {
      await refetch({ id });
    }
  };

  return {
    programAttributes:
      data?.programAttributes?.programs[0]?.programTrackedEntityAttributes?.map(
        (attribute) => ({
          id: attribute?.trackedEntityAttribute?.id,
          displayName: attribute?.trackedEntityAttribute?.displayName,
        })
      ) || [],
    error,
    loading,
    getProgramAttributes,
  };
};

export default useLoadProgramAttributes;
