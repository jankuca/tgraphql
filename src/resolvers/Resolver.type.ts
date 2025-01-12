import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType, ParamValues } from '../outputs/ParamObjectType'
import { UnionType } from '../outputs/UnionType'
import { AnySchemaType } from '../SchemaType'
import { AnyType } from '../types/AnyType.type'
import { Prettify } from '../types/Prettify.type'
import { ScalarType } from '../types/ScalarType.type'
import { ResolvedValue } from './ResolvedValue.type'
import { UnionResolver } from './UnionResolver.type'

export type ObjectFieldResolver<
  Parent extends object,
  F extends { type: AnyType; optional: boolean; params: AnyParamObjectType | null },
  Entities extends { [typename in string]?: object },
  Context
> = (
  parent: Parent,
  params: null extends F['params'] ? Record<never, any> : ParamValues<NonNullable<F['params']>>,
  context: Context
) => F['optional'] extends true
  ? ResolvedValue<F['type'], Entities> | null | Promise<ResolvedValue<F['type'], Entities> | null>
  : ResolvedValue<F['type'], Entities> | Promise<ResolvedValue<F['type'], Entities>>

export type ObjectFieldGeneratorResolver<
  Parent extends object,
  F extends { type: AnyType; optional: boolean; params: AnyParamObjectType | null },
  Entities extends { [typename in string]?: object },
  Context
> = (
  parent: Parent,
  params: null extends F['params'] ? Record<never, any> : ParamValues<NonNullable<F['params']>>,
  context: Context
) => F['optional'] extends true
  ? AsyncGenerator<ResolvedValue<F['type'], Entities> | null>
  : AsyncGenerator<ResolvedValue<F['type'], Entities>>

export type Resolver<
  Parent extends object,
  T extends AnyType | AnySchemaType,
  Entities extends { [typename in string]?: object },
  Context
> = T extends [AnyType, null]
  ? () => ResolvedValue<T, Entities> | Promise<ResolvedValue<T, Entities>>
  : T extends [AnyType]
  ? () => ResolvedValue<T, Entities> | Promise<ResolvedValue<T, Entities>>
  : T extends EnumType<string, infer I>
  ? () => I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? () => UnionResolver<Parent, I[number]['typename'], Context>
  : T extends EnumValueType<infer I>
  ? () => I
  : T extends ObjectType<infer N, infer I>
  ? Prettify<
      {
        // Fields present on the entity objects are auto-resolved and do not required a dedicated resolver.
        [key in Exclude<
          keyof I,
          N extends keyof Entities
            ? Entities[N] extends object
              ? AutoresolvedEntityFields<Entities[N], Entities, I>
              : never
            : never
        >]: ObjectFieldResolver<Parent, I[key], Entities, Context>
      } & {
        // Fields present on the entity objects are auto-resolved but can have a dedicated (overriding) resolver.
        [key in Extract<
          keyof I,
          N extends keyof Entities
            ? Entities[N] extends object
              ? AutoresolvedEntityFields<Entities[N], Entities, I>
              : never
            : never
        >]?: ObjectFieldResolver<Parent, I[key], Entities, Context>
      }
    >
  : T extends CustomScalarType<string, infer I>
  ? () => Resolver<Parent, I, Entities, Context>
  : T extends ScalarType
  ? () => string
  : T

export type AutoresolvedEntityFields<
  Entity extends object,
  Entities extends { [typename in string]?: object },
  S extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [key in keyof Entity]: key extends keyof S
    ? ResolvedValue<S[key]['type'], Entities> extends Entity[key]
      ? key
      : never
    : never
}[keyof Entity]
