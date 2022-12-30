import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { UnionType } from '../outputs/UnionType'
import { AnyType } from './AnyType.type'
import { ScalarType } from './ScalarType.type'
import { Value } from './Value.type'

type Resolver<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? () => Array<Value<I> | null>
  : T extends [infer I extends AnyType]
  ? () => Array<Value<I>>
  : T extends EnumType<string, infer I>
  ? () => I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? () => Resolver<I[number]>
  : T extends EnumValueType<infer I>
  ? () => I
  : T extends ObjectType<string, infer I>
  ? { [key in keyof I]: () => I[key]['optional'] extends true ? Value<I[key]['type']> | null : Value<I[key]['type']> }
  : T extends ScalarType
  ? () => string
  : T

export type SchemaResolvers<
  Query extends ObjectType<'Query', any> | null = null,
  Mutation extends ObjectType<'Mutation', any> | null = null,
  Subscription extends ObjectType<'Subscription', any> | null = null
> = (Query extends AnyObjectType ? { 'Query': Resolver<Query> } : Record<never, any>) &
  (Mutation extends AnyObjectType ? { 'Mutation': Resolver<Mutation> } : Record<never, any>) &
  (Subscription extends AnyObjectType ? { 'Subscription': Resolver<Subscription> } : Record<never, any>)
