import { generateQueryString } from '../generators/query-generator'
import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { QueryResult } from '../types/QueryResult.type'

export function useMutation<M extends AnyObjectQueryType>(mutationType: M): { data: QueryResult<M> } {
  const gql = generateQueryString(mutationType, 'mutation')
  console.log(gql)
  return { data: {} } as any
}
