import { useDataQuery } from "@dhis2/app-runtime";

const ORG_UNIT_QUERY = {
    organisationUnits: {
        resource: "organisationUnits.json",
        params: {
            fields: "id,displayName,level,path,parent[id,displayName,level,path]",
            order: "level:asc",
            paging: false,
        },
    },
};

const useLoadOrganisationUnits = () => {
    const { loading, error, data } = useDataQuery(ORG_UNIT_QUERY);

    return {
        organisationUnits: data?.organisationUnits?.organisationUnits,
        error,
        loading,
    };
};

export default useLoadOrganisationUnits;
