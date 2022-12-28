type ScalarType = 'ID' | 'String' | 'Int' | 'Float' | 'Bool'

abstract class NamedType {
  typename: string
  constructor(typename: string) {
    this.typename = typename
  }
}

class ObjectType<S extends Record<string, { type: AnyType; optional: boolean }>> extends NamedType {
  schema: S
  constructor(typename: string, schema: S) {
    super(typename)
    this.schema = schema
  }

  field<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<S & { [k in K]: { type: T; optional: false } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false },
    })
  }

  listField<K extends string, Ts extends readonly [AnyType] | readonly [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<S & { [k in K]: { type: Ts; optional: false } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false },
    })
  }
}

class EnumValueType<S extends string> {
  enumTypeName: string
  value: S
  constructor(enumTypeName: string, value: S) {
    this.enumTypeName = enumTypeName
    this.value = value
  }
}

class EnumType<Vs extends ReadonlyArray<string>> extends NamedType {
  values: Array<EnumValueType<Vs[number]>>
  constructor(typename: string, values: Vs) {
    super(typename)
    this.values = values.map((value) => new EnumValueType(typename, value))
  }
}

function objectType(typename: string) {
  return new ObjectType(typename, {})
}
function enumType<S extends ReadonlyArray<string>>(typename: string, ...values: S) {
  return new EnumType(typename, values)
}

const CatchupAccessLevelEnum = enumType('CatchupAccessLevelEnum', 'owner', 'participant', 'viewer', 'denied')

const User = objectType('User').field('id', 'ID').field('name', 'String')

const Attendee = objectType('Attendee')
  .field('id', 'ID')
  .field('user', User)
  .field('access_level', CatchupAccessLevelEnum)

const Catchup = objectType('Catchup')
  .field('id', 'ID')
  .listField('attendees', [Attendee])

const Query = objectType('Query').listField('recentCatchups', [Catchup])

type AnyType =
  | ObjectType<Record<string, { type: AnyType; optional: boolean }>>
  | EnumType<ReadonlyArray<string>>
  | ScalarType
  | EnumValueType<string>
  | [AnyType]
  | [AnyType, null]

type ObjectValue<S extends Record<string, { type: AnyType; optional: boolean }>> = {
  [key in keyof S]: S[key]['optional'] extends true ? Value<S[key]['type']> | null : Value<S[key]['type']>
}

type Value<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? Array<Value<I>>
  : T extends [infer I extends AnyType]
  ? Array<Value<I>>
  : T extends EnumType<infer I>
  ? I[number]
  : T extends EnumValueType<infer I>
  ? I
  : T extends ObjectType<infer I>
  ? ObjectValue<I>
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T

// Testing:
// type U = Value<typeof User>
// type A = Value<typeof Attendee>
// type C = Value<typeof Catchup>
// type Cs = Value<[typeof Catchup]>
// type E = Value<typeof CatchupAccessLevelEnum>
// type OA = ObjectValue<typeof Attendee['schema']>

type Resolver<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? () => Array<Value<I> | null>
  : T extends [infer I extends AnyType]
  ? () => Array<Value<I>>
  : T extends EnumType<infer I>
  ? () => I[number]
  : T extends EnumValueType<infer I>
  ? () => I
  : T extends ObjectType<infer I>
  ? { [key in keyof I]: () => I[key]['optional'] extends true ? Value<I[key]['type']> | null : Value<I[key]['type']> }
  : T extends ScalarType
  ? () => string
  : T

// Testing:
// type URs = Resolver<typeof User>
// type ARs = Resolver<typeof Attendee>
// type CRs = Resolver<typeof Catchup>

type SchemaResolvers<Q extends ObjectType<any>> = { Query: Resolver<Q> }

// --- DEMO: ---

type CatchupModel = { 'id': string; 'name': string | null }
type AttendeeModel = {
  'id': string
  'catchup_id': string
  'user_id': string
  'access_level': 'owner' | 'participant' | 'viewer'
}
type UserModel = { 'id': string; 'name': string }

function listRecentCatchups(): Value<[typeof Catchup]> {
  const catchupModels: Array<CatchupModel> = [{ 'id': 'c1', 'name': 'Catchup 1' }]
  const attendeeModels: Array<Omit<AttendeeModel, 'catchup_id'> & { 'user_name': UserModel['name'] }> = [
    { 'id': 'a1', 'user_id': 'u1', 'access_level': 'owner', 'user_name': 'User 1' },
    { 'id': 'a2', 'user_id': 'u2', 'access_level': 'viewer', 'user_name': 'User 2' },
  ]

  return catchupModels.map((catchupModel) => ({
    ...catchupModel,
    'attendees': attendeeModels.map((attendeeModel) => {
      const { 'user_id': userId, 'user_name': userName, ...attendee } = attendeeModel
      return {
        ...attendee,
        'user': { 'id': userId, 'name': userName },
      }
    }),
  }))
}

function createResolvers(): SchemaResolvers<typeof Query> {
  return {
    Query: {
      recentCatchups: listRecentCatchups,
    },
  }
}

function generateSchemaString(rootType: AnyType): string {
  const { hoisted } = generateSchemaPart(rootType)
  return Object.values(hoisted).join('\n\n')
}

function generateSchemaPart(type: AnyType): { hoisted: Record<string, string>; inline: string } {
  if (Array.isArray(type)) {
    const { hoisted, inline } = generateSchemaPart(type[0])
    return { hoisted, inline: `[${inline}${type[1] === null ? '' : '!'}]` }
  }

  if (type instanceof EnumValueType) {
    return { hoisted: {}, inline: type.value }
  }

  if (type instanceof EnumType) {
    return {
      hoisted: {
        [type.typename]: [
          `enum ${type.typename} {`,
          ...type.values.map((enumValue) => `  ${enumValue.value}`),
          '}',
        ].join('\n'),
      },
      inline: type.typename,
    }
  }

  if (type instanceof ObjectType) {
    const hoisted: Record<string, string> = {}
    const schemaStringParts: Array<string> = [`type ${type.typename} {`]

    Object.entries(type.schema).forEach(([key, fieldDesc]) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(fieldDesc.type)
      Object.assign(hoisted, hoistedParts)
      schemaStringParts.push(`  ${key}: ${inline}${fieldDesc.optional ? '' : '!'}`)
    })
    schemaStringParts.push('}')
    hoisted[type.typename] = schemaStringParts.join('\n')

    return { hoisted, inline: type.typename }
  }

  // ScalarType
  return { hoisted: {}, inline: type }
}

// createResolvers()
console.log(generateSchemaString(Query))
