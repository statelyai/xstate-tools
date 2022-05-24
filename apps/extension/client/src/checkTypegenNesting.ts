import * as vscode from "vscode";
import { WorkspaceConfiguration } from "vscode";

const typeGenPatternKey = "*.ts";
const typeGenPattern = "${capture}.typegen.ts";

// Checks if the user has our typegen pattern set in their workspace config
const hasTypeGenPattern = (fileNestingPatterns: object) =>
  Object.values(fileNestingPatterns).some((pattern: string) =>
    pattern
      .split(",")
      .map((part) => part.trim())
      .some((part) => part === typeGenPattern)
  );

const enableTypeGenNesting = (
  fileNestingConfig: WorkspaceConfiguration,
  fileNestingPatterns: object
) => {
  // If the user chooses to enable file nesting for typegen files we need to make sure that VSCode's file nesting is also enabled
  fileNestingConfig.update("enabled", true, true);

  // Check if the user has a pattern defined for ts files
  const existingTsPattern = fileNestingPatterns[typeGenPatternKey];

  // If the user has defined a pattern for ts files we add our typegen pattern to it, otherwise we create a new pattern
  const updatedPattern = existingTsPattern
    ? `${existingTsPattern}, ${typeGenPattern}`
    : typeGenPattern;

  // Update file nesting patterns with all existing patterns and our updated pattern
  fileNestingConfig.update(
    "patterns",
    {
      ...fileNestingPatterns, // Reuse existing patterns
      [typeGenPatternKey]: updatedPattern, // Add our updated pattern
    },
    true
  );
};

const disableTypeGenNesting = (
  xstateConfig: WorkspaceConfiguration,
  fileNestingConfig: WorkspaceConfiguration,
  fileNestingPatterns: object
) => {
  xstateConfig.update("nestTypegenFiles", false, true);

  // Check if the user has a pattern defined for ts files
  const existingTsPattern = fileNestingPatterns[typeGenPatternKey];

  // If there's no patterns defined for ts files we don't need to do anything
  if (existingTsPattern === "") return;

  // Remove our typegen pattern from the existing patterns
  const updatedPattern = existingTsPattern
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== typeGenPattern)
    .join(",");

  // Update file nesting patterns with all existing patterns and our updated pattern
  fileNestingConfig.update(
    "patterns",
    {
      ...fileNestingPatterns, // Reuse existing patterns
      [typeGenPatternKey]: updatedPattern, // Add our updated pattern
    },
    true
  );
};

const addConfigChangeHandler = () => {
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("xstate.nestTypegenFiles")) {
      // VSCode's configuration for file nesting
      const fileNestingConfig = vscode.workspace.getConfiguration(
        "explorer.fileNesting"
      );

      const xstateConfig = vscode.workspace.getConfiguration("xstate");
      const updatedNestTypegenFiles =
        xstateConfig.get<boolean>("nestTypegenFiles");

      if (updatedNestTypegenFiles) {
        enableTypeGenNesting(
          fileNestingConfig,
          fileNestingConfig.get("patterns")
        );
      } else {
        disableTypeGenNesting(
          xstateConfig,
          fileNestingConfig,
          fileNestingConfig.get("patterns")
        );
      }
    }
  });
};

/*
 * This checks that the users' config for nesting typegen files is set up correctly.
 * We try to make it easy for the user to enable file nesting by showing a prompt if they want file nesting but haven't defined a pattern for ts files yet.
 */
export const handleTypegenNestingConfig = () => {
  // VSCode's configuration for file nesting
  const fileNestingConfig = vscode.workspace.getConfiguration(
    "explorer.fileNesting"
  );

  // If there's no fileNestingConfig with patterns then we can't check the nesting, maybe the user is on a version of VSCode before 1.67
  if (!fileNestingConfig || !fileNestingConfig.has("patterns")) return;

  // VSCode's configuration for xstate
  const fileNestingPatterns = fileNestingConfig.get<object>("patterns");
  const xstateConfig = vscode.workspace.getConfiguration("xstate");
  const nestTypegenFiles = xstateConfig.get<boolean>("nestTypegenFiles");

  // If the user has disabled file nesting but still has our pattern defined for ts files we remove it
  if (!nestTypegenFiles && hasTypeGenPattern(fileNestingPatterns)) {
    disableTypeGenNesting(xstateConfig, fileNestingConfig, fileNestingPatterns);
  } else if (nestTypegenFiles && !hasTypeGenPattern(fileNestingPatterns)) {
    // Show prompt if the user wants to nest typegen files but hasn't defined our pattern yet
    const enableOption = "Enable";
    const disableOption = "No, don't ask again";
    vscode.window
      .showInformationMessage(
        "Do you want to enable file nesting for XState typegen files?",
        enableOption,
        disableOption
      )
      .then((choice) => {
        switch (choice) {
          case enableOption:
            enableTypeGenNesting(fileNestingConfig, fileNestingPatterns);
            break;
          case disableOption:
            disableTypeGenNesting(
              xstateConfig,
              fileNestingConfig,
              fileNestingPatterns
            );
            break;
        }
      });
  }

  // Add a handler for when the user changes the config for xstate.nestTypegenFiles manually
  addConfigChangeHandler();
};
