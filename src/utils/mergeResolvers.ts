import { MergePartialSchemaResolvers } from '../resolvers/MergePartialSchemaResolvers.type'
import { AnySchemaType } from '../SchemaType'

export function mergeResolvers<S extends AnySchemaType, T extends object[]>(params: {
  Schema: S
  resolvers: T
}): MergePartialSchemaResolvers<T[number]> {
  const { Schema, resolvers: modules } = params
  return Object.assign({}, ...modules, {
    [Schema['Query']['typename']]: Object.assign(
      {},
      ...modules.map((m) =>
        Schema['Query']['typename'] in m // @ts-expect-error The key has been checked for existence, it is there.
          ? m[Schema['Query']['typename']]
          : {}
      )
    ),
    [Schema['Mutation']['typename']]: Object.assign(
      {},
      ...modules.map((m) =>
        Schema['Mutation']['typename'] in m // @ts-expect-error The key has been checked for existence, it is there.
          ? m[Schema['Mutation']['typename']]
          : {}
      )
    ),
    [Schema['Subscription']['typename']]: Object.assign(
      {},
      ...modules.map((m) =>
        Schema['Subscription']['typename'] in m // @ts-expect-error The key has been checked for existence, it is there.
          ? m[Schema['Subscription']['typename']]
          : {}
      )
    ),
  })
}
