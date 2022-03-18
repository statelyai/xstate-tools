import { execSync } from "child_process";
import * as path from "path";
import { program, runTypegen } from "../program";

describe("typegen", () => {
  execSync("rm -rf ./__examples__/*.typegen.ts", {
    cwd: __dirname,
  });

  const examplesPath = path.resolve(__dirname, "__examples__");

  it("Should pass tsc", async () => {
    await runTypegen(`${examplesPath}/*.ts`, { watch: false });
    try {
      execSync(`tsc`, {
        cwd: examplesPath,
      });
    } catch (e: any) {
      throw new Error(e.stdout.toString());
    }
  });
});
