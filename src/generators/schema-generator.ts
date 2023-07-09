import assertNever from 'assert-never'

import { CustomScalarType } from '../CustomScalarType'
import { EnumType } from '../EnumType'
import { EnumValueType } from '../EnumValueType'
import { AnyInputFieldType, InputObjectType } from '../inputs/InputObjectType'
import { ObjectType } from '../outputs/ObjectType'
import { AnyParamObjectType, AnyParamType } from '../outputs/ParamObjectType'
import { UnionType } from '../outputs/UnionType'
import { AnySchemaType, SchemaType } from '../SchemaType'
import { AnyInputValueType } from '../types/AnyInputValueType.type'
import { AnyType } from '../types/AnyType.type'

export function generateSchemaString(rootType: AnyType | AnySchemaType): string {
  const { hoisted } = generateSchemaPart(rootType)
  return Object.values(hoisted).join('\n\n')
}

function generateSchemaFieldParamStringPart<P extends AnyParamObjectType>(
  params: P
): {
  hoisted: Record<string, string>
  inline: string
} {
  const hoisted: Record<string, string> = {}

  const paramEntries = Object.entries(params.schema)
  if (paramEntries.length === 0) {
    return { hoisted, inline: '' }
  }

  return {
    hoisted,
    inline: [
      '(',
      paramEntries
        .map(([key, fieldDesc]) => {
          const { hoisted: hoistedParamParts, inline: valueString } = generateSchemaPart(fieldDesc.type)
          Object.assign(hoisted, hoistedParamParts)

          const { hoisted: hoistedDefaultValueParts, inline: defaultValueString } = fieldDesc.optional
            ? generateSchemaPart(fieldDesc.defaultValue)
            : { hoisted: {}, inline: '' }
          Object.assign(hoisted, hoistedDefaultValueParts)

          return `${key}: ${valueString}${fieldDesc.optional ? '' : '!'}${
            defaultValueString ? ` = ${defaultValueString}` : ''
          }`
        })
        .join(', '),
      ')',
    ].join(''),
  }
}

export function generateSchemaPart(
  type: AnyType | AnySchemaType | AnyInputValueType | AnyInputFieldType | AnyParamType
): {
  hoisted: Record<string, string>
  inline: string
} {
  if (Array.isArray(type)) {
    const { hoisted, inline } = generateSchemaPart(type[0])
    return { hoisted, inline: `[${inline}${type[1] === null ? '' : '!'}]` }
  }

  if (type instanceof SchemaType) {
    const hoisted: Record<string, string> = {}

    const { hoisted: hoistedQueryParts } = generateSchemaPart(type.Query)
    Object.assign(hoisted, hoistedQueryParts)

    const { hoisted: hoistedMutationParts } = generateSchemaPart(type.Mutation)
    Object.assign(hoisted, hoistedMutationParts)

    const { hoisted: hoistedSubscriptionParts } = generateSchemaPart(type.Subscription)
    Object.assign(hoisted, hoistedSubscriptionParts)

    return { hoisted, inline: '' }
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

  if (type instanceof UnionType) {
    const hoisted: Record<string, string> = {}
    const names: Array<string> = []

    type.types.forEach((unionType) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(unionType)
      Object.assign(hoisted, hoistedParts)
      names.push(inline)
    })

    hoisted[type.typename] = `union ${type.typename} = ${names.join(' | ')}`

    return { hoisted, inline: type.typename }
  }

  if (type instanceof ObjectType) {
    const hoisted: Record<string, string> = {}

    const fieldEntries = Object.entries(type.schema)
    if (fieldEntries.length === 0) {
      return { hoisted, inline: type.typename }
    }

    const schemaStringParts: Array<string> = [`type ${type.typename} {`]
    fieldEntries.forEach(([key, fieldDesc]) => {
      const { hoisted: hoistedParamsParts, inline: paramListString } = fieldDesc.params
        ? generateSchemaFieldParamStringPart(fieldDesc.params)
        : { hoisted: {}, inline: '' }
      Object.assign(hoisted, hoistedParamsParts)

      const { hoisted: hoistedParts, inline: valueString } = generateSchemaPart(fieldDesc.type)
      Object.assign(hoisted, hoistedParts)

      schemaStringParts.push(`  ${key}${paramListString}: ${valueString}${fieldDesc.optional ? '' : '!'}`)
    })
    schemaStringParts.push('}')
    hoisted[type.typename] = schemaStringParts.join('\n')

    return { hoisted, inline: type.typename }
  }

  if (type instanceof InputObjectType) {
    const hoisted: Record<string, string> = {}
    const schemaStringParts: Array<string> = [`input ${type.typename} {`]

    Object.entries(type.schema).forEach(([key, fieldDesc]) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(fieldDesc.type)
      Object.assign(hoisted, hoistedParts)
      schemaStringParts.push(`  ${key}: ${inline}${fieldDesc.optional ? '' : '!'}`)
    })
    schemaStringParts.push('}')
    hoisted[type.typename] = schemaStringParts.join('\n')

    return { hoisted, inline: type.typename }
  }

  if (type instanceof CustomScalarType) {
    return {
      hoisted: {
        [type.typename]: `scalar ${type.typename}`,
      },
      inline: type.typename,
    }
  }

  // ScalarType
  if (type === 'String' || type === 'Int' || type === 'Float' || type === 'Bool' || type === 'ID') {
    return { hoisted: {}, inline: type }
  }

  if (typeof type === 'string') {
    return { hoisted: {}, inline: `"${String(type).replace(/"/g, '\\"')}"` }
  }
  if (typeof type === 'number' || typeof type === 'boolean') {
    return { hoisted: {}, inline: String(type) }
  }

  assertNever(type)
}
