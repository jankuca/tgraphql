import { AnyUnionType } from '../outputs/UnionType'
import { AnyObjectFragmentQueryType, ObjectFragmentQueryTypeOf } from '../queries/ObjectFragmentQueryType'
import { AnyObjectQueryType, ObjectQueryType, UnionSubqueries } from '../queries/ObjectQueryType'
import { ScalarQueryType } from '../queries/ScalarQueryType'
import { AnyUnionQueryType, UnionQueryType } from '../queries/UnionQueryType'
import { AnyQueryType } from './AnyQueryType.type'
import { AnyType } from './AnyType.type'
import { ObjectUnionToObjectIntersection } from './ObjectUnionToObjectIntersection.type'
import { Value } from './Value.type'

// Helper type to add null for optional fields without deep conditional checking
type AddNullIfOptional<
  K extends PropertyKey,
  ResolverSchema extends Record<string, { optional: boolean }>,
  ResultType
> = K extends keyof ResolverSchema
  ? ResolverSchema[K]['optional'] extends true
    ? ResultType | null
    : ResultType
  : ResultType

export type QueryResult<Q extends AnyQueryType> = Q extends [infer T extends AnyObjectQueryType]
  ? Array<QueryResult<T>>
  : Q extends [infer T extends AnyUnionQueryType]
  ? Array<QueryResult<T>>
  : Q extends UnionQueryType<any, infer SubQ extends UnionSubqueries<AnyUnionType, any>>
  ? QueryResult<SubQ[keyof SubQ]>
  : Q extends ObjectQueryType<
      infer ResolverType,
      any,
      infer QueryFieldSchema,
      infer QueryFragments extends [...ObjectFragmentQueryTypeOf<any>[]],
      any,
      any,
      any,
      any,
      any,
      any
    >
  ? {
      [K in keyof QueryFieldSchema]: AddNullIfOptional<
        K,
        ResolverType['schema'],
        QueryResult<QueryFieldSchema[K]['query']>
      >
    } & FragmentArrayResult<QueryFragments>
  : Q extends [infer T extends ScalarQueryType<AnyType>]
  ? Array<QueryResult<T>>
  : Q extends ScalarQueryType<infer T>
  ? Value<T>
  : never

export type FragmentResult<F extends AnyObjectFragmentQueryType> = QueryResult<F['query']>

export type FragmentArrayResult<T> = T extends Array<infer F extends AnyObjectFragmentQueryType>
  ? ObjectUnionToObjectIntersection<FragmentResult<F>>
  : never
