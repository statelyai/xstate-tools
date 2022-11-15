export const isErrorWithMessage = (
  error: unknown,
): error is {
  message: string;
} =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof (error as Record<string, unknown>).message === 'string';
