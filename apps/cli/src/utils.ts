export // TODO: just use the native one when support for node 12 gets dropped
const allSettled: typeof Promise.allSettled = (promises: Promise<any>[]) =>
  Promise.all(
    promises.map((promise) =>
      promise.then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason) => ({ status: 'rejected' as const, reason }),
      ),
    ),
  );

let prettier: typeof import('prettier') | undefined;
export function getPrettierInstance(cwd: string): typeof import('prettier') {
  if (prettier) {
    return prettier;
  }
  try {
    return require(require.resolve('prettier', { paths: [cwd] }));
  } catch (err) {
    if (!err || (err as any).code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
    // we load our own prettier instance lazily on purpose to speed up the init time
    return (prettier = require('prettier'));
  }
}
