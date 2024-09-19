import React, { useState } from 'react'
import { HashRouter } from 'react-router-dom'
import PageContent from './pages/PageContent'
import Menu from './components/Menu'
import { useConfig } from '@dhis2/app-runtime'
import useLoadMappings from './hooks/useLoadMappings'
import { useOnceEffect } from '@reactuses/core'
import useMappingsMutation from './hooks/useMappingsMutation'
import Method from './utils/app.methods'

import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import './App.css'


const App = () => {
  const config = useConfig()
  const [dataStoreInitialised, setDatastoreInitialised] = useState(false)
  const { mutate: mappingMutate } = useMappingsMutation(config.appName, Method.POST)
  const { error, data } = useLoadMappings(config.appName)

  const initDataStore = async () => {
    await mappingMutate({ content: [] })

    setDatastoreInitialised(true)
  }

  useOnceEffect(() => {
    if (error) {
      initDataStore()
    }
  }, [error])

  useOnceEffect(() => {
    if (data) {
      setDatastoreInitialised(true)
    }
  }, [data])


  return (
    <>
      {!dataStoreInitialised && <></>}

      {dataStoreInitialised && (
        <HashRouter>
          <div className="app">
            <div style={{ display: "flex", height: "100%", width: "100%" }}>
              <Menu />
              <PageContent />
            </div>
          </div>
        </HashRouter>
      )}
    </>
  )
}

export default App
