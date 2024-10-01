import React, { useState } from 'react';

import { format } from 'date-fns';
import { FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

import { useConfig } from '@dhis2/app-runtime';
import {
  Button,
  ButtonStrip,
  InputField,
  Modal,
  ModalActions,
  ModalContent,
  ModalTitle,
  SingleSelect,
  SingleSelectOption,
  Table,
  TableBody,
  TableCell,
  TableCellHead,
  TableHead,
  TableRow,
  TableRowHead,
  Tooltip,
} from '@dhis2/ui';

import useLoadMappings from '../../hooks/useLoadMappings';
import useLoadPrograms from '../../hooks/useLoadPrograms';
import useMappingsMutation from '../../hooks/useMappingsMutation';
import useShowAlerts from '../../hooks/useShowAlerts';
import Method from '../../utils/app.methods';


const MappingUpload = () => {
  const config = useConfig()
  const { show, hide } = useShowAlerts()
  const { programs } = useLoadPrograms()
  const { mutate, loading: processing } = useMappingsMutation(config.appName, Method.PUT)
  const { data, loading, refetch } = useLoadMappings(config.appName)

  const [openDeletionPopover, setOpenDeletionPopover] = useState(false)
  const [file, setFile] = useState(null)
  const [mappingTab, setMappingTab] = useState('')
  const [optionsTab, setOptionsTab] = useState('')
  const [sheetNames, setSheetNames] = useState([])
  const [mappingName, setMappingName] = useState('')
  const [selectedProgram, setSelectedProgram] = useState("");

  const initFields = () => {
    setSelectedProgram('')
    setMappingName('')
    setOptionsTab('')
    setMappingTab('')
    setFile(null)
    setSheetNames([])
  }

  const proceed = () => {
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const workbook = XLSX.read(event.target.result, { type: 'binary' })

        const optionsSheetName = workbook.SheetNames[workbook.SheetNames.indexOf(optionsTab)]
        const optionsSheet = workbook.Sheets[optionsSheetName]
        const optionsData = XLSX.utils.sheet_to_json(optionsSheet, { header: 1 })

        const options = optionsData.filter((_, index) => index !== 0).map(row => {
          const currentRow = {}

          for (let j = 0; j < row.length; j++) {
            if (j === 0) {
              currentRow['EMPRESS Field'] = row[j]
            }
            if (j === 1) {
              currentRow['D2 Field'] = row[j]
            }
            if (j === 2) {
              currentRow['EMPRESS Code'] = row[j]
            }
            if (j === 3) {
              currentRow['D2 Name'] = row[j]
            }
            if (j === 4) {
              currentRow['D2 Code'] = row[j]
            }
            if (j === 5) {
              currentRow['D2 UID'] = row[j]
            }
          }

          return currentRow
        })

        const mappingsSheetName = workbook.SheetNames[workbook.SheetNames.indexOf(mappingTab)]
        const mappingsSheet = workbook.Sheets[mappingsSheetName]
        const mappingsData = XLSX.utils.sheet_to_json(mappingsSheet, { header: 1 })

        const mappings = mappingsData.filter((_, index) => index !== 0).map(row => {
          const currentRow = {}

          for (let j = 0; j < row.length; j++) {
            if (j === 0) {
              currentRow['EMPRESS Field'] = row[j]
            }
            if (j === 1) {
              currentRow['D2 Field'] = row[j]
            }
            if (j === 2) {
              currentRow['D2 STAGE'] = row[j]
            }
            if (j === 3) {
              currentRow['Formula'] = row[j]
            }
            if (j === 4) {
              currentRow['Field'] = row[j]
            }
          }

          return currentRow
        })

        const content = [...data.mappings, {
          id: uuidv4(),
          options,
          mappings,
          name: mappingName,
          program: programs.find(program => program.id === selectedProgram),
          createdAt: new Date(),
        }]

        await mutate({ content })
        await refetch()

        initFields()

        show({
          message: "File imported successfully",
          type: { success: true },
        });
        setTimeout(hide, 1000);
      }

      reader.readAsBinaryString(file)

    } catch (error) {
      show({
        message: "An error occured. Please refresh the page and restart !",
        type: { critical: true },
      });

      setTimeout(hide, 1000);
    }
  }

  const handleFileUpload = (e) => {
    const currentFile = e.target.files[0]

    const reader = new FileReader()
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: 'binary' })

      setSheetNames(workbook.SheetNames.filter(sheetname => sheetname !== 'hiddenWs'))
    }

    setFile(currentFile)
    reader.readAsBinaryString(currentFile)
  }

  const confirmDeletion = async id => {
    await mutate({ content: data?.mappings?.filter(mapping => mapping.id !== id) })
    await refetch()

    setOpenDeletionPopover(false)
    initFields()

    show({
      message: "Mapping removed successfully",
      type: { success: true },
    });
    setTimeout(hide, 1000);
  }

  const handleTemplateDownload = () => {
    const link = document.createElement('a')

    link.rel = 'noopener noreferrer'
    link.href = `${config.systemInfo.contextPath}/api/apps/${config.appName}/template.xlsx`.replace(' ','-').toLowerCase()

    link.click()
  }

  return (
    <div>
      <div className="grid grid-cols-5 grid-rows-1 gap-4">
        <div className='border-2 rounded p-2'>
          <label for="uploadFile1"
            className="bg-white text-black text-base rounded w-80- w-70 h-52 flex flex-col items-center justify-center cursor-pointer border-2 border-gray-300 border-dashed mx-auto font-[sans-serif]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 mb-2 fill-black" viewBox="0 0 32 32">
              <path
                d="M23.75 11.044a7.99 7.99 0 0 0-15.5-.009A8 8 0 0 0 9 27h3a1 1 0 0 0 0-2H9a6 6 0 0 1-.035-12 1.038 1.038 0 0 0 1.1-.854 5.991 5.991 0 0 1 11.862 0A1.08 1.08 0 0 0 23 13a6 6 0 0 1 0 12h-3a1 1 0 0 0 0 2h3a8 8 0 0 0 .75-15.956z"
                data-original="#000000" />
              <path
                d="M20.293 19.707a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 1.414 1.414L15 16.414V29a1 1 0 0 0 2 0V16.414z"
                data-original="#000000" />
            </svg>
            Upload file
            <input type="file" id='uploadFile1' className="hidden" accept='.xlsx' onChange={handleFileUpload} />
            <p className="text-xs text-gray-400 mt-2">Only Excel Spreadsheets are Allowed</p>
          </label>

          {sheetNames && sheetNames.length > 0 && (
            <div className='my-1 flex flex-col'>
              <div className='p-1 border w-full mt-[10px]'>
                <InputField onChange={({ value }) => setMappingName(value)} value={mappingName} className='w-full' label='Mapping Name' />
              </div>

              <div className='p-1 border w-full mt-[10px]'>
                <div>
                  Mapping Tab
                </div>
                <SingleSelect filterable clearable clearText="Clear" className="select" label="Select Mappings Tab" selected={mappingTab} onChange={({ selected }) => setMappingTab(selected)}>
                  {sheetNames.filter(sheetName => optionsTab ? sheetName !== optionsTab : sheetName).map(sheetName => (
                    <SingleSelectOption key={uuidv4()} label={sheetName} value={sheetName} />
                  ))}
                </SingleSelect>
              </div>

              <div className='p-1 border w-full mt-[10px]'>
                <div>
                  Option Tab
                </div>
                <SingleSelect filterable clearable clearText="Clear" className="select" label="Select Options Tab" selected={optionsTab} onChange={({ selected }) => setOptionsTab(selected)}>
                  {sheetNames.filter(sheetname => mappingTab ? sheetname !== mappingTab : sheetname).map(sheetName => (
                    <SingleSelectOption key={uuidv4()} label={sheetName} value={sheetName} />
                  ))}
                </SingleSelect>
              </div>

              {programs && programs.length > 0 && (
                <div className="p-1 border w-full mt-[10px]">
                  <div>Select a Program</div>
                  {/* <SingleSelectField */}
                  <SingleSelect
                    filterable
                    selected={selectedProgram}
                    onChange={({ selected }) => setSelectedProgram(selected)}
                  >
                    {programs.map((program) => (
                      <SingleSelectOption
                        key={program.id}
                        value={program.id}
                        label={program.name}
                      />
                    ))}
                  </SingleSelect>
                </div>
              )}

              <div className='mt-[20px]'>
                <Button primary disabled={!optionsTab || !mappingTab || !mappingName || !selectedProgram} onClick={proceed} loading={loading || processing}>
                  {(loading || processing) ? 'Processing' : 'Proceed'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4">
          <div className='mt-2 bg-slate-200- rounded border-2 ml-2'>
            <div className='flex justify-end m-1'>
              <Tooltip content="Download Mapping Template" >
                <button onClick={handleTemplateDownload}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center">
                  <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" /></svg>
                  <span>Template</span>
                </button>
              </Tooltip>
            </div>

            <Table>
              <TableHead>
                <TableRowHead>
                  <TableCellHead>
                    Mapping Name
                  </TableCellHead>
                  <TableCellHead className='w-[200px]'>
                    Creation Date
                  </TableCellHead>
                  <TableCellHead className='w-[100px]'>
                    Actions
                  </TableCellHead>
                </TableRowHead>
              </TableHead>
              <TableBody>
                {data && data?.mappings && data?.mappings.map(mapping => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      {mapping.name}
                    </TableCell>
                    <TableCell>
                      {format(mapping.createdAt, 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <Tooltip content={`Delete ${mapping.name}`} >
                        <FaTrash className='cursor-pointer text-red-800' onClick={() => setOpenDeletionPopover(true)} />
                      </Tooltip>

                      {mapping && openDeletionPopover && (
                        <Modal onClose={() => processing ? setOpenDeletionPopover(true) : setOpenDeletionPopover(false)} small position="middle">

                          <ModalTitle className='text-red-800'>
                            Confirmation Required !
                          </ModalTitle>
                          <ModalContent>
                            <div className='block'>
                              Please do you really want to remove <strong className='text-red-800'>{mapping.name}</strong> ?
                            </div>

                            <div className='block mt-1'>
                              This action could not be cancelled if you confirm it !
                            </div>
                          </ModalContent>
                          <ModalActions>
                            <ButtonStrip end>
                              <Button onClick={() => setOpenDeletionPopover(false)} secondary disabled={processing}>
                                Cancel
                              </Button>
                              <Button destructive onClick={() => confirmDeletion(mapping.id)} loading={processing}>
                                Confirm
                              </Button>
                            </ButtonStrip>
                          </ModalActions>
                        </Modal>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MappingUpload
