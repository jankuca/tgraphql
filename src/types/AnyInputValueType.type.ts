import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { ScalarType } from './ScalarType.type'

export type AnyInputValueType =
  | ScalarType
  | CustomScalarType<string, ScalarType>
  | EnumType<string, string[]>
  | EnumValueType<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>
  | [AnyInputValueType]
  | [AnyInputValueType, null]
