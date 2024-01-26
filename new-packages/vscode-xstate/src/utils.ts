import { EventObject, assertEvent } from 'xstate';

export function assertDefined<T>(
  input: T | undefined,
): asserts input is NonNullable<T> {
  if (input === undefined || input === null) {
    throw new Error('Expected value to be defined');
  }
}

export function assertExtendedEvent<
  TEvent extends EventObject,
  TExtendedEvent extends EventObject,
>(event: TEvent, extendedType: TExtendedEvent['type']): TExtendedEvent {
  type ExtendedEvent = TEvent | TExtendedEvent;
  const extendedEvent = event satisfies ExtendedEvent as ExtendedEvent;
  assertEvent(extendedEvent, extendedType);
  return extendedEvent as TExtendedEvent;
}
