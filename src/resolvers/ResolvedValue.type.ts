import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { UnionType } from '../outputs/UnionType'
import { AnyType } from '../types/AnyType.type'
import { Value } from '../types/Value.type'

export type ResolvedValue<T extends AnyType, Entities extends { [typename in string]?: object }> = T extends ObjectType<
  infer N,
  any
>
  ? N extends keyof Entities
    ? // Defined entity objects are expected to be returned by resolvers instead of fully resolved objects.
      Entities[N]
    : Value<T>
  : T extends UnionType<any, infer I extends ReadonlyArray<AnyObjectType>>
  ? ResolvedValue<I[number], Entities>
  : T extends [infer I extends AnyType, null]
  ? Array<ResolvedValue<I, Entities> | null>
  : T extends [infer I extends AnyType]
  ? Array<ResolvedValue<I, Entities>>
  : Value<T>
