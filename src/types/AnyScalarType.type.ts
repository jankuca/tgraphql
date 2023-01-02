import { ScalarType } from './ScalarType.type'

export type AnyScalarType = ScalarType | string | number | boolean
export type AnyScalarListType = [AnyScalarType] | [AnyScalarType, null]
