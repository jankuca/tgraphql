import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { ParamValues } from '../outputs/ParamObjectType'
import { AnyUnionType, UnionType, UnionTypeNames } from '../outputs/UnionType'
import { AnySchemaType, SchemaType } from '../SchemaType'
import { AnyType } from './AnyType.type'
import { ScalarType } from './ScalarType.type'
import { Value } from './Value.type'

type UnionResolver<Data extends object, Typename extends string, Context> = {
  __resolveType: (data: Data, context: Context) => Typename
}

type ResolvedValue<T extends AnyType, Entities extends { [typename in string]?: object }> = T extends ObjectType<
  infer N,
  any
>
  ? N extends keyof Entities
    ? Entities[N]
    : Value<T>
  : T extends UnionType<any, infer I extends ReadonlyArray<AnyObjectType>>
  ? ResolvedValue<I[number], Entities>
  : T extends [infer I extends AnyType, null]
  ? Array<ResolvedValue<I, Entities> | null>
  : T extends [infer I extends AnyType]
  ? Array<ResolvedValue<I, Entities>>
  : Value<T>

type Resolver<
  Parent extends object,
  T extends AnyType | AnySchemaType,
  Entities extends { [typename in string]?: object },
  Context
> = T extends [AnyType, null]
  ? () => ResolvedValue<T, Entities>
  : T extends [AnyType]
  ? () => ResolvedValue<T, Entities>
  : T extends EnumType<string, infer I>
  ? () => I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? () => UnionResolver<Parent, I[number]['typename'], Context>
  : T extends EnumValueType<infer I>
  ? () => I
  : T extends ObjectType<infer N, infer I>
  ? {
      [key in Exclude<keyof I, N extends keyof Entities ? keyof Entities[N] : never>]: (
        parent: Parent,
        params: null extends I[key]['params'] ? Record<never, any> : ParamValues<NonNullable<I[key]['params']>>,
        context: Context
      ) => I[key]['optional'] extends true
        ? ResolvedValue<I[key]['type'], Entities> | null
        : ResolvedValue<I[key]['type'], Entities>
    }
  : T extends CustomScalarType<string, infer I>
  ? () => Resolver<Parent, I, Entities, Context>
  : T extends ScalarType
  ? () => string
  : T

type ObjectUnionToObjectIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never

type NestedObjectTypes<T extends AnyType> = T extends [infer I extends AnyObjectType | AnyUnionType, null]
  ? NestedObjectTypes<I>
  : T extends [infer I extends AnyObjectType | AnyUnionType]
  ? NestedObjectTypes<I>
  : T extends UnionType<string, infer I>
  ? NestedObjectTypes<I[number]>
  : T extends ObjectType<infer N, infer I>
  ? { [typename in N]: T } & ObjectUnionToObjectIntersection<
      {
        [field in keyof I]: NestedObjectTypes<I[field]['type']>
      }[keyof I]
    >
  : Record<never, any>

type NestedUnionTypes<T extends AnyType> = T extends [infer I extends AnyObjectType | AnyUnionType, null]
  ? NestedUnionTypes<I>
  : T extends [infer I extends AnyObjectType | AnyUnionType]
  ? NestedUnionTypes<I>
  : T extends UnionType<infer N, infer I>
  ? { [typename in N]: T } & NestedUnionTypes<I[number]>
  : T extends ObjectType<string, infer I>
  ? ObjectUnionToObjectIntersection<
      {
        [field in keyof I]: NestedUnionTypes<I[field]['type']>
      }[keyof I]
    >
  : Record<never, any>

export type SchemaObjectTypes<Schema extends AnySchemaType> = Schema extends SchemaType<infer Q, infer M, infer S>
  ? ({ [key in Q['typename']]: Q } & NestedObjectTypes<Q>) &
      ({ [key in M['typename']]: M } & NestedObjectTypes<M>) &
      ({ [key in S['typename']]: S } & NestedObjectTypes<S>)
  : Record<never, any>

export type SchemaUnionTypes<Schema extends AnySchemaType> = Schema extends SchemaType<infer Q, infer M, infer S>
  ? NestedUnionTypes<Q> & NestedUnionTypes<M> & NestedUnionTypes<S>
  : Record<never, any>

type SchemaEntities<Schema extends AnySchemaType> = { [typename in keyof SchemaObjectTypes<Schema>]?: object }

type SchemaObjectTypeResolver<
  Schema extends AnySchemaType,
  typename extends string,
  Entities extends SchemaEntities<Schema>,
  Context
> = Resolver<
  Entities[typename] extends object
    ? Entities[typename]
    : typename extends Schema['Query']['typename']
    ? never
    : typename extends Schema['Mutation']['typename']
    ? never
    : typename extends Schema['Subscription']['typename']
    ? never
    : SchemaObjectTypes<Schema>[typename],
  SchemaObjectTypes<Schema>[typename],
  Entities,
  Context
>

export type SchemaResolvers<
  Schema extends AnySchemaType,
  Entities extends SchemaEntities<Schema> = never,
  Context = never
> = {
  [typename in Extract<
    keyof SchemaObjectTypes<Schema>,
    string
  >]?: SchemaObjectTypes<Schema>[typename] extends AnyObjectType
    ? typename extends Schema['Query']['typename']
      ? Partial<SchemaObjectTypeResolver<Schema, typename, Entities, Context>>
      : typename extends Schema['Mutation']['typename']
      ? Partial<SchemaObjectTypeResolver<Schema, typename, Entities, Context>>
      : typename extends Schema['Subscription']['typename']
      ? Partial<SchemaObjectTypeResolver<Schema, typename, Entities, Context>>
      : SchemaObjectTypeResolver<Schema, typename, Entities, Context>
    : never
} & {
  [typename in Extract<
    keyof SchemaUnionTypes<Schema>,
    string
  >]?: SchemaUnionTypes<Schema>[typename] extends AnyUnionType
    ? UnionResolver<
        Value<SchemaUnionTypes<Schema>[typename]>,
        UnionTypeNames<SchemaUnionTypes<Schema>[typename]>,
        Context
      >
    : never
}
