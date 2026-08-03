import { useState, useEffect, useCallback, useRef } from "react";
import { DatePicker, Modal } from "antd";
import dayjs from "dayjs";
import csvDownload from "json-to-csv-export";

import { useConfig } from "@dhis2/app-runtime";
import ProgressBar from "../components/ProgressBar";
import {
  Button,
  SingleSelect,
  SingleSelectOption,
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
import useExportHistory from "../hooks/useExportHistory";
import { DEFAULT_TRACKED_ENTITIES_FIELDS } from "../utils/apiFields.defaults";
import { exportDataToXLSX } from "../utils/mappingExcel";
import { downloadAsZip, rowsToCsv } from "../utils/zipExport";
import { sanitizeFileName } from "../utils/mappingExcel";
import {
  FaHistory,
  FaTrashAlt,
  FaTimes,
  FaDownload,
  FaFileExport,
  FaFileCsv,
  FaFileExcel,
  FaFileArchive,
  FaBuilding,
  FaCalendarAlt,
  FaClipboardList,
  FaMapMarkedAlt,
  FaChevronRight,
  FaFilter,
} from "react-icons/fa";
import {
  buildExportEmptyMessage,
  dateFormatter,
  diagnoseExportEmpty,
  mergeExportRowsByTei,
  parseTrackedEntitiesInstances,
  stripInternalExportFields,
  transformTrackedEntitiesToExport,
} from "../utils/trackedEntityExport";

/* ══════════════════════ Date range helpers ══════════════════════ */

const DATE_PRESETS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "6m", label: "6 months" },
  { key: "12m", label: "12 months" },
  { key: "custom", label: "Custom" },
];

const getPresetRange = (key) => {
  const endDate = new Date();
  let startDate = dayjs().subtract(12, "month").toDate();

  if (key === "7d") startDate = dayjs().subtract(6, "day").startOf("day").toDate();
  else if (key === "30d") startDate = dayjs().subtract(29, "day").startOf("day").toDate();
  else if (key === "90d") startDate = dayjs().subtract(89, "day").startOf("day").toDate();
  else if (key === "6m") startDate = dayjs().subtract(6, "month").toDate();

  return { startDate, endDate };
};

const DEFAULT_RANGE = getPresetRange("12m");

const formatDisplayDate = (date) => dayjs(date).format("DD MMM YYYY");

/* ══════════════════════ Small presentational helpers ══════════════════════ */

const SectionHeader = ({ icon, title, hint, right }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </span>
      {hint}
    </div>
    {right}
  </div>
);

const Chip = ({ icon, label, value, ready }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
      ready
        ? "border-blue-200 bg-blue-50/70 text-blue-800"
        : "border-gray-200 bg-white text-gray-500"
    }`}
  >
    <span className={ready ? "text-blue-500" : "text-gray-400"}>{icon}</span>
    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
      {label}:
    </span>
    <span className="font-medium">{value}</span>
  </span>
);

const DataExport = () => {
  const config = useConfig();
  const { show, hide } = useShowAlerts();
  const { data } = useLoadMappings(config.appName);
  const { trackedEntitiesFields } = useLoadApiFields(config.appName);

  const [selectedMapping, setSelectedMapping] = useState("");
  const [dateRange, setDateRange] = useState([
    { startDate: DEFAULT_RANGE.startDate, endDate: DEFAULT_RANGE.endDate, key: "selection" },
  ]);
  const [activePreset, setActivePreset] = useState("12m");

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
  const [progress, setProgress] = useState({ visible: false, message: '' });
  const [selectedFormat, setSelectedFormat] = useState("1");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const { history: exportHistory, addEntry, clearHistory, removeEntry } = useExportHistory();
  const pageSizeRef = useRef(500);

  const runWithProgress = useCallback(async (message, fn) => {
    setProgress({ visible: true, message })
    try { await fn() } finally { setProgress({ visible: false, message: '' }) }
  }, [])

  /* ── Date range handlers ── */
  const handlePresetSelect = (key) => {
    if (key === "custom") {
      setActivePreset("custom");
      return;
    }
    const { startDate, endDate } = getPresetRange(key);
    setDateRange([{ startDate, endDate, key: "selection" }]);
    setActivePreset(key);
  };

  const handleCustomRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([
        {
          startDate: dates[0].toDate(),
          endDate: dates[1].toDate(),
          key: "selection",
        },
      ]);
      setActivePreset("custom");
    }
  };

  const selectedStart = dateRange[0]?.startDate;
  const selectedEnd = dateRange[0]?.endDate;
  const selectedRangeLabel = `${formatDisplayDate(selectedStart)} — ${formatDisplayDate(selectedEnd)}`;
  const selectedRangeDays =
    dayjs(selectedEnd).diff(dayjs(selectedStart), "day") + 1;

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

  const loadData = async (pageParam) => {
    const onProgress = pageParam ? (msg) => setProgress((p) => ({ ...p, message: msg })) : null
    try {
      setLoadingExport(true);

      const dateObject = dateRange[0];
      const mapping = data.mappings.find(
        (mapping) => mapping.id === selectedMapping,
      );

      let urlFilter = null
      const urlFilteredObject = mapping.mappings.find(e => e["EMPRESS Field"] === "urlFilter")
      if(urlFilteredObject){
        urlFilter = urlFilteredObject["Formula"]
      }

      const startDate = dateFormatter(dateObject.startDate, "YYYY-MM-DD");
      const endDate = dateFormatter(dateObject.endDate, "YYYY-MM-DD");
      const programID = mapping.program.id;

      const allInstances = []
      const pageSize = pageSizeRef.current
      let page = 1
      let totalPages = 1

      // When batch mode is enabled (pageParam=true), start with page 1 to get a pager from the API
      if (onProgress) onProgress('Fetching page 1...')

      const response = await refetch({
        urlFilter,
        program: programID,
        orgUnit: selectedOrgUnit.id,
        startDate,
        endDate,
        ouMode: selectedTypeOU || "SELECTED",
        trackedEntitiesFields:
          trackedEntitiesFields || DEFAULT_TRACKED_ENTITIES_FIELDS,
        ...(pageParam ? { page: 1, pageSize } : {}),
      });

      const instances = parseTrackedEntitiesInstances(response);
      allInstances.push(...instances)

      // Check for pagination: if the API returns a pager, fetch remaining pages
      if (response?.trackedEntities?.pager && pageParam) {
        const pager = response.trackedEntities.pager
        totalPages = Math.ceil(pager.total / pager.pageSize)
        for (page = 2; page <= totalPages; page++) {
          if (onProgress) onProgress(`Fetching page ${page} of ${totalPages}...`)
          const nextResponse = await refetch({
            urlFilter, program: programID, orgUnit: selectedOrgUnit.id,
            startDate, endDate, ouMode: selectedTypeOU || "SELECTED",
            trackedEntitiesFields: trackedEntitiesFields || DEFAULT_TRACKED_ENTITIES_FIELDS,
            page, pageSize,
          })
          const nextInstances = parseTrackedEntitiesInstances(nextResponse)
          allInstances.push(...nextInstances)
        }
      }

      if (allInstances.length === 0) {
        setLoadingExport(false);
        throw new Error("No result !");
      }

      if (onProgress) onProgress('Transforming data...')

      const { dataToExport, fields } = transformTrackedEntitiesToExport({
        instances: allInstances,
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
          instances: allInstances,
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
        mappingName: mapping.name,
        programName: mapping.program?.name,
        rowCount: mergedRows.length,
      };
    } catch (err) {
      setLoadingExport(false);

      return show({ message: err.message, type: { default: true } });
    }
  };

  const exportCSVData = async () => {
    await runWithProgress('Generating CSV file...', async () => {
      const response = await loadData(true);
      if (response) {
        const { dataToExport, fields, mappingName, programName, rowCount } = response;
        const headers = fields.map((f) => f.output).filter((f) => f !== 'undefined')
        csvDownload({ data: dataToExport, filename: 'data', delimiter: ',', headers })
        addEntry({ format: 'CSV', mappingName, programName, rowCount, dateRange: `${dateFormatter(dateRange[0].startDate, 'YYYY-MM-DD')} - ${dateFormatter(dateRange[0].endDate, 'YYYY-MM-DD')}` })
      }
    })
  }

  const exportExcelData = async () => {
    await runWithProgress('Generating Excel (.xls) file...', async () => {
      const response = await loadData(true)
      if (response) {
        const { dataToExport, mappingName, programName, rowCount } = response
        exportFromJSON({ data: dataToExport, fileName: 'data', exportType: 'xls' })
        addEntry({ format: 'XLS', mappingName, programName, rowCount, dateRange: `${dateFormatter(dateRange[0].startDate, 'YYYY-MM-DD')} - ${dateFormatter(dateRange[0].endDate, 'YYYY-MM-DD')}` })
      }
    })
  }

  const exportXLSXData = async () => {
    await runWithProgress('Generating Excel (.xlsx) file...', async () => {
      const response = await loadData(true)
      if (response) {
        const { dataToExport, fields, mappingName, programName, rowCount } = response
        const headers = fields.map((f) => f.output).filter((f) => f !== 'undefined')
        try {
          await exportDataToXLSX(dataToExport, 'data', headers)
          addEntry({ format: 'XLSX', mappingName, programName, rowCount, dateRange: `${dateFormatter(dateRange[0].startDate, 'YYYY-MM-DD')} - ${dateFormatter(dateRange[0].endDate, 'YYYY-MM-DD')}` })
        } catch (err) {
          show({ message: err.message, type: { critical: true } }); setTimeout(hide, 1000)
        }
      }
    })
  }

  const handleExportFile = (text1, text2, data) => {
    try {
      if (data?.length === 0) throw new Error('Data is empty')
      const workbook = new window.ExcelJS.Workbook()
      const dataSheet = workbook.addWorksheet('Empres-i Data')
      const headers = Object.entries(data[0])
      dataSheet.columns = headers.map(([key, _], index) => ({ header: index === 0 ? text1 : '', key }))
      const tmp1Payload = {}; tmp1Payload[headers?.[0]?.[0]] = text2; dataSheet.addRow(tmp1Payload)
      const headerPayload = {}
      for (let [key, _] of headers) headerPayload[key] = key
      dataSheet.addRow(headerPayload)
      for (let i = 0; i < data.length; i++) {
        const payload = {}
        for (let [key, _] of headers) payload[key] = data[i][key]
        dataSheet.addRow(payload)
      }
      workbook.xlsx.writeBuffer().then((buffer) => {
        window.saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'data.xlsx')
      })
    } catch (err) { throw new Error(err) }
  }

  const exportEmpresIData = async () => {
    await runWithProgress('Generating Empres-i file...', async () => {
      const response = await loadData(true)
      if (response) {
        const { dataToExport, mappingName, programName, rowCount } = response
        handleExportFile('COUNTRY: Global', ' ', dataToExport)
        addEntry({ format: 'Empres-i', mappingName, programName, rowCount, dateRange: `${dateFormatter(dateRange[0].startDate, 'YYYY-MM-DD')} - ${dateFormatter(dateRange[0].endDate, 'YYYY-MM-DD')}` })
      }
    })
  }

  const exportZIPData = async () => {
    await runWithProgress('Generating ZIP file...', async () => {
      const response = await loadData(true)
      if (response) {
        const { dataToExport, fields, mappingName, programName, rowCount } = response
        const headers = fields.map((f) => f.output).filter((f) => f !== 'undefined')
        const csvContent = rowsToCsv(dataToExport, headers)
        await downloadAsZip([{ filename: 'data.csv', data: csvContent }], `${sanitizeFileName(mappingName || 'export')}-data`)
        addEntry({ format: 'ZIP', mappingName, programName, rowCount, dateRange: `${dateFormatter(dateRange[0].startDate, 'YYYY-MM-DD')} - ${dateFormatter(dateRange[0].endDate, 'YYYY-MM-DD')}` })
      }
    })
  }

  const downloadHistoryCSV = () => {
    if (exportHistory.length === 0) return
    const headers = ['Date', 'Format', 'Mapping', 'Program', 'Rows', 'Date Range']
    const data = exportHistory.map((e) => ({
      Date: new Date(e.timestamp).toLocaleString(),
      Format: e.format,
      Mapping: e.mappingName,
      Program: e.programName,
      Rows: e.rowCount,
      'Date Range': e.dateRange,
    }))
    csvDownload({ data, filename: 'export-history', delimiter: ',', headers })
  }

  const handleSelectLevel = ({ selected }) =>
    setSelectedOrganisationUnitLevel(levels.find((l) => l.id === selected));

  const handleSelectAttribute = ({ selected }) =>
    setSelectedAttribute(
      programAttributes.find((attr) => attr.id === selected),
    );

  const exportFormats = [
    {
      key: "1",
      label: "Generic CSV File",
      description: "Comma-separated values — ideal for spreadsheets and data processing",
      action: exportCSVData,
      Icon: FaFileCsv,
      iconClass: "bg-teal-50 text-teal-600",
    },
    {
      key: "2",
      label: "Legacy Excel (.xls)",
      description: "Older Excel format compatible with Excel 97–2003",
      action: exportExcelData,
      Icon: FaFileExcel,
      iconClass: "bg-green-50 text-green-600",
    },
    {
      key: "3",
      label: "Modern Excel (.xlsx)",
      description: "Standard Excel format with styled headers, auto-filter, and frozen panes",
      action: exportXLSXData,
      Icon: FaFileExcel,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      key: "4",
      label: "Empres-i Specific",
      description: "Specialized format for Empres-i data exchange with country header row",
      action: exportEmpresIData,
      Icon: FaBuilding,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      key: "5",
      label: "Download as ZIP",
      description: "All formats bundled into a compressed ZIP archive for easy sharing",
      action: exportZIPData,
      Icon: FaFileArchive,
      iconClass: "bg-amber-50 text-amber-600",
    },
  ];

  const selectedProgramName = data?.mappings?.find((m) => m.id === selectedMapping)?.program?.name
  const selectedMappingName = data?.mappings?.find((m) => m.id === selectedMapping)?.name
  const selectedOrgUnitName = selectedOrgUnit?.displayName || selectedOrgUnit?.name || null

  const handleExport = () => {
    const selected = exportFormats.find((f) => f.key === selectedFormat)
    if (selected) selected.action()
  }

  const isReady = Boolean(selectedMapping && selectedOrgUnit)

  return (
    <div className="p-6">
      <ProgressBar visible={progress.visible} message={progress.message} />

      {/* ══ Header ══ */}
      <header className="mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200">
            <FaFileExport className="text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Export</h1>
            <p className="text-sm text-gray-400 mt-0.5">Configure and export tracked entity data from DHIS2</p>
          </div>
        </div>

        {/* ── Summary chips ── */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Chip
            icon={<FaClipboardList className="text-[10px]" />}
            label="Mapping"
            value={selectedMappingName || "Not selected"}
            ready={Boolean(selectedMappingName)}
          />
          <Chip
            icon={<FaMapMarkedAlt className="text-[10px]" />}
            label="Org unit"
            value={selectedOrgUnitName || "Not selected"}
            ready={Boolean(selectedOrgUnitName)}
          />
          <Chip
            icon={<FaCalendarAlt className="text-[10px]" />}
            label="Period"
            value={`${selectedRangeLabel} · ${selectedRangeDays} days`}
            ready
          />
          <Chip
            icon={<FaFileExport className="text-[10px]" />}
            label="Format"
            value={exportFormats.find((f) => f.key === selectedFormat)?.label || "—"}
            ready
          />
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ══ Left column: configuration ══ */}
        <div className="lg:col-span-3 space-y-6">
          {/* ── Section: Mapping ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <SectionHeader
                icon={<FaClipboardList className="w-4 h-4 text-gray-400" />}
                title="Mapping"
                right={selectedProgramName && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                    {selectedProgramName}
                  </span>
                )}
              />
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
                <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
                  No mapping available yet! Please import a mapping file in the Settings menu first.
                </div>
              )}
            </div>
          </div>

          {/* ── Section: Organisation Unit ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5">
              <SectionHeader
                icon={<FaMapMarkedAlt className="w-4 h-4 text-gray-400" />}
                title="Organisation Unit"
              />

              {!selectedMapping ? (
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-400">
                  Select a mapping first to choose the organisation unit
                </div>
              ) : (
                <div className="space-y-3">
                  <OrganisationUnitsTree
                    meOrgUnitId={me?.me?.organisationUnits?.[0]?.id}
                    orgUnits={organisationUnits || []}
                    currentOrgUnits={selectedOrgUnit}
                    setCurrentOrgUnits={setSelectedOrgUnit}
                    onChange={handleOnOrgUnitChange}
                  />

                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ouMode" checked={selectedTypeOU === 'SELECTED'} onChange={() => setSelectedTypeOU('SELECTED')}
                        className="accent-blue-600" />
                      <span className="text-xs text-gray-600">Selected unit only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ouMode" checked={selectedTypeOU === 'DESCENDANTS'} onChange={() => setSelectedTypeOU('DESCENDANTS')}
                        className="accent-blue-600" />
                      <span className="text-xs text-gray-600">Include descendants</span>
                    </label>
                  </div>

                  {selectedTypeOU === 'DESCENDANTS' && selectedOrgUnit && (
                    <div className="animate-fade-in">
                      <label className="mb-1 block text-xs font-medium text-gray-500">Organisation unit level</label>
                      <SingleSelect
                        selected={selectedOrganisationUnitLevel?.id}
                        onChange={handleSelectLevel}
                      >
                        {levels
                          ?.filter((level) => level.level >= selectedOrgUnit?.level)
                          ?.map((level) => (
                            <SingleSelectOption label={level.name} value={level.id} />
                          ))}
                      </SingleSelect>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Section: Attributes Filter ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5">
              <SectionHeader
                icon={<FaFilter className="w-4 h-4 text-gray-400" />}
                title="Attributes Filter"
                hint={(!programAttributes || programAttributes.length === 0 || !selectedMapping) && (
                  <span className="text-[11px] text-gray-300 ml-1">— optional</span>
                )}
              />

              {programAttributes && programAttributes?.length > 0 && selectedMapping ? (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Attribute</label>
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
                  <div className="flex-1">
                    <InputField
                      onChange={({ value }) => setSelectedAttributeValue(value)}
                      value={selectedAttributeValue}
                      label="Value"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-400">
                  Select a mapping with attributes to enable filtering
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ Right column: date range + export ══ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="lg:sticky lg:top-4 space-y-6">
            {/* ── Section: Date Range ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <SectionHeader
                  icon={<FaCalendarAlt className="w-4 h-4 text-gray-400" />}
                  title="Date Range"
                />

                {/* Quick presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handlePresetSelect(preset.key)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-150 press-effect ${
                        activePreset === preset.key
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {activePreset === "custom" ? (
                  <>
                    <DatePicker.RangePicker
                      value={[dayjs(selectedStart), dayjs(selectedEnd)]}
                      onChange={handleCustomRangeChange}
                      presets={[
                        {
                          label: "Today",
                          value: [dayjs().startOf("day"), dayjs().endOf("day")],
                        },
                        {
                          label: "Last 7 days",
                          value: [dayjs().subtract(6, "day").startOf("day"), dayjs()],
                        },
                        {
                          label: "Last 30 days",
                          value: [dayjs().subtract(29, "day").startOf("day"), dayjs()],
                        },
                        {
                          label: "Last 12 months",
                          value: [dayjs().subtract(12, "month"), dayjs()],
                        },
                      ]}
                      allowClear={false}
                      format="DD/MM/YYYY"
                      size="large"
                      className="!w-full"
                    />
                    <p className="mt-3 text-center text-xs text-gray-400">
                      {selectedRangeLabel} · {selectedRangeDays} days
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePresetSelect("custom")}
                    className="group flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200 text-blue-500 group-hover:border-blue-200 transition-colors">
                        <FaCalendarAlt className="text-sm" />
                      </span>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-gray-800">
                          {selectedRangeLabel}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {selectedRangeDays} days selected
                        </div>
                      </div>
                    </div>
                    <FaChevronRight className="text-xs text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Section: Export Format + Button ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <SectionHeader
                  icon={<FaFileExport className="w-4 h-4 text-gray-400" />}
                  title="Export Format"
                  right={isReady && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Ready
                    </span>
                  )}
                />

                {/* Format list */}
                <div className="grid grid-cols-1 gap-2.5">
                  {exportFormats.map((fmt) => (
                    <label
                      key={fmt.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedFormat === fmt.key
                          ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                          : 'border-gray-100 bg-gray-50/40 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={fmt.key}
                        checked={selectedFormat === fmt.key}
                        onChange={() => setSelectedFormat(fmt.key)}
                        className="mt-2 accent-blue-600"
                      />
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${fmt.iconClass}`}>
                        <fmt.Icon className="text-sm" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${
                          selectedFormat === fmt.key ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          {fmt.label}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{fmt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Export button */}
                <Button
                  primary
                  loading={loadingExport}
                  disabled={!selectedOrgUnit || !selectedMapping}
                  onClick={handleExport}
                  className="!mt-5 !w-full !h-11 !text-sm !font-semibold"
                >
                  {loadingExport ? 'Processing...' : 'Export Data'}
                </Button>

                {!isReady && (
                  <div className="mt-3 text-center">
                    <span className="text-[11px] text-gray-400">
                      {!selectedMapping ? 'Select a mapping' : 'Select an organisation unit'} to enable export
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Section: Export History ══ */}
      <div className="mt-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3">
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 hover:bg-gray-50 transition-all duration-200 group border border-transparent hover:border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                  <FaHistory className="text-xs text-gray-500" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-gray-700">Export History</span>
                  <p className="text-[11px] text-gray-400 mt-0.5">View and manage past exports</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                  {exportHistory.length}
                </span>
                <FaChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Export History Modal ── */}
      <Modal
        title={
          <div className="flex items-center gap-2.5">
            <FaHistory className="text-gray-500" />
            <span className="text-base font-semibold text-gray-800">Export History</span>
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {exportHistory.length}
            </span>
          </div>
        }
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={
          <div className="flex items-center justify-between px-1">
            <div className="text-[11px] text-gray-400">
              {exportHistory.length > 0
                ? `${exportHistory.length} export${exportHistory.length > 1 ? 's' : ''} recorded`
                : 'No exports recorded yet'}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadHistoryCSV}
                disabled={exportHistory.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FaDownload className="text-[10px]" />
                Download CSV
              </button>
              <button
                onClick={clearHistory}
                disabled={exportHistory.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FaTrashAlt className="text-[10px]" />
                Clear all
              </button>
            </div>
          </div>
        }
        width={640}
        styles={{ body: { padding: 0, maxHeight: 420, overflow: 'auto' } }}
      >
        {exportHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <FaHistory className="text-3xl text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No exports yet</p>
            <p className="text-[11px] text-gray-300 mt-1">Perform an export to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {exportHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group/item"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                      {entry.format}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[220px]">
                      {entry.mappingName}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-auto">
                      {entry.rowCount} rows
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    {entry.dateRange && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-[11px] text-gray-400 truncate max-w-[180px]">
                          {entry.dateRange}
                        </span>
                      </>
                    )}
                    {entry.programName && entry.programName !== 'Unknown' && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                          {entry.programName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="ml-3 shrink-0 rounded-lg p-2 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/item:opacity-100"
                  title="Remove entry"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataExport;
