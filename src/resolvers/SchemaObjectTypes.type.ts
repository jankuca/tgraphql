import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { AnyUnionType, UnionType } from '../outputs/UnionType'
import { AnySchemaType, SchemaType } from '../SchemaType'
import { AnyType } from '../types/AnyType.type'
import { ObjectUnionToObjectIntersection } from '../types/ObjectUnionToObjectIntersection.type'

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

export type SchemaObjectTypes<Schema extends AnySchemaType> = Schema extends SchemaType<infer Q, infer M, infer S>
  ? ({ [key in Q['typename']]: Q } & NestedObjectTypes<Q>) &
      ({ [key in M['typename']]: M } & NestedObjectTypes<M>) &
      ({ [key in S['typename']]: S } & NestedObjectTypes<S>)
  : Record<never, any>
