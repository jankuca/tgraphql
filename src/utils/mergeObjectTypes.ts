import { AnyObjectType, ObjectType } from '../outputs/ObjectType'

type MergedSchemas<Ss extends AnyObjectType['schema']> = (
  Ss extends AnyObjectType['schema'] ? (p: Ss) => any : never
) extends (p: infer X) => any
  ? X
  : never

export function mergeObjectTypes<Ts extends ReadonlyArray<AnyObjectType>>(...objectTypes: Ts) {
  if (!objectTypes[0]) {
    throw new Error('Cannot merge 0 object types')
  }

  const names = new Set(objectTypes.map((t) => t.typename))
  const commonName = names.size === 1 ? objectTypes[0].typename : null
  if (!commonName) {
    throw new Error(`Cannot merge object types with different names: ${Array.from(names).join(', ')}`)
  }

  const mergedObjectType = new ObjectType(
    commonName,
    objectTypes.reduce((acc, t) => ({ ...acc, ...t.schema }), {})
  ) as ObjectType<
    Ts[number]['typename'],
    // @ts-expect-error TS cannot infer without concerete values; it works for actual calls of the util though
    MergedSchemas<Ts[number]['schema']>
  >

  return mergedObjectType
}
