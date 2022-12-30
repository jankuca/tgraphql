import { generateQueryString } from '../generators/query-generator'
import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { QueryResult } from '../types/QueryResult.type'

export function useSubscription<M extends AnyObjectQueryType>(subscriptionType: M): { data: QueryResult<M> } {
  const gql = generateQueryString(subscriptionType, 'subscription')
  console.log(gql)
  return { data: {} } as any
}
