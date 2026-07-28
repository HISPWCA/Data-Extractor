import React, { useEffect, useState } from 'react'
import { useConfig } from '@dhis2/app-runtime'
import { Button, ButtonStrip, TextAreaField } from '@dhis2/ui'
import useLoadApiFields from '../../hooks/useLoadApiFields'
import useApiFieldsMutation from '../../hooks/useApiFieldsMutation'
import useShowAlerts from '../../hooks/useShowAlerts'
import Method from '../../utils/app.methods'
import {
  API_FIELDS_KEYS,
  DEFAULT_API_FIELDS,
} from '../../utils/apiFields.defaults'

const ApiFieldsConfig = () => {
  const config = useConfig()
  const { show, hide } = useShowAlerts()
  const {
    trackedEntitiesFields,
    eventsFields,
    loading,
    refetch,
  } = useLoadApiFields(config.appName)

  const { mutate: saveTrackedEntitiesFields, loading: savingTrackedEntitiesFields } =
    useApiFieldsMutation(config.appName, API_FIELDS_KEYS.TRACKED_ENTITIES, Method.PUT)

  const { mutate: saveEventsFields, loading: savingEventsFields } =
    useApiFieldsMutation(config.appName, API_FIELDS_KEYS.EVENTS, Method.PUT)

  const [trackedEntitiesFieldsValue, setTrackedEntitiesFieldsValue] = useState('')
  const [eventsFieldsValue, setEventsFieldsValue] = useState('')

  useEffect(() => {
    if (!loading) {
      setTrackedEntitiesFieldsValue(trackedEntitiesFields)
      setEventsFieldsValue(eventsFields)
    }
  }, [loading, trackedEntitiesFields, eventsFields])

  const handleSave = async () => {
    try {
      await saveTrackedEntitiesFields({ content: trackedEntitiesFieldsValue })
      await saveEventsFields({ content: eventsFieldsValue })
      await refetch()

      show({
        message: 'API fields saved successfully',
        type: { success: true },
      })
      setTimeout(hide, 1000)
    } catch (error) {
      show({
        message: 'An error occurred while saving API fields',
        type: { critical: true },
      })
      setTimeout(hide, 1000)
    }
  }

  const handleReset = () => {
    setTrackedEntitiesFieldsValue(
      DEFAULT_API_FIELDS[API_FIELDS_KEYS.TRACKED_ENTITIES]
    )
    setEventsFieldsValue(DEFAULT_API_FIELDS[API_FIELDS_KEYS.EVENTS])
  }

  const saving = savingTrackedEntitiesFields || savingEventsFields

  return (
    <div className="p-4 border-2 m-2 dark:border-gray-700 dark:text-gray-200 dark:bg-dark-800/50">
      <div className="mb-4">
        <TextAreaField
          label="trackedEntitiesFields"
          helpText="Fields parameter for GET /api/tracker/trackedEntities"
          value={trackedEntitiesFieldsValue}
          onChange={({ value }) => setTrackedEntitiesFieldsValue(value)}
          rows={4}
          disabled={loading || saving}
        />
      </div>

      <div className="mb-4">
        <TextAreaField
          label="eventsFields"
          helpText="Fields parameter for GET /api/tracker/events"
          value={eventsFieldsValue}
          onChange={({ value }) => setEventsFieldsValue(value)}
          rows={4}
          disabled={loading || saving}
        />
      </div>

      <ButtonStrip>
        <Button primary onClick={handleSave} loading={saving} disabled={loading}>
          Save
        </Button>
        <Button secondary onClick={handleReset} disabled={loading || saving}>
          Reset to defaults
        </Button>
      </ButtonStrip>
    </div>
  )
}

export default ApiFieldsConfig
