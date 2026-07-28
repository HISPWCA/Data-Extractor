import { useState, useEffect } from "react";
import { Dropdown, Space } from "antd";
import { subMonths } from "date-fns";
import csvDownload from "json-to-csv-export";
import { DateRangePicker } from "react-date-range";

import { useConfig } from "@dhis2/app-runtime";
import {
  Button,
  SingleSelect,
  SingleSelectOption,
  Radio,
  InputField,
} from "@dhis2/ui";
import exportFromJSON from "export-from-json";
import OrganisationUnitsTree from "../components/OrganisationUnitsTree";
import useLoadMappings from "../hooks/useLoadMappings";
import useLoadMe from "../hooks/useLoadMe";
import useLoadOrganisationUnits from "../hooks/useLoadOrganisationUnits";
import useLoadTrackedEntities from "../hooks/useLoadTrackedEntities";
import useShowAlerts from "../hooks/useShowAlerts";
import useOrgUnitLevels from "../hooks/useOrgUnitLevels";
import useLoadOrganisationUnitLevels from "../hooks/useLoadOrganisationUnitLevels";
import useLoadProgramAttributes from "../hooks/useLoadProgramAttributes";
import useLoadApiFields from "../hooks/useLoadApiFields";
import { DEFAULT_TRACKED_ENTITIES_FIELDS } from "../utils/apiFields.defaults";
import { exportDataToXLSX } from "../utils/mappingExcel";
import {
  buildExportEmptyMessage,
  dateFormatter,
  diagnoseExportEmpty,
  mergeExportRowsByTei,
  parseTrackedEntitiesInstances,
  stripInternalExportFields,
  transformTrackedEntitiesToExport,
} from "../utils/trackedEntityExport";

const DataExport = () => {
  const config = useConfig();
  const { show, hide } = useShowAlerts();
  const { data } = useLoadMappings(config.appName);
  const { trackedEntitiesFields } = useLoadApiFields(config.appName);

  const [selectedMapping, setSelectedMapping] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: subMonths(new Date(), 12),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const { organisationUnits } = useLoadOrganisationUnits();
  const { levels } = useOrgUnitLevels();
  const { loading, refetch } = useLoadTrackedEntities();
  const { me } = useLoadMe();
  const { organisationUnitLevels } = useLoadOrganisationUnitLevels();
  const { programAttributes, getProgramAttributes } =
    useLoadProgramAttributes();
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [selectedAttributeValue, setSelectedAttributeValue] = useState("");

  const [selectedOrgUnit, setSelectedOrgUnit] = useState(null);
  const [selectedOrganisationUnitLevel, setSelectedOrganisationUnitLevel] =
    useState(null);
  const [selectedTypeOU, setSelectedTypeOU] = useState("SELECTED");
  const handleOnOrgUnitChange = (value) => setSelectedOrgUnit(value);
  const [loadingExport, setLoadingExport] = useState(false);
  const handleDateRangeSelection = (item) => setDateRange([item.selection]);

  useEffect(() => {
    if (selectedMapping) {
      const programId = data?.mappings.find(
        (mapping) => mapping.id === selectedMapping,
      )?.program?.id;
      if (programId) {
        getProgramAttributes(programId);
      }
    }
  }, [selectedMapping]);

  const loadData = async () => {
    try {
      setLoadingExport(true);

      const dateObject = dateRange[0];
      const mapping = data.mappings.find(
        (mapping) => mapping.id === selectedMapping,
      );

      let urlFilter = null
      const urlFilteredObject = mapping.mappings.find(e => e["EMPRESS Field"] === "urlFilter")
      if(urlFilteredObject){
        // urlFilter = `&filter=${urlFilteredObject["Formula"]}`
        urlFilter = urlFilteredObject["Formula"]
      }

      const startDate = dateFormatter(dateObject.startDate, "YYYY-MM-DD");
      const endDate = dateFormatter(dateObject.endDate, "YYYY-MM-DD");
      const programID = mapping.program.id;

      const response = await refetch({
        urlFilter,
        program: programID,
        orgUnit: selectedOrgUnit.id,
        startDate,
        endDate,
        ouMode: selectedTypeOU || "SELECTED",
        trackedEntitiesFields:
          trackedEntitiesFields || DEFAULT_TRACKED_ENTITIES_FIELDS,
      });

      const instances = parseTrackedEntitiesInstances(response);

      if (instances.length === 0) {
        setLoadingExport(false);
        throw new Error("No result !");
      }

      const { dataToExport, fields } = transformTrackedEntitiesToExport({
        instances,
        mapping,
        programID,
        startDate,
        endDate,
        organisationUnits,
        organisationUnitLevels,
        selectedAttribute,
        selectedAttributeValue,
        selectedTypeOU,
        selectedOrganisationUnitLevel,
      });

      const mergedRows = mergeExportRowsByTei(dataToExport);

      if (mergedRows.length === 0) {
        setLoadingExport(false);
        const diagnosis = diagnoseExportEmpty({
          instances,
          mapping,
          programID,
          startDate,
          endDate,
          organisationUnits,
          selectedAttribute,
          selectedAttributeValue,
          selectedTypeOU,
          selectedOrganisationUnitLevel,
        });
        throw new Error(buildExportEmptyMessage(diagnosis));
      }

      setLoadingExport(false);

      return {
        dataToExport: stripInternalExportFields(mergedRows),
        fields,
      };
    } catch (err) {
      setLoadingExport(false);

      return show({ message: err.message, type: { default: true } });
    }
  };

  const exportCSVData = async () => {
    const response = await loadData();
    if (response) {
      const { dataToExport, fields } = response;

      const dataToConvert = {
        data: dataToExport,
        filename: "data",
        delimiter: ",",
        headers: fields
          .map((field) => field.output)
          .filter((field) => field !== "undefined"),
      };

      csvDownload(dataToConvert);
    }
  };

  const exportExcelData = async () => {
    const response = await loadData();
    if (response) {
      const { dataToExport } = response;
      exportFromJSON({
        data: dataToExport,
        fileName: "data",
        exportType: "xls",
      });
    }
  };

  const exportXLSXData = async () => {
    const response = await loadData();
    if (response) {
      const { dataToExport, fields } = response;
      const headers = fields
        .map((f) => f.output)
        .filter((f) => f !== "undefined");
      try {
        await exportDataToXLSX(dataToExport, "data", headers);
      } catch (err) {
        show({ message: err.message, type: { critical: true } });
        setTimeout(hide, 1000);
      }
    }
  };

  const handleExportFile = (text1, text2, data) => {
    try {
      if (data?.length === 0) throw new Error("Data is empty");

      const workbook = new window.ExcelJS.Workbook();
      const dataSheet = workbook.addWorksheet("Empres-i Data");
      const headers = Object.entries(data[0]);

      dataSheet.columns = headers.map(([key, _], index) => ({
        header: index === 0 ? text1 : "",
        key,
      }));

      const tmp1Payload = {};
      tmp1Payload[headers?.[0]?.[0]] = text2;
      dataSheet.addRow(tmp1Payload);

      const headerPayload = {};
      for (let [key, _] of headers) {
        headerPayload[key] = key;
      }
      dataSheet.addRow(headerPayload);

      for (let i = 0; i < data.length; i++) {
        const payload = {};
        for (let [key, _] of headers) {
          payload[key] = data[i][key];
        }
        dataSheet.addRow(payload);
      }

      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        window.saveAs(blob, "data.xlsx");
      });
    } catch (err) {
      throw new Error(err);
    }
  };

  const exportEmpresIData = async () => {
    const response = await loadData();
    if (response) {
      const { dataToExport } = response;
      handleExportFile("COUNTRY: Global", " ", dataToExport);
    }
  };

  const handleSelectLevel = ({ selected }) =>
    setSelectedOrganisationUnitLevel(levels.find((l) => l.id === selected));

  const handleSelectAttribute = ({ selected }) =>
    setSelectedAttribute(
      programAttributes.find((attr) => attr.id === selected),
    );

  return (
    <div className="m-1 w-[30%]">
      <div>
        <div className="p-1 border-2 dark:border-gray-700 dark:bg-dark-800/50 dark:text-gray-200">
          <div className="flex justify-between">
            <div>Select a Mapping</div>
            {selectedMapping && (
              <div className="border-2 p-1 rounded bg-slate-500 text-white dark:bg-dark-800 dark:text-gray-200 dark:border-gray-600">
                {data?.mappings.find(
                  (mapping) => mapping.id === selectedMapping,
                )?.program?.name || "No Mapping Selected yet"}
              </div>
            )}
          </div>

          <SingleSelect
            filterable
            disabled={data && data?.mappings && data?.mappings.length === 0}
            selected={selectedMapping}
            onChange={({ selected }) => setSelectedMapping(selected)}
          >
            {data?.mappings.map((mapping) => (
              <SingleSelectOption
                key={mapping.id}
                value={mapping.id}
                label={mapping.name}
              />
            ))}
          </SingleSelect>

          {data && data?.mappings && data?.mappings.length === 0 && (
            <div className="text-sm italic text-red-900 text-left my-2">
              No mapping available yet! Please import a new mapping file in the
              settings menu first
            </div>
          )}
        </div>

        {/* {data && data?.mappings && data?.mappings.length > 0 && (
          <div className="p-1 border-2 w-full">
            <div className="flex justify-between">
              <div>Select a Mapping</div>
              {selectedMapping && (
                <div className="border-2 p-1 rounded bg-slate-500 text-white">
                  {data?.mappings.find(
                    (mapping) => mapping.id === selectedMapping
                  )?.program?.name || "No Mapping Selected yet"}
                </div>
              )}
            </div>

            <SingleSelect
              filterable
              selected={selectedMapping}
              onChange={({ selected }) => setSelectedMapping(selected)}
            >
              {data?.mappings.map((mapping) => (
                <SingleSelectOption
                  key={mapping.id}
                  value={mapping.id}
                  label={mapping.name}
                />
              ))}
            </SingleSelect>
          </div>
        )} */}          {me &&
          me.me &&
          me.me.organisationUnits &&
          organisationUnits &&
          organisationUnits.length > 0 && (
            <>
              <div className="p-1 mt-2 border-2 dark:border-gray-700 dark:bg-dark-800/50 dark:text-gray-200">
                <div>Select an Organisation Unit</div>
                <OrganisationUnitsTree
                  meOrgUnitId={me.me.organisationUnits[0]?.id}
                  orgUnits={organisationUnits || []}
                  currentOrgUnits={selectedOrgUnit}
                  setCurrentOrgUnits={setSelectedOrgUnit}
                  onChange={handleOnOrgUnitChange}
                />
              </div>
            </>
          )}

        <div className="my-2 border-2 dark:border-gray-700 dark:text-gray-200">
          <div>
            <Radio
              label="Load data from selected organisation unit"
              onChange={() => {
                setSelectedTypeOU("SELECTED");
              }}
              checked={selectedTypeOU === "SELECTED"}
              value="SELECTED"
            />
          </div>

          <div>
            <Radio
              label="Load all data based on selected level"
              onChange={() => {
                setSelectedTypeOU("DESCENDANTS");
              }}
              checked={selectedTypeOU === "DESCENDANTS"}
              value="DESCENDANTS"
            />
          </div>
        </div>

        {selectedTypeOU === "DESCENDANTS" && selectedOrgUnit && (
          <div className="my-3 border-2 dark:border-gray-700 dark:text-gray-200">
            <div>Select organisation unit level </div>
            <SingleSelect
              selected={selectedOrganisationUnitLevel?.id}
              onChange={handleSelectLevel}
            >
              {levels
                ?.filter((level) =>
                  selectedTypeOU === "DESCENDANTS"
                    ? level.level >= selectedOrgUnit?.level
                    : true,
                )
                ?.map((level) => (
                  <SingleSelectOption label={level.name} value={level.id} />
                ))}
            </SingleSelect>
          </div>
        )}

        {programAttributes && programAttributes?.length > 0 && (
          <div className="mt-2 p-1 border-2 flex w-full items-center gap-4 dark:border-gray-700 dark:text-gray-200">
            <div className="w-full ">
              <div>Attributes filter</div>
              <SingleSelect
                selected={selectedAttribute?.id}
                onChange={handleSelectAttribute}
                filterable
              >
                {programAttributes?.map((attribute) => (
                  <SingleSelectOption
                    label={attribute.displayName}
                    value={attribute.id}
                  />
                ))}
              </SingleSelect>
            </div>

            <div className="w-full">
              <InputField
                onChange={({ value }) => setSelectedAttributeValue(value)}
                value={selectedAttributeValue}
                label="Attribute value"
              />
            </div>
          </div>
        )}
      </div>
      <>
        <div className="p-2 border-2 dark:border-gray-700 dark:text-gray-200">
          <div>Select a Date Range</div>

          <DateRangePicker
            onChange={(item) => handleDateRangeSelection(item)}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            months={2}
            ranges={dateRange}
            direction="horizontal"
          />
        </div>

        <div className="p-1 flex">
          <Space direction="vertical">
            <Space wrap>
              <Dropdown
                disabled={!selectedOrgUnit || !selectedMapping}
                menu={{
                  items: [
                    {
                      key: "1",
                      label: (
                        <Button
                          block
                          loading={loading}
                          disabled={!selectedOrgUnit || !selectedMapping}
                          ariaLabel="Button"
                          onClick={exportCSVData}
                          primary
                          value="default"
                        >
                          {loading ? "Generating CSV File" : "Generic CSV File"}
                        </Button>
                      ),
                    },
                    {
                      key: "2",
                      label: (
                        <Button
                          block
                          loading={loading}
                          disabled={!selectedOrgUnit || !selectedMapping}
                          ariaLabel="Button"
                          onClick={exportExcelData}
                          primary
                          value="default"
                        >
                          {loading
                            ? "Generating Excel File (.xls)"
                            : "Legacy Excel File (.xls)"}
                        </Button>
                      ),
                    },
                    {
                      key: "3",
                      label: (
                        <Button
                          block
                          loading={loading}
                          disabled={!selectedOrgUnit || !selectedMapping}
                          ariaLabel="Button"
                          onClick={exportXLSXData}
                          primary
                          value="default"
                        >
                          {loading
                            ? "Generating Excel File (.xlsx)"
                            : "Modern Excel File (.xlsx)"}
                        </Button>
                      ),
                    },
                    {
                      key: "4",
                      label: (
                        <Button
                          block
                          loading={loading}
                          disabled={!selectedOrgUnit || !selectedMapping}
                          ariaLabel="Button"
                          onClick={exportEmpresIData}
                          primary
                          value="default"
                        >
                          {loading
                            ? "Generating Empres-i File"
                            : "Empres-i Specific"}
                        </Button>
                      ),
                    },
                  ],
                }}
                placement="bottom"
              >
                <Button
                  loading={loadingExport}
                  disabled={!selectedOrgUnit || !selectedMapping}
                  ariaLabel="Button"
                  primary
                  value="default"
                >
                  {loading ? "Processing .." : "Export Data"}
                </Button>
              </Dropdown>
            </Space>
          </Space>
        </div>
      </>
    </div>
  );
};

export default DataExport;
