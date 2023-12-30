import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { AnyInputValueType } from './AnyInputValueType.type'
import { ScalarType } from './ScalarType.type'
import { InputObjectValue } from './Value.type'

export type InputValue<T extends AnyInputValueType | AnyInputFieldType> = T extends [
  infer I extends AnyInputFieldType,
  null
]
  ? InputValue<
      // NOTE: Break infinite recursion
      Exclude<I, [AnyInputFieldType, null]>
    > | null
  : T extends [infer I extends AnyInputFieldType]
  ? Array<InputValue<I>>
  : T extends [infer I extends AnyInputValueType, null]
  ? InputValue<
      // NOTE: Break infinite recursion
      Exclude<I, [AnyInputValueType, null]>
    > | null
  : T extends [infer I extends AnyInputValueType]
  ? Array<InputValue<I>>
  : T extends EnumType<string, infer I>
  ? I[number]
  : T extends EnumValueType<infer I>
  ? I
  : T extends CustomScalarType<string, infer I>
  ? InputValue<I>
  : T extends InputObjectType<string, infer I extends Record<string, { type: AnyInputFieldType; optional: boolean }>>
  ? InputObjectValue<I>
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T
