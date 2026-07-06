export const API_FIELDS_KEYS = {
  TRACKED_ENTITIES: 'trackedEntitiesFields',
  EVENTS: 'eventsFields',
}

export const DEFAULT_TRACKED_ENTITIES_FIELDS =
  'trackedEntity,trackedEntityType,orgUnit,updatedAt,attributes[attribute,value],enrollments[enrollment,program,orgUnit,enrolledAt,createdAt,events[event,occurredAt,program,programStage,enrollment,trackedEntity,orgUnit,dataValues[dataElement,value]]]'

export const DEFAULT_EVENTS_FIELDS =
  'event,occurredAt,program,programStage,enrollment,trackedEntity,orgUnit,dataValues[dataElement,value]'

export const DEFAULT_API_FIELDS = {
  [API_FIELDS_KEYS.TRACKED_ENTITIES]: DEFAULT_TRACKED_ENTITIES_FIELDS,
  [API_FIELDS_KEYS.EVENTS]: DEFAULT_EVENTS_FIELDS,
}

export const isOutdatedTrackedEntitiesFields = (value) =>
  typeof value !== 'string' ||
  !value.includes('enrollments[') ||
  !value.includes('events[') ||
  !value.includes('program')
