import { AnyUnionType } from '../outputs/UnionType'
import { AnyObjectQueryType, ObjectQueryType, UnionSubqueries } from '../queries/ObjectQueryType'
import { ScalarQueryType } from '../queries/ScalarQueryType'
import { AnyUnionQueryType, UnionQueryType } from '../queries/UnionQueryType'
import { AnyQueryType } from './AnyQueryType.type'
import { AnyType } from './AnyType.type'
import { Value } from './Value.type'

export type QueryResult<Q extends AnyQueryType> = Q extends [infer T extends AnyObjectQueryType]
  ? Array<QueryResult<T>>
  : Q extends [infer T extends AnyUnionQueryType]
  ? Array<QueryResult<T>>
  : Q extends UnionQueryType<any, infer SubQ extends UnionSubqueries<AnyUnionType, any>>
  ? QueryResult<SubQ[keyof SubQ]>
  : Q extends ObjectQueryType<infer ResolverType, any, infer QuerySchema, any, any, any, any, any, any>
  ? {
      [K in keyof QuerySchema]:
        | QueryResult<QuerySchema[K]['query']>
        | (K extends keyof ResolverType['schema']
            ? ResolverType['schema'][K]['optional'] extends true
              ? null
              : never
            : never)
    }
  : Q extends [infer T extends ScalarQueryType<AnyType>]
  ? Array<QueryResult<T>>
  : Q extends ScalarQueryType<infer T>
  ? Value<T>
  : never
