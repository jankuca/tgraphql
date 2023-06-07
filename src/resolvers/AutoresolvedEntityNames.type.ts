import { AnySchemaType } from '../SchemaType'
import { ResolvedValue } from './ResolvedValue.type'
import { SchemaEntities } from './SchemaEntities.type'
import { SchemaObjectTypes } from './SchemaObjectTypes.type'

export type AutoresolvedEntityNames<Schema extends AnySchemaType, Entities extends SchemaEntities<Schema>> = {
  [typename in Extract<keyof SchemaObjectTypes<Schema>, string>]: Entities[typename] extends ResolvedValue<
    SchemaObjectTypes<Schema>[typename],
    never
  >
    ? // Entities that themselves fulfill the desired object shape are considered auto-resolved.
      typename
    : ResolvedValue<SchemaObjectTypes<Schema>[typename], never> extends Record<never, any>
    ? // Empty desired objects are considered auto-resolved.
      typename
    : never
}[Extract<keyof SchemaObjectTypes<Schema>, string>]
