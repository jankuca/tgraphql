import { generateQueryString } from '../generators/query-generator'
import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { QueryResult } from '../types/QueryResult.type'

export function useQuery<Q extends AnyObjectQueryType>(queryType: Q): { data: QueryResult<Q> } {
  const gql = generateQueryString(queryType, 'query')
  console.log(gql)
  return { data: {} } as any
}
