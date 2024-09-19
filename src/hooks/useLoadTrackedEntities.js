import { useDataQuery } from "@dhis2/app-runtime";

const TRACKED_ENTITIES_QUERY = {
  trackedEntities: {
    resource: "tracker/trackedEntities",
    params: ({ program, orgUnit, startDate, endDate , ouMode}) => ({
      fields: '*',
      program,
      orgUnit,
      eventOccuredAfter: startDate,
      eventOccuredBefore: endDate,
      skipPaging: true,
      // eventStatus: 'COMPLETED'
      ouMode: ouMode ? ouMode : 'SELECTED'
    }),
  },
};

const useLoadTrackedEntities = (program, orgUnit, startDate, endDate, ouMode) => {
  const { loading, error, data, refetch } = useDataQuery(TRACKED_ENTITIES_QUERY, {
    variables: { program, orgUnit, startDate, endDate , ouMode },
    lazy: true,
  });

  return {
    data,
    error,
    loading,
    refetch,
  };
};

export default useLoadTrackedEntities;
