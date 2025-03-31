/* eslint react-hooks/rules-of-hooks: 0 */

import { mutationType, queryType, subscriptionType, useMutation, useQuery, useSubscription, variable } from '../src'
import { fragmentType } from '../src/queries/ObjectFragmentQueryType'
import { QueryVariables } from '../src/types/QueryVariables.type'
import { AddAttendeeBatchInput, AddAttendeeInput, Attendee, Catchup, Mutation, Query, Subscription } from './server'

try {
  const ListCatchups = queryType(Query)
    .optionalVariable('limit', 'Int', 2)
    .listParamField('recentCatchups', { 'limit': variable('limit') }, (catchup) =>
      catchup
        .field('id')
        .field('name')
        .field('author', (author) => author.field('name'))
        .field('attendees', (attendee) =>
          attendee
            .field('access_level')
            .field('user', {
              'User': (user) => user.field('id').field('name').field('joined_at'),
              'PseudoUser': (user) =>
                user
                  .field('id')
                  .field('name')
                  .field('origin_user', (originUser) => originUser.field('id').field('name')),
            })
            .field('maybe_access_level')
            .field('maybe_user', {
              'User': (user) => user.field('id').field('name').field('joined_at'),
              'PseudoUser': (user) =>
                user
                  .field('id')
                  .field('name')
                  .field('origin_user', (originUser) => originUser.field('id').field('name')),
            })
        )
    )

  useQuery(ListCatchups, { variables: { 'limit': 1 } }).data
  useQuery(ListCatchups).data
  useQuery(ListCatchups, { variables: {} }).data
} catch (err) {
  console.error('err:', err)
}

try {
  const CatchupFragment = fragmentType(Catchup, 'CatchupFragment')
    .field('id')
    .field('name')
    .field('author', (author) => author.field('name'))

  const AttendeeFragment = fragmentType(Attendee, 'AttendeeFragment').field('access_level')

  const CatchupAttendeeListFragment = fragmentType(Catchup, 'CatchupAttendeeListFragment').field(
    'attendees',
    (attendee) => attendee.field('access_level').fragment(AttendeeFragment)
  )

  const ListCatchupsWithFragments = queryType(Query).listParamField('recentCatchups', {}, (catchup) =>
    catchup.field('end_date').fragment(CatchupFragment).fragment(CatchupAttendeeListFragment)
  )

  useQuery(ListCatchupsWithFragments).data.recentCatchups[0].name
} catch (err) {
  console.error('err:', err)
}

try {
  const SearchCatchups = queryType(Query)
    .variable('s', 'String')
    .optionalVariable('lim', 'Int', 5)
    .listParamField('searchCatchups', { 'query': '', 'name': variable('s'), 'limit': variable('lim') }, (catchup) =>
      catchup.field('id').field('name')
    )

  const variables: QueryVariables<typeof SearchCatchups> = { 's': 'test', 'lim': 10 }

  useQuery(SearchCatchups, { variables }).data
} catch (err) {
  console.error('err:', err)
}

const AddCatchupMutation = mutationType(Mutation)
  .optionalVariable('name', 'String', 'Jan')
  .variable('attendees', AddAttendeeBatchInput)
  .paramField('addCatchup', { 'name': variable('name'), 'attendees': variable('attendees') }, (catchup) =>
    catchup.field('id').field('name')
  )
useMutation(AddCatchupMutation).data

const AddCatchupAttendeeMutation = mutationType(Mutation)
  .variable('catchup_id', 'ID')
  .variable('attendee', AddAttendeeInput)
  .paramField(
    'addCatchupAttendee',
    { 'catchup_id': variable('catchup_id'), 'attendee': variable('attendee') },
    (attendee) =>
      attendee.field('id').field('user', {
        'User': (user) => user.field('id').field('name'),
        'PseudoUser': (user) => user.field('id').field('name'),
      })
  )
useMutation(AddCatchupAttendeeMutation).data

const Increase = mutationType(Mutation).field('increase')
useMutation(Increase).data

const IncreaseBy = mutationType(Mutation).scalarParamField('increaseBy', { 'by': 2 })
useMutation(IncreaseBy).data

const NotificationSubscription = subscriptionType(Subscription).field('notification', (notification) =>
  notification.field('message')
)
useSubscription(NotificationSubscription).data

const NotificationListSubscription = subscriptionType(Subscription).listParamField(
  'notifications',
  { 'limit': 2 },
  (notification) => notification.field('message')
)
useSubscription(NotificationListSubscription).data
