import { enumType, generateSchemaString, inputType, objectType, SchemaResolvers, unionType } from '../src'

const CatchupAccessLevelEnum = enumType('CatchupAccessLevelEnum', 'owner', 'participant', 'viewer', 'denied')

const User = objectType('User').field('id', 'ID').field('name', 'String').field('joined_at', 'String')

const PseudoUser = objectType('PseudoUser').field('id', 'ID').field('name', 'String').field('origin_user', User)

const AnyUser = unionType('AnyUser', User, PseudoUser)

const Attendee = objectType('Attendee')
  .field('id', 'ID')
  .field('user', AnyUser)
  .optionalField('maybe_user', AnyUser)
  .field('access_level', CatchupAccessLevelEnum)
  .optionalField('maybe_access_level', CatchupAccessLevelEnum)

const Catchup = objectType('Catchup')
  .field('id', 'ID')
  .optionalField('name', 'String')
  .optionalField('author', User)
  .listField('attendees', [Attendee])

export const Query = objectType('Query')
  .listField('recentCatchups', [Catchup])
  .listParamField(
    'searchCatchups',
    (params) => params.field('limit', 'Int').optionalField('page', 'Int', 1).optionalField('name', 'String', ''),
    [Catchup]
  )

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

type CatchupModel = { 'id': string; 'name': string | null }
type AttendeeModel = {
  'id': string
  'catchup_id': string
  'user_id': string
  'access_level': 'owner' | 'participant' | 'viewer'
}
type UserModel = { 'id': string; 'name': string }

function listRecentCatchups(params?: { limit?: number }) {
  const catchupModels: Array<CatchupModel> = [{ 'id': 'c1', 'name': 'Catchup 1' }]
  const attendeeModels: Array<Omit<AttendeeModel, 'catchup_id'> & { 'user_name': UserModel['name'] }> = [
    { 'id': 'a1', 'user_id': 'u1', 'access_level': 'owner', 'user_name': 'User 1' },
    { 'id': 'a2', 'user_id': 'u2', 'access_level': 'viewer', 'user_name': 'User 2' },
  ]

  const authorAttendee = attendeeModels.find((attendeeModel) => attendeeModel['access_level'] === 'owner')

  return catchupModels
    .map((catchupModel) => ({
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
    }))
    .slice(0, params?.limit ?? Infinity)
}

export function createResolvers(): SchemaResolvers<typeof Query, typeof Mutation, typeof Subscription> {
  return {
    Query: {
      recentCatchups: listRecentCatchups,
      searchCatchups: listRecentCatchups,
    },
    Mutation: {
      increase: () => 1,
      increaseBy: (params) => 2 + params.by,
      addCatchup: () => listRecentCatchups()[0],
      addCatchupAttendee: () => listRecentCatchups()[0]['attendees'][0],
    },
    Subscription: {
      notification: () => ({ id: 'notification-id', message: 'Hello World!' }),
      notifications: (params) => [{ id: 'notification-id', message: 'Hello World!' }],
    },
  }
}

console.log(generateSchemaString(Query))
