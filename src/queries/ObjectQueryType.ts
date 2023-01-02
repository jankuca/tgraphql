import { EnumValueType } from '../EnumValueType'
import { generateQueryString } from '../generators/query-generator'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { VariableInput } from '../inputs/VariableInput'
import { AnyObjectListType, AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType, ParamObjectType, ParamValues } from '../outputs/ParamObjectType'
import { AnyUnionListType, AnyUnionType, UnionType, UnionTypeByName, UnionTypeNames } from '../outputs/UnionType'
import { AnyInputValueType } from '../types/AnyInputValueType.type'
import { AnyQueryType } from '../types/AnyQueryType.type'
import { AnyScalarListType, AnyScalarType } from '../types/AnyScalarType.type'
import { InputValue } from '../types/InputValue.type'
import {
  ObjectListResolvers,
  ObjectResolvers,
  ScalarListResolvers,
  ScalarResolvers,
  UnionListResolvers,
  UnionResolvers,
} from '../types/object-field-resolvers.type'
import { ScalarQueryType } from './ScalarQueryType'
import { UnionQueryType } from './UnionQueryType'

export type AnyParamInputType =
  | string
  | number
  | boolean
  | EnumValueType<string>
  | VariableInput<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>

export type VariableDescriptor<T extends { type: AnyInputValueType; optional: boolean }> = {
  type: T['type']
  optional: T['optional']
  defaultValue: true extends T['optional'] ? any : InputValue<T['type']>
}

type VariableValues<T extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>> = {
  [key in keyof T]: InputValue<T[key]['type']>
}

type RequiredParamKeys<P extends AnyParamObjectType> = P extends ParamObjectType<infer T>
  ? {
      [key in keyof T]: T[key]['optional'] extends true ? never : key
    }[keyof T]
  : never

type ParamVariables<
  Param,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>
> = {
  [V in Extract<keyof VariableValues<Variables>, string>]: VariableValues<Variables>[V] extends Param
    ? VariableInput<V>
    : never
}[Extract<keyof VariableValues<Variables>, string>]

type VariableFieldParams<
  Field extends { params: AnyParamObjectType | null },
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>
> = Field['params'] extends AnyParamObjectType
  ? Pick<
      {
        [K in keyof ParamValues<Field['params']>]:
          | ParamValues<Field['params']>[K]
          | ParamVariables<ParamValues<Field['params']>[K], Variables>
      },
      RequiredParamKeys<Field['params']>
    > &
      Omit<
        {
          [K in keyof ParamValues<Field['params']>]?:
            | ParamValues<Field['params']>[K]
            | ParamVariables<ParamValues<Field['params']>[K], Variables>
        },
        RequiredParamKeys<Field['params']>
      >
  : Record<never, any>

type UnionSubqueryFactories<
  U extends AnyUnionType,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>
> = {
  [T in UnionTypeNames<U>]: (
    subquery: ObjectQueryTypeOf<UnionTypeByName<U, T>, Variables>
  ) => ObjectQueryTypeOf<
    UnionTypeByName<U, T>,
    Variables,
    Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>
  >
}

export type UnionSubqueries<U extends AnyUnionType, Factories extends UnionSubqueryFactories<U, any>> = {
  [T in UnionTypeNames<U>]: ReturnType<Factories[T]>
}

export type ObjectQueryTypeOf<
  ResolverType extends AnyObjectType,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>,
  QuerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }> = Record<
    never,
    any
  >
> = ObjectQueryType<
  ResolverType,
  Variables,
  QuerySchema,
  ScalarResolvers<ResolverType>,
  ScalarListResolvers<ResolverType>,
  ObjectResolvers<ResolverType>,
  ObjectListResolvers<ResolverType>,
  UnionResolvers<ResolverType>,
  UnionListResolvers<ResolverType>
>

type OpType = 'query' | 'mutation' | 'subscription'

export class ObjectQueryType<
  ResolverType extends AnyObjectType,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>,
  QuerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
  Fields extends ScalarResolvers<ResolverType>,
  ListFields extends ScalarListResolvers<ResolverType>,
  ObjectFields extends ObjectResolvers<ResolverType>,
  ObjectListFields extends ObjectListResolvers<ResolverType>,
  UnionFields extends UnionResolvers<ResolverType>,
  UnionListFields extends UnionListResolvers<ResolverType>
> {
  opType: OpType
  resolverType: ResolverType
  schema: QuerySchema
  variables: Variables

  constructor(opType: OpType, resolverType: ResolverType, schema: QuerySchema, variables: Variables) {
    this.opType = opType
    this.resolverType = resolverType
    this.schema = schema
    this.variables = variables
  }

  toString(): string {
    return generateQueryString(this, 'query')
  }

  field<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    ListSubquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => ListSubquery
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: [ListSubquery]; paramInputs: Record<never, any> } }
  >

  field<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    ObjectSubquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => ObjectSubquery
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: ObjectSubquery; paramInputs: Record<never, any> } }
  >

  field<
    K extends Extract<keyof UnionListFields, string>,
    Union extends UnionListFields[K]['type'][0],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: {
        query: [UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>]
        paramInputs: Record<never, any>
      }
    }
  >

  field<
    K extends Extract<keyof UnionFields, string>,
    Union extends UnionFields[K]['type'],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: {
        query: UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>
        paramInputs: Record<never, any>
      }
    }
  >

  field<K extends Extract<keyof ListFields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: { query: [ScalarQueryType<ListFields[K]['type'][0]>]; paramInputs: Record<never, any> }
    }
  >

  field<K extends Extract<keyof Fields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Record<never, any> } }
  >

  field(key: Extract<keyof ResolverType['schema'], string>, makeSubquery: any): any {
    const schema = this.resolverType.schema
    const fieldDesc = schema[key]
    if (!fieldDesc) throw new Error(`Field ${key} does not exist`)

    const fieldType = fieldDesc.type

    if (Array.isArray(fieldType)) {
      return fieldType[0] instanceof ObjectType
        ? this._objectListField(key, makeSubquery)
        : fieldType[0] instanceof UnionType
        ? this._unionListField(key, makeSubquery)
        : this._scalarListField(key)
    }

    return fieldType instanceof ObjectType
      ? this._objectField(key, makeSubquery)
      : fieldType instanceof UnionType
      ? this._unionField(key, makeSubquery)
      : this._scalarField(key)
  }

  private _scalarField<K extends Extract<keyof Fields, string>>(key: K) {
    const schema = this.resolverType.schema as Fields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: new ScalarQueryType(fieldDesc.type), paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  scalarParamField<K extends Extract<keyof Fields, string>, Params extends VariableFieldParams<Fields[K], Variables>>(
    key: K,
    paramInputs: Params
  ) {
    const schema = this.resolverType.schema as Fields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Params }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: new ScalarQueryType(fieldDesc.type), paramInputs },
      },
      this.variables
    )

    return nextQueryType
  }

  private _scalarListField<K extends Extract<keyof ListFields, string>>(key: K) {
    const schema = this.resolverType.schema as ListFields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [ScalarQueryType<ListFields[K]['type']>]; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [new ScalarQueryType(fieldDesc.type)], paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  private _objectField<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    Subquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(key: K, makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => Subquery) {
    const schema = this.resolverType.schema as ObjectFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(this.opType, fieldDesc.type, {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: Subquery; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: subquery, paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  private _objectListField<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    Subquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(key: K, makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => Subquery) {
    const schema = this.resolverType.schema as ObjectListFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(this.opType, fieldDesc.type[0], {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [Subquery]; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [subquery], paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  paramField<
    K extends Extract<keyof ObjectFields, string>,
    Params extends VariableFieldParams<ObjectFields[K], Variables>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<never, any> }>,
    Subquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(
    key: K,
    paramInputs: Params,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => Subquery
  ) {
    const schema = this.resolverType.schema as ObjectFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(this.opType, fieldDesc.type, {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: Subquery; paramInputs: Params }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: subquery, paramInputs },
      },
      this.variables
    )

    return nextQueryType
  }

  listParamField<
    K extends Extract<keyof ObjectListFields, string>,
    Params extends VariableFieldParams<ObjectListFields[K], Variables>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<never, any> }>,
    Subquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(
    key: K,
    paramInputs: Params,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => Subquery
  ) {
    const schema = this.resolverType.schema as ObjectListFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(this.opType, fieldDesc.type[0], {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [Subquery]; paramInputs: Params }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [subquery], paramInputs },
      },
      this.variables
    )

    return nextQueryType
  }

  private _unionField<
    K extends Extract<keyof UnionFields, string>,
    Union extends UnionFields[K]['type'],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(key: K, makeSubqueries: SubqueryFactories) {
    const schema = this.resolverType.schema as UnionFields
    const fieldDesc = schema[key]

    const types = fieldDesc.type.types as Union['types']

    const unionQuery = new UnionQueryType(
      fieldDesc.type,
      Object.fromEntries(
        types.map((objectType) => {
          const emptySubquery = new ObjectQueryType(this.opType, objectType, {}, this.variables)
          const makeSubquery = makeSubqueries[objectType.typename as UnionTypeNames<Union>]
          if (!makeSubquery) throw new Error(`Missing subquery for union type ${objectType.typename}`)
          // @ts-expect-error
          return [objectType.typename, makeSubquery(emptySubquery)]
        })
      ) as UnionSubqueries<Union, SubqueryFactories>
    )

    // @ts-expect-error
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: {
          query: UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>
          paramInputs: Record<never, any>
        }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: unionQuery, paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  private _unionListField<
    K extends Extract<keyof UnionListFields, string>,
    Union extends UnionListFields[K]['type'][0],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(key: K, makeSubqueries: SubqueryFactories) {
    const schema = this.resolverType.schema as UnionListFields
    const fieldDesc = schema[key]

    const types = fieldDesc.type[0].types as Union['types']

    const unionQuery = new UnionQueryType(
      fieldDesc.type[0],
      Object.fromEntries(
        types.map((objectType) => {
          const emptySubquery = new ObjectQueryType(this.opType, objectType, {}, this.variables)
          const makeSubquery = makeSubqueries[objectType.typename as UnionTypeNames<Union>]
          if (!makeSubquery) throw new Error(`Missing subquery for union type ${objectType.typename}`)
          // @ts-expect-error
          return [objectType.typename, makeSubquery(emptySubquery)]
        })
      ) as UnionSubqueries<Union, SubqueryFactories>
    )

    // @ts-expect-error
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: {
          query: [UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>]
          paramInputs: Record<never, any>
        }
      }
    > = new ObjectQueryType(
      this.opType,
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [unionQuery], paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  variable<K extends string, T extends AnyInputValueType>(key: K, type: T) {
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables & { [key in K]: { type: T; optional: false; defaultValue: null } },
      QuerySchema
    > = new ObjectQueryType(this.opType, this.resolverType, this.schema, {
      ...this.variables,
      [key]: { type, optional: false, defaultValue: null },
    })

    return nextQueryType
  }

  optionalVariable<K extends string, T extends AnyInputValueType>(key: K, type: T, defaultValue: InputValue<T>) {
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables & { [key in K]: { type: T; optional: true; defaultValue: InputValue<T> } },
      QuerySchema
    > = new ObjectQueryType(this.opType, this.resolverType, this.schema, {
      ...this.variables,
      [key]: { type, optional: true, defaultValue },
    })

    return nextQueryType
  }
}

export function queryType<Query extends AnyObjectType>(query: Query) {
  return new ObjectQueryType('query', query, {}, {})
}

export function mutationType<Mutation extends AnyObjectType>(mutation: Mutation) {
  return new ObjectQueryType('mutation', mutation, {}, {})
}

export function subscriptionType<Subscription extends AnyObjectType>(subscription: Subscription) {
  return new ObjectQueryType('subscription', subscription, {}, {})
}

export type AnyObjectQueryType = ObjectQueryType<
  AnyObjectType,
  Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>,
  Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
  Record<string, { key: string; type: AnyScalarType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyScalarListType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyObjectType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyObjectListType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyUnionType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyUnionListType; optional: boolean; params: AnyParamObjectType | null }>
>
