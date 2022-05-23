import * as vscode from "vscode";

const typeGenPatternKey = "*.ts";
const typeGenPattern = "${capture}.typegen.ts";
const hasTypeGenPattern = (fileNestingPatterns: object) =>
  Object.values(fileNestingPatterns).some((pattern: string) => {
    const patterns = pattern.split(",");
    return patterns.some(
      (innerPattern) => innerPattern.trim() === typeGenPattern
    );
  });

export const checkTypegenNestingConfiguration = () => {
  const fileNestingConfig = vscode.workspace.getConfiguration(
    "explorer.fileNesting"
  );

  // If there's no fileNestingConfig with patterns then we can't check the nesting, maybe the user is on a version of VSCode before 1.67
  if (!fileNestingConfig || !fileNestingConfig.has("patterns")) return;

  const fileNestingPatterns = fileNestingConfig.get<object>("patterns");

  const xstateConfig = vscode.workspace.getConfiguration("xstate");
  const nestTypegenFiles = xstateConfig.get<boolean>("nestTypegenFiles");
  if (nestTypegenFiles && !hasTypeGenPattern(fileNestingPatterns)) {
    const enableOption = "Enable";
    const disableOption = "No, don't ask again";
    vscode.window
      .showInformationMessage(
        "Do you want to enable file nesting for typegen files?",
        enableOption,
        disableOption
      )
      .then((choice) => {
        switch (choice) {
          case enableOption:
            fileNestingConfig.update("enabled", true, true);
            const existingTsPattern = fileNestingPatterns[typeGenPatternKey];
            const updatedPattern = existingTsPattern
              ? `${existingTsPattern}, ${typeGenPattern}`
              : typeGenPattern;
            fileNestingConfig.update(
              "patterns",
              {
                ...fileNestingPatterns,
                [typeGenPatternKey]: updatedPattern,
              },
              true
            );
            break;
          case disableOption:
            xstateConfig.update("nestTypegenFiles", false, true);
            break;
        }
      });
  }
};
