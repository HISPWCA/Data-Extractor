import { useState } from 'react'
import { Tab, TabBar } from '@dhis2-ui/tab'
import React from 'react'
import MappingUpload from './settings/MappingUpload'

const DEFAULT_TAB = 'mappings-management'

const Settings = () => {
  const [selectedTab, setSelectedTab] = useState(DEFAULT_TAB)

  return (
    <div>
      <TabBar>
        <Tab onClick={() => setSelectedTab(DEFAULT_TAB)}>
          Mappings Management
        </Tab>
      </TabBar>

      {selectedTab === DEFAULT_TAB && (
        <MappingUpload />
      )}
    </div>
  )
}

export default Settings
