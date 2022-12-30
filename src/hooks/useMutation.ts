import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { QueryResult } from '../types/QueryResult.type'

export function useMutation<M extends AnyObjectQueryType>(mutationType: M): { data: QueryResult<M> } {
  const gql = String(mutationType)
  console.log(gql)
  return { data: {} } as any
}
