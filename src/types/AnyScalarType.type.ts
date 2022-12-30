import { AnyObjectType } from '../outputs/ObjectType'
import { AnyType } from './AnyType.type'

export type AnyScalarType = Exclude<AnyType, AnyObjectType | [...any]>
export type AnyScalarListType = [AnyScalarType] | [AnyScalarType, null]
