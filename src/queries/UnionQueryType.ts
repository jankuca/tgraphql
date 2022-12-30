import { AnyUnionType, UnionTypeNames } from '../outputs/UnionType'
import { AnyObjectQueryType } from './ObjectQueryType'

export class UnionQueryType<
  ResolverType extends AnyUnionType,
  UnionQueries extends Record<UnionTypeNames<ResolverType>, AnyObjectQueryType>
> {
  resolverTypeUnion: ResolverType
  queries: UnionQueries
  constructor(resolverType: ResolverType, queries: UnionQueries) {
    this.resolverTypeUnion = resolverType
    this.queries = queries
  }
}

export type AnyUnionQueryType = UnionQueryType<AnyUnionType, Record<string, AnyObjectQueryType>>
