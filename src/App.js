import React, { useState } from 'react'
import { HashRouter } from 'react-router-dom'
import PageContent from './pages/PageContent'
import Menu from './components/Menu'
import { useConfig } from '@dhis2/app-runtime'
import useLoadMappings from './hooks/useLoadMappings'
import useLoadApiFields from './hooks/useLoadApiFields'
import { useOnceEffect } from '@reactuses/core'
import useMappingsMutation from './hooks/useMappingsMutation'
import useApiFieldsMutation from './hooks/useApiFieldsMutation'
import Method from './utils/app.methods'
import { SidebarProvider } from './utils/SidebarContext'
import {
  API_FIELDS_KEYS,
  DEFAULT_API_FIELDS,
  isOutdatedTrackedEntitiesFields,
} from './utils/apiFields.defaults'

import './App.css'
import './input.css'
import './tailwind.css'


const App = () => {
  const config = useConfig()
  const [dataStoreInitialised, setDatastoreInitialised] = useState(false)
  const { mutate: mappingMutate } = useMappingsMutation(config.appName, Method.POST)
  const { mutate: trackedEntitiesFieldsMutate } = useApiFieldsMutation(
    config.appName,
    API_FIELDS_KEYS.TRACKED_ENTITIES,
    Method.POST
  )
  const { mutate: trackedEntitiesFieldsUpdate } = useApiFieldsMutation(
    config.appName,
    API_FIELDS_KEYS.TRACKED_ENTITIES,
    Method.PUT
  )
  const { mutate: eventsFieldsMutate } = useApiFieldsMutation(
    config.appName,
    API_FIELDS_KEYS.EVENTS,
    Method.POST
  )
  const { error: mappingsError, data: mappingsData } = useLoadMappings(config.appName)
  const {
    trackedEntitiesError,
    eventsError,
    trackedEntitiesFields,
    refetch: refetchApiFields,
  } = useLoadApiFields(config.appName)

  const initDataStore = async () => {
    if (mappingsError) {
      await mappingMutate({ content: [] })
    }

    if (trackedEntitiesError) {
      await trackedEntitiesFieldsMutate({
        content: DEFAULT_API_FIELDS[API_FIELDS_KEYS.TRACKED_ENTITIES],
      })
    } else if (isOutdatedTrackedEntitiesFields(trackedEntitiesFields)) {
      await trackedEntitiesFieldsUpdate({
        content: DEFAULT_API_FIELDS[API_FIELDS_KEYS.TRACKED_ENTITIES],
      })
    }

    if (eventsError) {
      await eventsFieldsMutate({
        content: DEFAULT_API_FIELDS[API_FIELDS_KEYS.EVENTS],
      })
    }

    if (trackedEntitiesError || eventsError || isOutdatedTrackedEntitiesFields(trackedEntitiesFields)) {
      await refetchApiFields()
    }

    setDatastoreInitialised(true)
  }

  useOnceEffect(() => {
    if (mappingsError || trackedEntitiesError || eventsError) {
      initDataStore()
    }
  }, [mappingsError, trackedEntitiesError, eventsError])

  useOnceEffect(() => {
    if (
      mappingsData &&
      !trackedEntitiesError &&
      !eventsError &&
      !isOutdatedTrackedEntitiesFields(trackedEntitiesFields)
    ) {
      setDatastoreInitialised(true)
    }
  }, [mappingsData, trackedEntitiesError, eventsError, trackedEntitiesFields])

  useOnceEffect(() => {
    if (
      mappingsData &&
      !trackedEntitiesError &&
      !eventsError &&
      isOutdatedTrackedEntitiesFields(trackedEntitiesFields)
    ) {
      initDataStore()
    }
  }, [mappingsData, trackedEntitiesError, eventsError, trackedEntitiesFields])


  return (
    <>
      {!dataStoreInitialised && <></>}

      {dataStoreInitialised && (
        <SidebarProvider>
          <HashRouter>
            <div className="app">
              <div style={{ display: "flex", height: "100%", width: "100%" }}>
                <Menu />
                <PageContent />
              </div>
            </div>
          </HashRouter>
        </SidebarProvider>
      )}
    </>
  )
}

export default App
