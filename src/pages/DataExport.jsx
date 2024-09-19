import { useState, useEffect } from "react";
import { Dropdown, Space } from "antd";
import dayjs from "dayjs";
import {
  addDays,
  // format,
} from "date-fns";
import csvDownload from "json-to-csv-export";
import { DateRangePicker } from "react-date-range";

// import {
//   Button,
//   ButtonStrip,

//   Modal,
//   ModalActions,
//   ModalContent,
//   ModalTitle,
//   SingleSelect,
//   SingleSelectOption,
//   Table,
//   TableBody,
//   TableCell,
//   TableCellHead,
//   TableHead,
//   TableRow,
//   TableRowHead,
//   Tooltip,
// } from "@dhis2/ui";

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

const dateFormatter = (date, format) => {
  const value = dayjs(date).format(format);

  return value === "Invalid Date" ? "" : value;
};

const DataExport = () => {
  const config = useConfig();
  const { show, hide } = useShowAlerts();
  const { data } = useLoadMappings(config.appName);

  const [selectedMapping, setSelectedMapping] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
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
        (mapping) => mapping.id === selectedMapping
      )?.program?.id;
      if (programId) {
        getProgramAttributes(programId);
      }
    }
  }, [selectedMapping]);

  const getValue = (v1, v2) => {
    if (v1.length > 0) {
      return v1;
    }
    if (v2.length > 0) {
      return v2;
    }

    return "";
  };

  const loadData = async () => {
    try {
      setLoadingExport(true);

      const dateObject = dateRange[0];
      const mapping = data.mappings.find(
        (mapping) => mapping.id === selectedMapping
      );

      const startDate = dateFormatter(dateObject.startDate, "YYYY-MM-DD");
      const endDate = dateFormatter(dateObject.endDate, "YYYY-MM-DD");

      const response = await refetch({
        program: mapping.program.id,
        orgUnit: selectedOrgUnit.id,
        startDate: dateFormatter(dateObject.startDate, "YYYY-MM-DD"),
        endDate: dateFormatter(dateObject.endDate, "YYYY-MM-DD"),
        ouMode: selectedTypeOU || "SELECTED",
      });

      if (response?.trackedEntities?.instances?.length === 0) {
        setLoadingExport(false);
        throw new Error("No result !");
      }

      const getOptionValue = (entry) => {
        let value = entry;
        for (const option of mapping.options?.filter(
          (op) => Object.entries(op).length > 0
        )) {
          if (entry && entry.length > 0 && entry === option["D2 Code"]) {
            value = option["EMPRESS Code"] || "";

            return value === undefined || value === "undefined" ? "" : value;
          }
        }

        return value;
      };

      const fields = [];
      for (const row of mapping.mappings?.filter(
        (m) => Object.entries(m).length > 0
      ) || []) {
        if (!fields.includes(row["EMPRESS Field"])) {
          fields.push({
            id: row["D2 Field"],
            type: Object.keys(row).includes("D2 STAGE")
              ? "DATA_ELEMENT"
              : "ATTRIBUTE",
            output: row["EMPRESS Field"],
            stage: row["D2 STAGE"],
            formula: row["Formula"],
            field: row["Field"],
          });
        }
      }

      const programStages = new Set(
        fields.filter((field) => field.stage).map((field) => field.stage)
      );

      const dataToExport =
        response?.trackedEntities?.instances
          ?.filter((t) =>
            selectedAttribute && selectedAttributeValue
              ? t.attributes?.filter(
                  (a) =>
                    a.attribute === selectedAttribute.id &&
                    a.value === selectedAttributeValue
                )?.length > 0
              : true
          )
          ?.filter((t) =>
            selectedTypeOU === "DESCENDANTS" && selectedOrganisationUnitLevel
              ? organisationUnits.find((ou) => ou.id === t.orgUnit)?.level ===
                selectedOrganisationUnitLevel?.level
              : true
          )
          ?.reduce((prev, curr) => {
            const programID = data.mappings.find(
              (mapping) => mapping.id === selectedMapping
            )?.program?.id;
            const tmpEvents = [];

            const events = curr.enrollments
              .find((enrollment) => enrollment.program === programID)
              .events.filter(
                (event) =>
                  event.program === programID &&
                  programStages.has(event.programStage) &&
                  new Date(
                    dayjs(event.occurredAt).format("YYYY-MM-DD")
                  ).getTime() >= new Date(startDate).getTime() &&
                  new Date(
                    dayjs(event.occurredAt).format("YYYY-MM-DD")
                  ).getTime() <= new Date(endDate).getTime()
              );

            for (const event of events) {
              const element = {};
              element["eventID"] = event.event;
              element["teiID"] = event.trackedEntity;
              element["programStageID"] = event.programStage;
              element["enrollmentID"] = event.enrollment;

              for (const field of fields?.filter((f) => f?.id)) {
                const adminLevelID = organisationUnitLevels.find(
                  (ouLevel) => ouLevel.id === field.id
                );
                const adminLevel = adminLevelID?.level;

                if (adminLevel) {
                  const ou = organisationUnits?.find(
                    (o) => o.id === event.orgUnit
                  );
                  if (ou) {
                    const value =
                      organisationUnits
                        ?.filter((o) => o.level === adminLevel)
                        ?.find((o) => ou.path?.includes(o.id))?.displayName ||
                      "";
                    element[field.output] = value;
                  }
                } else if (field?.id === "createdAt") {
                  const enrollmentDate =
                    curr.enrollments.find(
                      (enrollment) =>
                        enrollment.program === programID &&
                        enrollment.enrollment === event.enrollment
                    )?.createdAt || "";

                  element[field.output] = dateFormatter(
                    enrollmentDate,
                    "DD/MM/YYYY"
                  );
                } else if (
                  field?.formula &&
                  field?.formula?.startsWith("FIX")
                ) {
                  const value = field?.formula?.split("|")[1];

                  element[field.output] = value;
                } else if (
                  field?.formula &&
                  field?.formula?.startsWith("SPLIT")
                ) {
                  const source = field?.formula?.split("|")[1];
                  const delimiter = field?.formula?.split("|")[2];
                  const position = +field?.formula?.split("|")[3];

                  if (source.includes(".")) {
                    const eventValue =
                      curr.enrollments
                        .find((enrollment) => enrollment.program === programID)
                        .events.filter((event) => event.program === programID)
                        ?.events.find(
                          (e) =>
                            e.programStage ===
                            field?.formula?.split("|")[1].split(".")[0]
                        )
                        .dataValues.find(
                          (dataValue) =>
                            dataValue.dataElement ===
                            field?.formula?.split("|")[1].split(".")[1]
                        )?.value || "";
                    let value = eventValue.split(delimiter)[position];
                    for (const r of field?.formula.split("|")[5].split(",")) {
                      value = value.replace(r, field?.formula?.split("|")[6]);
                    }
                    element[field.output] = value;
                  } else {
                    const attributeValue =
                      curr.attributes?.find((a) => a.attribute === source)
                        ?.value || "";
                    let value = attributeValue.split(delimiter)[position];
                    for (const r of field?.formula?.split("|")[5]?.split(",")) {
                      value = value?.replace(r, field?.formula?.split("|")[6]);
                    }

                    element[field.output] =
                      value === undefined || value === "undefined" ? "" : value;
                  }
                } else if (
                  field?.formula &&
                  field?.formula?.startsWith("JOIN")
                ) {
                  let values = [];
                  const formula = field?.formula?.split("|")[1]?.split(",");
                  const separator = field?.formula?.split("|")[2];

                  for (const a of formula) {
                    if (a.includes(".")) {
                      const stage = a.split(".")[0];
                      const dataElement = a.split(".")[1];

                      const value =
                        getOptionValue(
                          curr.enrollments
                            .find(
                              (enrollment) => enrollment.program === programID
                            )
                            .events.find(
                              (e) =>
                                e.program === programID &&
                                e.programStage === stage
                            )
                            ?.dataValues.find(
                              (dataValue) =>
                                dataValue.dataElement === dataElement
                            )?.value
                        ) || "";

                      if (value) {
                        values.push(value);
                      }
                    } else {
                      const value =
                        curr.attributes.find((attr) => attr.attribute === a)
                          ?.value || "";

                      if (value) {
                        values.push(value);
                      }
                    }
                  }

                  element[field.output] = values.join(separator);
                } else if (field?.type === "ATTRIBUTE") {
                  const attributeValue = field?.field
                    ? curr.attributes?.find((a) => a.attribute === field?.id)?.[
                        field?.field
                      ] || ""
                    : curr.attributes?.find((a) => a.attribute === field?.id)
                        ?.value || "";

                  const value =
                    field?.formula && field?.formula?.startsWith("FORMAT")
                      ? dateFormatter(
                          attributeValue,
                          field?.formula?.split("|")[1]?.toUpperCase() ||
                            "DD/MM/YYYY"
                        )
                      : getOptionValue(attributeValue);

                  element[field.output] = value;
                } else if (field?.type === "DATA_ELEMENT") {
                  const eventValue = field?.field
                    ? event.dataValues.find(
                        (dataValue) => dataValue.dataElement === field?.id
                      )[field?.field] || ""
                    : event.dataValues.find(
                        (dataValue) => dataValue.dataElement === field?.id
                      )?.value || "";
                  const value =
                    field?.formula && field?.formula?.startsWith("FORMAT")
                      ? dateFormatter(
                          eventValue,
                          field?.formula?.split("|")[1]?.toUpperCase() ||
                            "DD/MM/YYYY"
                        )
                      : getOptionValue(eventValue);

                  element[field.output] = value;
                }
              }

              tmpEvents.push(element);
            }

            return [...prev, ...tmpEvents];
          }, []) || [];

      const newDataToExport = [];

      const dataToExportWithoutDuplicates = new Set(
        dataToExport.map((d) => d.teiID)
      );

      for (const teiID of dataToExportWithoutDuplicates) {
        const objs = dataToExport.filter((d) => d.teiID === teiID);

        if (objs.length > 1) {
          const keys = Object.keys(objs[0]);
          const obj1 = objs[0];
          const obj2 = objs[1];

          if (obj1 && obj2) {
            const finalObject = {};
            for (const key of keys) {
              finalObject[key] = getValue(obj1[key], obj2[key]);
            }
            newDataToExport.push(finalObject);
          }
        } else {
          newDataToExport.push(objs[0]);
        }
      }

      setLoadingExport(false);

      return {
        dataToExport:
          newDataToExport.map((element) => {
            delete element["undefined"];
            delete element["eventID"];
            delete element["teiID"];
            delete element["programStageID"];
            delete element["enrollmentID"];

            return element;
          }) || [],
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

  const handleExportFile = (text1, text2, data) => {
    try {
      if (data?.length === 0) return console.log("Data is empty");

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
      console.log(err);
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
      programAttributes.find((attr) => attr.id === selected)
    );

  return (
    <div className="m-1 p-2 bg-slate-200 border w-[60%]">
      {data && data?.mappings && data?.mappings.length > 0 && (
        <div className="p-1 border w-full">
          <div className="flex justify-between">
            <div>Select a Mapping</div>
            {selectedMapping && (
              <div className="border p-1 rounded bg-slate-500 text-white">
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
      )}

      {me &&
        me.me &&
        me.me.organisationUnits &&
        organisationUnits &&
        organisationUnits.length > 0 && (
          <>
            <div className="p-1 border">
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

      <div className="my-2">
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
        <div className="my-3 ">
          <div>Select organisation unit level </div>
          <SingleSelect
            selected={selectedOrganisationUnitLevel?.id}
            onChange={handleSelectLevel}
          >
            {levels
              ?.filter((level) =>
                selectedTypeOU === "DESCENDANTS"
                  ? level.level >= selectedOrgUnit?.level
                  : true
              )
              ?.map((level) => (
                <SingleSelectOption label={level.name} value={level.id} />
              ))}
          </SingleSelect>
        </div>
      )}

      {programAttributes && programAttributes?.length > 0 && (
        <div className="mt-2 p-1 border flex w-full items-center gap-4">
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

      <div className="p-1 border">
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

      <div className="p-1 border bg-slate-500- flex">
        <Space direction="vertical">
          <Space wrap>
            <Dropdown
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
                          ? "Generating Excel File"
                          : "Generic Excel File"}
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
    </div>
  );
};

export default DataExport;
