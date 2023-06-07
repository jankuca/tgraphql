import { AnySchemaType } from '../SchemaType'
import { SchemaObjectTypes } from './SchemaObjectTypes.type'

export type SchemaEntities<Schema extends AnySchemaType> = { [typename in keyof SchemaObjectTypes<Schema>]?: object }
