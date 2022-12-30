import { AnyObjectListType, AnyObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType } from '../outputs/ParamObjectType'
import { AnyUnionListType, AnyUnionType } from '../outputs/UnionType'
import { AnyType } from './AnyType.type'

type FilterScalarResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectType
    ? never
    : Schema[K]['type'] extends AnyUnionType
    ? never
    : Schema[K]['type'] extends [...any]
    ? never
    : { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
}

type FilterObjectResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type FilterUnionResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyUnionType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type FilterScalarListResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends [...any]
    ? Schema[K]['type'] extends AnyObjectListType
      ? never
      : { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type FilterObjectListResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectListType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type FilterUnionListResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyUnionListType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

export type ScalarResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterScalarResolvers<ResolverType['schema']>[keyof FilterScalarResolvers<
    ResolverType['schema']
  >]['key']]: FilterScalarResolvers<ResolverType['schema']>[key]
}

export type ObjectResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterObjectResolvers<ResolverType['schema']>[keyof FilterObjectResolvers<
    ResolverType['schema']
  >]['key']]: FilterObjectResolvers<ResolverType['schema']>[key]
}

export type UnionResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterUnionResolvers<ResolverType['schema']>[keyof FilterUnionResolvers<
    ResolverType['schema']
  >]['key']]: FilterUnionResolvers<ResolverType['schema']>[key]
}

export type ScalarListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterScalarListResolvers<ResolverType['schema']>[keyof FilterScalarListResolvers<
    ResolverType['schema']
  >]['key']]: FilterScalarListResolvers<ResolverType['schema']>[key]
}

export type ObjectListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterObjectListResolvers<ResolverType['schema']>[keyof FilterObjectListResolvers<
    ResolverType['schema']
  >]['key']]: FilterObjectListResolvers<ResolverType['schema']>[key]
}

export type UnionListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterUnionListResolvers<ResolverType['schema']>[keyof FilterUnionListResolvers<
    ResolverType['schema']
  >]['key']]: FilterUnionListResolvers<ResolverType['schema']>[key]
}
