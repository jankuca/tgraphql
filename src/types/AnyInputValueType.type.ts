import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { ScalarType } from './ScalarType.type'

export type AnyInputValueType =
  | ScalarType
  | EnumValueType<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>
