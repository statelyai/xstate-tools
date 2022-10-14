import { connection } from './connection';

type Primitive = string | number | boolean | null;

type Loggable = LoggableObject | LoggableArray | Primitive;

interface LoggableObject {
  [key: string]: Loggable;
}
type LoggableArray = (Primitive | LoggableObject | LoggableArray)[];

export const log = (...args: Loggable[]) => {
  connection.console.log(
    args
      .map((a) => (!!a && typeof a === 'object' ? JSON.stringify(a) : a))
      .join(', '),
  );
};
