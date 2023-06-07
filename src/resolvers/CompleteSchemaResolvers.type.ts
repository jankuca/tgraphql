import { AnyObjectType } from '../outputs/ObjectType'
import { AnyUnionType, UnionTypeNames } from '../outputs/UnionType'
import { AnySchemaType } from '../SchemaType'
import { Value } from '../types/Value.type'
import { AutoresolvedEntityNames } from './AutoresolvedEntityNames.type'
import { SchemaEntities } from './SchemaEntities.type'
import { SchemaObjectTypeResolver } from './SchemaObjectTypeResolver.type'
import { SchemaObjectTypes } from './SchemaObjectTypes.type'
import { SchemaUnionTypes } from './SchemaUnionTypes.type'
import { UnionResolver } from './UnionResolver.type'

/**
 * Type that can be used to implement a complete set of resolvers for a schema.
 */
export type CompleteSchemaResolvers<
  Schema extends AnySchemaType,
  Entities extends SchemaEntities<Schema> = never,
  Context = never
> =
  // Auto-resolved entities (see above) are not required to have dedicated resolvers.
  Omit<
    {
      [typename in Extract<
        keyof SchemaObjectTypes<Schema>,
        string
      >]: SchemaObjectTypes<Schema>[typename] extends AnyObjectType
        ? SchemaObjectTypeResolver<Schema, typename, Entities, Context>
        : never
    },
    AutoresolvedEntityNames<Schema, Entities>
  > &
    // Unresolved entities are required to have dedicated resolvers.
    Pick<
      {
        [typename in Extract<
          keyof SchemaObjectTypes<Schema>,
          string
        >]?: SchemaObjectTypes<Schema>[typename] extends AnyObjectType
          ? SchemaObjectTypeResolver<Schema, typename, Entities, Context>
          : never
      },
      AutoresolvedEntityNames<Schema, Entities>
    > & {
      // Unions are never considered auto-resolved.
      [typename in Extract<
        keyof SchemaUnionTypes<Schema>,
        string
      >]: SchemaUnionTypes<Schema>[typename] extends AnyUnionType
        ? UnionResolver<
            Value<SchemaUnionTypes<Schema>[typename]>,
            UnionTypeNames<SchemaUnionTypes<Schema>[typename]>,
            Context
          >
        : never
    }
