import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType } from '../outputs/ParamObjectType'
import { UnionType } from '../outputs/UnionType'
import { ScalarType } from './ScalarType.type'

export type AnyType =
  | ObjectType<string, Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>>
  | EnumType<string, ReadonlyArray<string>>
  | UnionType<string, ReadonlyArray<AnyObjectType>>
  | CustomScalarType<string, ScalarType>
  | ScalarType
  | EnumValueType<string>
  | [AnyType]
  | [AnyType, null]
  | string
  | number
  | boolean
