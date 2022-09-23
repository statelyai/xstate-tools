export const resolveUriToFilePrefix = (uri: string) => {
  if (!uri.startsWith('file://')) {
    return `file://${uri}`;
  }
  return uri;
};
