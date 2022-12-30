export class VariableInput<Name extends string> {
  name: Name
  constructor(name: Name) {
    this.name = name
  }
}

export function variable<Name extends string>(name: Name) {
  return new VariableInput(name)
}
