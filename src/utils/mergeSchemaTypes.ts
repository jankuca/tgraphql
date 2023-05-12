import { AnyObjectType, ObjectType } from '../outputs/ObjectType'
import { SchemaType } from '../SchemaType'
import { mergeObjectTypes } from './mergeObjectTypes'

type MergedSchemas<Ss extends AnyObjectType['schema']> = (
  Ss extends AnyObjectType['schema'] ? (p: Ss) => any : never
) extends (p: infer X) => any
  ? X
  : never

export function mergeSchemaTypes<
  Schemas extends ReadonlyArray<SchemaType<AnyObjectType, AnyObjectType, AnyObjectType>>
>(...schemaTypes: Schemas) {
  if (!schemaTypes[0]) {
    throw new Error('Cannot merge 0 schema types')
  }

  const queryTypes = schemaTypes.map((Schema) => Schema.Query)
  const mutationTypes = schemaTypes.map((Schema) => Schema.Mutation)
  const subscriptionTypes = schemaTypes.map((Schema) => Schema.Subscription)

  const mergedSchemaType = new SchemaType(
    mergeObjectTypes(...queryTypes),
    mergeObjectTypes(...mutationTypes),
    mergeObjectTypes(...subscriptionTypes)
  ) as SchemaType<
    // @ts-expect-error TS cannot infer without concerete values; it works for actual calls of the util though
    ObjectType<Schemas[number]['Query']['typename'], MergedSchemas<Schemas[number]['Query']['schema']>>,
    // @ts-expect-error TS cannot infer without concerete values; it works for actual calls of the util though
    ObjectType<Schemas[number]['Mutation']['typename'], MergedSchemas<Schemas[number]['Mutation']['schema']>>,
    // @ts-expect-error TS cannot infer without concerete values; it works for actual calls of the util though
    ObjectType<Schemas[number]['Subscription']['typename'], MergedSchemas<Schemas[number]['Subscription']['schema']>>
  >

  return mergedSchemaType
}
