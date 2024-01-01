import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType } from '../outputs/ParamObjectType'
import { UnionType } from '../outputs/UnionType'
import { AnyType } from '../types/AnyType.type'
import { Prettify } from '../types/Prettify.type'
import { Value } from '../types/Value.type'

type ResolvedObjectValue<
  S extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>,
  Entities extends { [typename in string]?: object }
> = Prettify<{
  [key in keyof S]: S[key]['optional'] extends true
    ? ResolvedValue<S[key]['type'], Entities> | null
    : ResolvedValue<S[key]['type'], Entities>
}>

export type ResolvedValue<T extends AnyType, Entities extends { [typename in string]?: object }> = T extends ObjectType<
  infer N,
  infer S
>
  ? N extends keyof Entities
    ? // Defined entity objects are expected to be returned by resolvers instead of fully resolved objects.
      Entities[N]
    : ResolvedObjectValue<S, Entities>
  : T extends UnionType<any, infer I extends ReadonlyArray<AnyObjectType>>
  ? ResolvedValue<I[number], Entities>
  : T extends [infer I extends AnyType, null]
  ? Array<ResolvedValue<I, Entities> | null>
  : T extends [infer I extends AnyType]
  ? Array<ResolvedValue<I, Entities>>
  : Value<T>
