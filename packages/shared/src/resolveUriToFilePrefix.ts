// TODO: remove it if possible or add a comment on why it's needed
export const resolveUriToFilePrefix = (uri: string) => {
  if (!uri.startsWith('file://')) {
    return `file://${uri}`;
  }
  return uri;
};
