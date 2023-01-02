import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { QueryResult } from '../types/QueryResult.type'
import { QueryVariables } from '../types/QueryVariables.type'

export function useQuery<
  Q extends AnyObjectQueryType,
  Variables extends QueryVariables<Q>,
  QueryParameters extends {
    variables: Variables
  }
>(queryType: Q, params: QueryParameters): { data: QueryResult<Q> } {
  const gql = String(queryType)
  console.log(gql, params)
  return { data: {} } as any
}
