import { AnyStateMachine, PromiseActorLogic } from 'xstate-beta';
import { SkyConfigFile } from './skyTypes';

// export declare function fromPromise<T, TInput>(
//   promiseCreator: ({
//     input,
//     system,
//   }: {
//     input: TInput;
//     system: AnyActorSystem;
//     self: PromiseActorRef<T>;
//   }) => PromiseLike<T>,
// ): PromiseActorLogic<T, TInput>;

// Share types with fromPromise
export function fromStately<T extends AnyStateMachine, TInput>(
  {
    apiKey,
    url,
  }: {
    apiKey?: string;
    url: string;
  },
  skyConfig?: SkyConfigFile<T>,
): PromiseActorLogic<T, TInput> {
  if (!skyConfig) {
    throw new Error(
      `You need to run xstate sky "src/**/*.ts?(x)" before you can use the Stately Sky actor with url ${url}`,
    );
  }
  return Promise.resolve(skyConfig.machine) as unknown as PromiseActorLogic<
    T,
    TInput
  >;
}
