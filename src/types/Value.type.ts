import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType } from '../outputs/ParamObjectType'
import { UnionType } from '../outputs/UnionType'
import { AnyType } from './AnyType.type'
import { InputValue } from './InputValue.type'
import { ScalarType } from './ScalarType.type'

type ObjectValue<S extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>> = {
  [key in keyof S]: S[key]['optional'] extends true ? Value<S[key]['type']> | null : Value<S[key]['type']>
}

type InputObjectValue<S extends Record<string, { type: AnyInputFieldType; optional: boolean }>> = {
  [key in keyof S]: S[key]['optional'] extends true ? InputValue<S[key]['type']> | null : InputValue<S[key]['type']>
}

export type Value<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? Array<Value<I>>
  : T extends [infer I extends AnyType]
  ? Array<Value<I>>
  : T extends EnumType<string, infer I>
  ? I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? Value<I[number]>
  : T extends EnumValueType<infer I>
  ? I
  : T extends InputObjectType<string, infer I>
  ? InputObjectValue<I>
  : T extends ObjectType<string, infer I>
  ? ObjectValue<I>
  : T extends CustomScalarType<string, infer I>
  ? Value<I>
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T
