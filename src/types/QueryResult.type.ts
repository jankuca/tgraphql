import { AnyUnionType } from '../outputs/UnionType'
import { AnyObjectFragmentQueryType, ObjectFragmentQueryTypeOf } from '../queries/ObjectFragmentQueryType'
import { AnyObjectQueryType, ObjectQueryType, UnionSubqueries } from '../queries/ObjectQueryType'
import { ScalarQueryType } from '../queries/ScalarQueryType'
import { AnyUnionQueryType, UnionQueryType } from '../queries/UnionQueryType'
import { AnyQueryType } from './AnyQueryType.type'
import { AnyType } from './AnyType.type'
import { ObjectUnionToObjectIntersection } from './ObjectUnionToObjectIntersection.type'
import { Value } from './Value.type'

// Depth counter to limit recursion depth
// Maps each depth level to the previous level (20→19, 19→18, ..., 1→0, 0→never)
// This prevents excessive type instantiation and TypeScript compiler errors
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

// Pre-compute optional field keys from the resolver schema to avoid repeated conditional checks
type OptionalFieldKeys<ResolverSchema extends Record<string, { optional: boolean }>> = {
  [K in keyof ResolverSchema]: ResolverSchema[K]['optional'] extends true ? K : never
}[keyof ResolverSchema]

// Helper type to add null for optional fields using pre-computed optional keys
type AddNullIfOptional<K extends PropertyKey, OptionalKeys, ResultType> = K extends OptionalKeys
  ? ResultType | null
  : ResultType

// Internal depth-limited QueryResult implementation
type QueryResultImpl<Q extends AnyQueryType, Depth extends number> = [Depth] extends [never]
  ? unknown // Depth limit reached, fall back to unknown
  : Q extends [infer T extends AnyObjectQueryType]
  ? Array<QueryResultImpl<T, Prev[Depth]>>
  : Q extends [infer T extends AnyUnionQueryType]
  ? Array<QueryResultImpl<T, Prev[Depth]>>
  : Q extends UnionQueryType<any, infer SubQ extends UnionSubqueries<AnyUnionType, any>>
  ? QueryResultImpl<SubQ[keyof SubQ], Prev[Depth]>
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
        OptionalFieldKeys<ResolverType['schema']>,
        QueryResultImpl<QueryFieldSchema[K]['query'], Prev[Depth]>
      >
    } & FragmentArrayResultImpl<QueryFragments, Prev[Depth]>
  : Q extends [infer T extends ScalarQueryType<AnyType>]
  ? Array<QueryResultImpl<T, Prev[Depth]>>
  : Q extends ScalarQueryType<infer T>
  ? Value<T>
  : never

// Public QueryResult type with default depth limit of 20
export type QueryResult<Q extends AnyQueryType> = QueryResultImpl<Q, 20>

// Internal depth-limited fragment result implementations
type FragmentResultImpl<F extends AnyObjectFragmentQueryType, Depth extends number> = QueryResultImpl<F['query'], Depth>

type FragmentArrayResultImpl<T, Depth extends number> = T extends Array<infer F extends AnyObjectFragmentQueryType>
  ? ObjectUnionToObjectIntersection<FragmentResultImpl<F, Depth>>
  : never

// Public fragment result types
export type FragmentResult<F extends AnyObjectFragmentQueryType> = FragmentResultImpl<F, 20>

export type FragmentArrayResult<T> = FragmentArrayResultImpl<T, 20>
