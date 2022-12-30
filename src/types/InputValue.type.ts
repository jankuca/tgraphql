import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType } from '../inputs/InputObjectType'
import { AnyInputValueType } from './AnyInputValueType.type'
import { ScalarType } from './ScalarType.type'

export type InputValue<T extends AnyInputValueType | AnyInputFieldType> = T extends EnumType<string, infer I>
  ? I[number]
  : T extends EnumValueType<infer I>
  ? I
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T
