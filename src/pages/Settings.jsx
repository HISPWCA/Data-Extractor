import { useState } from 'react'
import { Tab, TabBar } from '@dhis2-ui/tab'
import React from 'react'
import MappingUpload from './settings/MappingUpload'
import ApiFieldsConfig from './settings/ApiFieldsConfig'

const MAPPINGS_TAB = 'mappings-management'
const API_FIELDS_TAB = 'api-fields'

const Settings = () => {
  const [selectedTab, setSelectedTab] = useState(MAPPINGS_TAB)

  return (
    <div>
      <TabBar className='bg-slate-200'>
        <Tab
          selected={selectedTab === MAPPINGS_TAB}
          onClick={() => setSelectedTab(MAPPINGS_TAB)}
        >
          Mappings Management
        </Tab>
        <Tab
          selected={selectedTab === API_FIELDS_TAB}
          onClick={() => setSelectedTab(API_FIELDS_TAB)}
        >
          API Fields
        </Tab>
      </TabBar>

      {selectedTab === MAPPINGS_TAB && (
        <MappingUpload />
      )}

      {selectedTab === API_FIELDS_TAB && (
        <ApiFieldsConfig />
      )}
    </div>
  )
}

export default Settings
