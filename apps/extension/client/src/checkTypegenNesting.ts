import * as vscode from "vscode";

export const checkTypegenNestingConfiguration = () => {
  const fileNestingConfig = vscode.workspace.getConfiguration(
    "explorer.fileNesting"
  );
  const fileNestingPatterns = fileNestingConfig.get<object>("patterns");

  const xstateConfig = vscode.workspace.getConfiguration("xstate");
  const nestTypegenFiles = xstateConfig.get<boolean>("nestTypegenFiles");

  const hasTypeGenPattern = Object.values(fileNestingPatterns).includes(
    "${capture}.typegen.ts"
  );

  if (nestTypegenFiles && !hasTypeGenPattern) {
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
            const existingTsPattern = fileNestingPatterns["*.ts"];
            const updatedPattern = existingTsPattern
              ? `${existingTsPattern}, \${capture}.typegen.ts`
              : "${capture}.typegen.ts";
            fileNestingConfig.update(
              "patterns",
              {
                ...fileNestingPatterns,
                "*.ts": updatedPattern,
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
