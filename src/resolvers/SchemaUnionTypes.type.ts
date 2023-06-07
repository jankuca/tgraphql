import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { AnyUnionType, UnionType } from '../outputs/UnionType'
import { AnySchemaType, SchemaType } from '../SchemaType'
import { AnyType } from '../types/AnyType.type'
import { ObjectUnionToObjectIntersection } from '../types/ObjectUnionToObjectIntersection.type'

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

export type SchemaUnionTypes<Schema extends AnySchemaType> = Schema extends SchemaType<infer Q, infer M, infer S>
  ? NestedUnionTypes<Q> & NestedUnionTypes<M> & NestedUnionTypes<S>
  : Record<never, any>
