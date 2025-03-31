import {
  enumType,
  generateSchemaString,
  inputType,
  mergeObjectTypes,
  objectType,
  scalarType,
  SchemaResolvers,
  schemaType,
  unionType,
} from '../src'
import { SchemaObjectTypes } from '../src/resolvers/SchemaObjectTypes.type'

const DateString = scalarType('Date', 'String')

const CatchupAccessLevelEnum = enumType('CatchupAccessLevelEnum', 'owner', 'participant', 'viewer', 'denied')

const User = objectType('User').field('id', 'ID').field('name', 'String').field('joined_at', DateString)

const PseudoUser = objectType('PseudoUser').field('id', 'ID').field('name', 'String').field('origin_user', User)

const AnyUser = unionType('AnyUser', User, PseudoUser)

export const Attendee = objectType('Attendee')
  .field('id', 'ID')
  .field('user', AnyUser)
  .optionalField('maybe_user', AnyUser)
  .field('access_level', CatchupAccessLevelEnum)
  .optionalField('maybe_access_level', CatchupAccessLevelEnum)

const Photo = objectType('Photo').field('id', 'ID').field('url', 'String')

const Location = objectType('Location').field('name', 'String').field('founded_at', DateString)

export const Catchup = objectType('Catchup')
  .field('id', 'ID')
  .optionalField('name', 'String')
  .optionalField('author', User)
  .field('start_date', DateString)
  .optionalField('end_date', DateString)
  .field('location', Location)
  .listField('attendees', [Attendee])
  .listField('photos', [Photo])

const Query1 = objectType('Query').listField('recentCatchups', [Catchup])

const Query2 = objectType('Query').listParamField(
  'searchCatchups',
  (params) =>
    params
      .field('query', 'String')
      .field('limit', 'Int')
      .optionalField('page', 'Int', 1)
      .optionalField('name', 'String', ''),
  [Catchup]
)

export const Query = mergeObjectTypes(Query1, Query2)

export const AddAttendeeInput = inputType('AddAttendeeInput')
  .field('access_level', CatchupAccessLevelEnum)
  .field('user_id', 'ID')

export const AddAttendeeBatchInput = inputType('AddAttendeeBatchInput').listField('attendees', [AddAttendeeInput])

export const Mutation = objectType('Mutation')
  .field('increase', 'Int')
  .paramField('increaseBy', (params) => params.field('by', 'Int'), 'Int')
  .paramField(
    'addCatchup',
    (params) => params.optionalField('name', 'String', 'Yannis').field('attendees', AddAttendeeBatchInput),
    Catchup
  )
  .paramField(
    'addCatchupAttendee',
    (params) => params.field('catchup_id', 'ID').field('attendee', AddAttendeeInput),
    Attendee
  )

const Notification = objectType('Notification').field('id', 'ID').field('message', 'String')

export const Subscription = objectType('Subscription')
  .field('notification', Notification)
  .listParamField('notifications', (params) => params.optionalField('limit', 'Int', 3), [Notification])

const Schema = schemaType().query(Query).mutation(Mutation).subscription(Subscription)

type CatchupModel = {
  'id': string
  'name': string | null
  'start_date': Date
  'end_date'?: Date | null
  'location': { 'name': string }
}
type AttendeeModel = {
  'id': string
  'catchup_id': string
  'user_id': string
  'access_level': 'owner' | 'participant' | 'viewer'
}
type UserModel = { 'id': string; 'name': string }

function listRecentCatchups(params?: { limit?: number }) {
  const catchupModels: Array<CatchupModel> = [
    { 'id': 'c1', 'name': 'Catchup 1', 'start_date': new Date('2024-10-10'), 'location': { 'name': 'Place' } },
  ]
  const attendeeModels: Array<Omit<AttendeeModel, 'catchup_id'> & { 'user_name': UserModel['name'] }> = [
    { 'id': 'a1', 'user_id': 'u1', 'access_level': 'owner', 'user_name': 'User 1' },
    { 'id': 'a2', 'user_id': 'u2', 'access_level': 'viewer', 'user_name': 'User 2' },
  ]

  const authorAttendee = attendeeModels.find((attendeeModel) => attendeeModel['access_level'] === 'owner')

  return catchupModels
    .map((catchupModel) => {
      return {
        ...catchupModel,
        'author': authorAttendee
          ? { 'id': authorAttendee['user_id'], 'name': authorAttendee['user_name'], 'joined_at': '2022-10-10' }
          : { 'id': 'author-id', 'name': 'Author', 'joined_at': '2022-10-10' },
        'attendees': attendeeModels.map((attendeeModel) => {
          const { 'user_id': userId, 'user_name': userName, ...attendee } = attendeeModel
          return {
            ...attendee,
            'maybe_user': null,
            'maybe_access_level': null,
            'user': { 'id': userId, 'name': userName, 'joined_at': '2022-10-10' },
          }
        }),
      }
    })
    .slice(0, params?.limit ?? Infinity)
}

type Entities = {
  Catchup: CatchupModel
  User: UserModel
}

type S = SchemaObjectTypes<typeof Schema>
type S_typenames = keyof S

export function createResolvers(): SchemaResolvers<typeof Schema, Entities> {
  return {
    Query: {
      recentCatchups: (_, params) => listRecentCatchups(params),
      searchCatchups: (_, params) => listRecentCatchups(params),
    },
    Mutation: {
      increase: () => 1,
      increaseBy: (_, params) => 2 + params.by,
      addCatchup: () => {
        const catchups = listRecentCatchups()
        if (!catchups[0]) {
          throw new Error('Catchup not found')
        }

        return catchups[0]
      },
      addCatchupAttendee: () => {
        const catchups = listRecentCatchups()
        const attendeess = catchups[0] ? catchups[0]['attendees'] : []
        if (!attendeess[0]) {
          throw new Error('Attendee not added')
        }

        return attendeess[0]
      },
    },
    Subscription: {
      notification: {
        subscribe: async function* () {
          yield { id: 'notification-id', message: 'Hello World!' }
        },
      },
      notifications: {
        subscribe: async function* (_, params) {
          yield [{ id: 'notification-id', message: 'Hello World!' }].slice(0, params.limit ?? Infinity)
        },
      },
    },
    Catchup: {
      start_date: (catchup) => catchup['start_date'].toISOString(),
      end_date: (catchup) => catchup['end_date']?.toISOString() ?? null,
      photos: () => [{ id: 'photo-id', url: 'https://example.com/photo.jpg' }],
      author: () => {
        const attendeeModels: Array<Omit<AttendeeModel, 'catchup_id'> & { 'user_name': UserModel['name'] }> = [
          { 'id': 'a1', 'user_id': 'u1', 'access_level': 'owner', 'user_name': 'User 1' },
          { 'id': 'a2', 'user_id': 'u2', 'access_level': 'viewer', 'user_name': 'User 2' },
        ]

        const authorAttendee = attendeeModels.find((attendeeModel) => attendeeModel['access_level'] === 'owner')

        return authorAttendee
          ? { 'id': authorAttendee['user_id'], 'name': authorAttendee['user_name'], 'joined_at': '2022-10-10' }
          : { 'id': 'author-id', 'name': 'Author', 'joined_at': '2022-10-10' }
      },
      attendees: () => {
        const attendeeModels: Array<Omit<AttendeeModel, 'catchup_id'> & { 'user_name': UserModel['name'] }> = [
          { 'id': 'a1', 'user_id': 'u1', 'access_level': 'owner', 'user_name': 'User 1' },
          { 'id': 'a2', 'user_id': 'u2', 'access_level': 'viewer', 'user_name': 'User 2' },
        ]
        return attendeeModels.map((attendeeModel) => {
          return {
            ...attendeeModel,
            'maybe_user': null,
            'maybe_access_level': null,
            'user': { 'id': 'a', 'name': 'A', 'joined_at': '2022-10-10' },
          }
        })
      },
    },
  }
}

console.log(generateSchemaString(Query))
