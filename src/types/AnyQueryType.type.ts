import { AnyObjectQueryType } from '../queries/ObjectQueryType'
import { ScalarQueryType } from '../queries/ScalarQueryType'
import { AnyUnionQueryType } from '../queries/UnionQueryType'
import { AnyType } from './AnyType.type'

type AnyNodeQueryType = AnyObjectQueryType | ScalarQueryType<AnyType> | AnyUnionQueryType

export type AnyQueryType = AnyNodeQueryType | [AnyNodeQueryType] | [AnyNodeQueryType, null]
