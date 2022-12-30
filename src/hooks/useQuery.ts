import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { QueryResult } from '../types/QueryResult.type'

export function useQuery<Q extends AnyObjectQueryType>(queryType: Q): { data: QueryResult<Q> } {
  const gql = String(queryType)
  console.log(gql)
  return { data: {} } as any
}
