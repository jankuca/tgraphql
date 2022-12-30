export class EnumValueType<S extends string> {
  enumTypeName: string
  value: S
  constructor(enumTypeName: string, value: S) {
    this.enumTypeName = enumTypeName
    this.value = value
  }
}
