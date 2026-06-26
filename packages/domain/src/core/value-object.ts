/**
 * ValueObject — equality is structural (all props match), not by identity.
 * Must be immutable. Never expose setters.
 */
export abstract class ValueObject<TProps extends Record<string, unknown>> {
  protected constructor(protected readonly props: Readonly<TProps>) {}

  equals(other: ValueObject<TProps>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }

  protected get value(): Readonly<TProps> {
    return this.props
  }
}
