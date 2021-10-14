const source: BufferEncoding = 'binary';
const destination: BufferEncoding = 'base64';

// from https://gitlab.eduxiji.net/githubexcellent/30-seconds-of-code/-/commit/3bcf81556510ac1f2fafb00ad1623dcc3ab01c77
export const encode = (str: string) => Buffer.from(str, source).toString(destination);
export const decode = (str: string) => Buffer.from(str, destination).toString(source);
