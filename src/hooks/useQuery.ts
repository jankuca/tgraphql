import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { QueryResult } from '../types/QueryResult.type'
import { QueryVariables } from '../types/QueryVariables.type'

type OptionalKeys<T extends object> = { [P in keyof T]: {} extends Pick<T, P> ? P : never }[keyof T]

export function useQuery<
  Q extends AnyObjectQueryType,
  Variables extends QueryVariables<Q>,
  QueryParameters extends [Exclude<keyof Variables, OptionalKeys<Variables>>] extends [never]
    ? { variables?: Variables }
    : { variables: Variables }
>(
  queryType: Q,
  ...args: [Exclude<keyof Variables, OptionalKeys<Variables>>] extends [never]
    ? [QueryParameters] | []
    : [QueryParameters]
): { data: QueryResult<Q> } {
  const gql = String(queryType)
  console.log(gql, ...args)
  return { data: {} } as any
}
