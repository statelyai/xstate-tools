import * as fs from 'fs';
import * as path from 'path';

/**
 * Searches for the closest '.env' file starting from the directory of the given file path and moving up the directory tree until the root of the project is reached.
 * @param filePath - The path of the file to start searching from.
 * @param cwd - The root directory of the project.
 * @returns The contents of the closest '.env' file.
 * @throws An error if no '.env' file is found in the project.
 */
export function getClosestEnvFile({
  filePath,
  cwd,
}: {
  filePath: string;
  cwd: string;
}) {
  const startDir = path.dirname(filePath);
  if (!fs.existsSync(startDir)) {
    throw new Error(`No such directory: ${startDir}`);
  } else {
    let currentDir = startDir;
    let searchingInsideProject = true;
    while (searchingInsideProject) {
      const fileList = fs.readdirSync(currentDir);
      const targetFile = fileList.find((file) => file.startsWith('.env'));
      if (targetFile) {
        const envFilePath = path.resolve(targetFile);
        return fs.readFileSync(envFilePath, 'utf8');
      } else {
        // If we've reached the root of the project, stop searching
        if (path.resolve(currentDir) === cwd) {
          searchingInsideProject = false;
        } else {
          currentDir = path.join(currentDir, '..');
        }
      }
    }

    throw new Error("Could not find any '.env' file in the project.");
  }
}

/**
 * Returns the value of a given key in an environment variable string.
 * @param envString - The environment variable string to search in.
 * @param key - The key to search for.
 * @returns The value of the key if found, otherwise undefined.
 */
export function getEnvValue(envString: string, key: string) {
  const match = envString.match(`${key}="(.*)"`);
  if (match && match[1]) {
    return match[1];
  }
}
