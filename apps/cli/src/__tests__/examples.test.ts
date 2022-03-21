import { execSync } from "child_process";
import * as path from "path";

describe("typegen", () => {
  execSync("rm -rf ./__examples__/*.typegen.ts", {
    cwd: __dirname,
  });

  const examplesPath = path.resolve(__dirname, "__examples__");

  execSync("yarn build", {
    cwd: __dirname,
    stdio: "ignore",
  });
  execSync('node ../../bin/bin.js typegen "./__examples__/*.ts"', {
    cwd: __dirname,
  });
  it("Should pass tsc", async () => {
    try {
      execSync(`tsc`, {
        cwd: examplesPath,
      });
    } catch (e: any) {
      throw new Error(e.stdout.toString());
    }
  });
});
