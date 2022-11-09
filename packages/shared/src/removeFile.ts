import * as fs from 'fs/promises';

export async function removeFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      return;
    }
    throw e;
  }
}
