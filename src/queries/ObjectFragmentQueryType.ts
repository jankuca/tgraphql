import { AnyObjectListType, AnyObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType } from '../outputs/ParamObjectType'
import { AnyUnionListType, AnyUnionType } from '../outputs/UnionType'
import { AnyQueryType } from '../types/AnyQueryType.type'
import { AnyScalarListType, AnyScalarType } from '../types/AnyScalarType.type'
import {
  ObjectListResolvers,
  ObjectResolvers,
  ScalarListResolvers,
  ScalarResolvers,
  UnionListResolvers,
  UnionResolvers,
} from '../types/object-field-resolvers.type'
import { Prettify } from '../types/Prettify.type'
import {
  AnyParamInputType,
  ObjectQueryType,
  ObjectQueryTypeOf,
  UnionSubqueries,
  UnionSubqueryFactories,
  VariableFieldParams,
} from './ObjectQueryType'
import { ScalarQueryType } from './ScalarQueryType'
import { UnionQueryType } from './UnionQueryType'

export type ObjectFragmentQueryTypeOf<
  ResolverType extends AnyObjectType,
  QueryFieldSchema extends Record<
    string,
    { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }
  > = Record<never, any>,
  QueryFragments extends [...ObjectFragmentQueryTypeOf<ResolverType>[]] = any[]
> = ObjectFragmentQueryType<
  ResolverType,
  QueryFieldSchema,
  QueryFragments,
  ScalarResolvers<ResolverType>,
  ScalarListResolvers<ResolverType>,
  ObjectResolvers<ResolverType>,
  ObjectListResolvers<ResolverType>,
  UnionResolvers<ResolverType>,
  UnionListResolvers<ResolverType>
>

export class ObjectFragmentQueryType<
  ResolverType extends AnyObjectType,
  QueryFieldSchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
  QueryFragments extends [...ObjectFragmentQueryTypeOf<ResolverType>[]],
  Fields extends ScalarResolvers<ResolverType>,
  ListFields extends ScalarListResolvers<ResolverType>,
  ObjectFields extends ObjectResolvers<ResolverType>,
  ObjectListFields extends ObjectListResolvers<ResolverType>,
  UnionFields extends UnionResolvers<ResolverType>,
  UnionListFields extends UnionListResolvers<ResolverType>
> {
  // NOTE: We need the resolverType to be spefified directly on the fragment to be able to discriminate.
  private resolverType: ResolverType

  query: ObjectQueryTypeOf<ResolverType, {}, QueryFieldSchema, QueryFragments>
  name: string

  constructor(
    resolverType: ResolverType,
    query: ObjectQueryTypeOf<ResolverType, {}, QueryFieldSchema, QueryFragments>,
    name: string
  ) {
    this.resolverType = resolverType
    this.query = query
    this.name = name
  }

  field<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    SubqueryFragments extends [...ObjectFragmentQueryTypeOf<ObjectListFields[K]['type'][0]>[]],
    ListSubquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], {}, SubquerySchema, SubqueryFragments>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], {}, {}, []>) => ListSubquery
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<QueryFieldSchema & { [key in K]: { query: [ListSubquery]; paramInputs: Record<never, any> } }>,
    QueryFragments
  >

  field<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    SubqueryFragments extends [...ObjectFragmentQueryTypeOf<ObjectFields[K]['type']>[]],
    ObjectSubquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], {}, SubquerySchema, SubqueryFragments>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], {}, {}, []>) => ObjectSubquery
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<QueryFieldSchema & { [key in K]: { query: ObjectSubquery; paramInputs: Record<never, any> } }>,
    QueryFragments
  >

  field<
    K extends Extract<keyof UnionListFields, string>,
    Union extends UnionListFields[K]['type'][0],
    SubqueryFactories extends UnionSubqueryFactories<Union, {}>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<
      QueryFieldSchema & {
        [key in K]: {
          query: [UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>]
          paramInputs: Record<never, any>
        }
      }
    >,
    QueryFragments
  >

  field<
    K extends Extract<keyof UnionFields, string>,
    Union extends UnionFields[K]['type'],
    SubqueryFactories extends UnionSubqueryFactories<Union, {}>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<
      QueryFieldSchema & {
        [key in K]: {
          query: UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>
          paramInputs: Record<never, any>
        }
      }
    >,
    QueryFragments
  >

  field<K extends Extract<keyof ListFields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<
      QueryFieldSchema & {
        [key in K]: { query: [ScalarQueryType<ListFields[K]['type'][0]>]; paramInputs: Record<never, any> }
      }
    >,
    QueryFragments
  >

  field<K extends Extract<keyof Fields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<
      QueryFieldSchema & { [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Record<never, any> } }
    >,
    QueryFragments
  >

  field(key: Extract<keyof ResolverType['schema'], string>, makeSubquery: any): any {
    return new ObjectFragmentQueryType(this.resolverType, this.query.field(key, makeSubquery), this.name)
  }

  scalarParamField<K extends Extract<keyof Fields, string>, Params extends VariableFieldParams<Fields[K], {}>>(
    key: K,
    paramInputs: Params
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<
      QueryFieldSchema & {
        [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Params }
      }
    >,
    QueryFragments
  > {
    return new ObjectFragmentQueryType(
      this.resolverType,
      this.query.scalarParamField<K, Params>(key, paramInputs),
      this.name
    )
  }

  paramField<
    K extends Extract<keyof ObjectFields, string>,
    Params extends VariableFieldParams<ObjectFields[K], {}>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<never, any> }>,
    SubqueryFragments extends [...ObjectFragmentQueryTypeOf<ObjectFields[K]['type']>[]],
    Subquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], {}, SubquerySchema, SubqueryFragments>
  >(
    key: K,
    paramInputs: Params,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], {}, {}, []>) => Subquery
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<QueryFieldSchema & { [key in K]: { query: Subquery; paramInputs: Params } }>,
    QueryFragments
  > {
    return new ObjectFragmentQueryType(
      this.resolverType,
      this.query.paramField<K, Params, SubquerySchema, SubqueryFragments, Subquery>(key, paramInputs, makeSubquery),
      this.name
    )
  }

  listParamField<
    K extends Extract<keyof ObjectListFields, string>,
    Params extends VariableFieldParams<ObjectListFields[K], {}>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<never, any> }>,
    SubqueryFragments extends [...ObjectFragmentQueryTypeOf<ObjectListFields[K]['type'][0]>[]],
    Subquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], {}, SubquerySchema, SubqueryFragments>
  >(
    key: K,
    paramInputs: Params,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], {}, {}, []>) => Subquery
  ): ObjectFragmentQueryTypeOf<
    ResolverType,
    Prettify<QueryFieldSchema & { [key in K]: { query: [Subquery]; paramInputs: Params } }>,
    QueryFragments
  > {
    return new ObjectFragmentQueryType(
      this.resolverType,
      this.query.listParamField<K, Params, SubquerySchema, SubqueryFragments, Subquery>(key, paramInputs, makeSubquery),
      this.name
    )
  }
}

export function fragmentType<ResolverType extends AnyObjectType>(resolverType: ResolverType, name: string) {
  const emptyQuery = new ObjectQueryType('query', resolverType, {}, [], {})

  return new ObjectFragmentQueryType(resolverType, emptyQuery, name)
}

export type AnyObjectFragmentQueryType = ObjectFragmentQueryType<
  AnyObjectType,
  Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
  Array<AnyObjectFragmentQueryType>,
  Record<string, { key: string; type: AnyScalarType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyScalarListType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyObjectType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyObjectListType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyUnionType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyUnionListType; optional: boolean; params: AnyParamObjectType | null }>
>
