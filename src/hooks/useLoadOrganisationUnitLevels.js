import { useDataQuery } from "@dhis2/app-runtime";

const ORG_UNIT_LEVEL_QUERY = {
    organisationUnitLevels: {
        resource: "organisationUnitLevels.json",
        params: {
            fields: "id,displayName,level",
            order: "level:asc",
            paging: false,
        },
    },
};

const useLoadOrganisationUnitLevels = () => {
    const { loading, error, data } = useDataQuery(ORG_UNIT_LEVEL_QUERY);

    return {
        organisationUnitLevels: data?.organisationUnitLevels?.organisationUnitLevels,
        error,
        loading,
    };
};

export default useLoadOrganisationUnitLevels;
