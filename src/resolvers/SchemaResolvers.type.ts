import { AnySchemaType } from '../SchemaType'
import { CompleteSchemaResolvers } from './CompleteSchemaResolvers.type'
import { SchemaEntities } from './SchemaEntities.type'
import { SchemaObjectTypeResolver } from './SchemaObjectTypeResolver.type'

/**
 * Type that can be used to implement a part of resolvers for a schema.
 *
 * Use as `const resolvers = { … } satisfies PartialSchemaResolvers<…>` when implementing resolvers as multiple modules.
 */
export type SchemaResolvers<
  Schema extends AnySchemaType,
  Entities extends SchemaEntities<Schema> = never,
  Context = never
> = Partial<
  // NOTE: Entry points (Query, Mutation, Subscription) are allowed to be defined in multiple places and merged.
  Omit<
    CompleteSchemaResolvers<Schema, Entities, Context>,
    Schema['Query']['typename'] | Schema['Mutation']['typename'] | Schema['Subscription']['typename']
  > & {
    [typename in Schema['Query']['typename']]: Partial<SchemaObjectTypeResolver<Schema, typename, Entities, Context>>
  } & {
    [typename in Schema['Mutation']['typename']]: Partial<SchemaObjectTypeResolver<Schema, typename, Entities, Context>>
  } & {
    [typename in Schema['Subscription']['typename']]: Partial<
      SchemaObjectTypeResolver<Schema, typename, Entities, Context>
    >
  }
>
