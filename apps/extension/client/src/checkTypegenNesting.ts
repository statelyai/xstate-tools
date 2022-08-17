import * as vscode from 'vscode';
import { Uri } from 'vscode';

// More info on the patterns in this comment: https://github.com/statelyai/xstate-tools/pull/146#discussion_r889904447
const typegenPatternKeys = ['*.ts', '*.tsx', '*.mts', '*.cts'];
const typegenPattern = '${capture}.typegen.ts';

const getXStateConfig = () => vscode.workspace.getConfiguration('xstate');
const getFileNestingConfig = () =>
  vscode.workspace.getConfiguration('explorer.fileNesting');

const getExistingNestingPattern = (
  fileNestingPatterns: object,
  patternKey: string,
) =>
  patternKey in fileNestingPatterns
    ? fileNestingPatterns[patternKey as keyof typeof fileNestingPatterns]
    : '';

// Checks if the user has our typegen pattern set in their workspace config
const hasTypegenPattern = (fileNestingPatterns: object) =>
  Object.values(fileNestingPatterns).some((pattern: string) =>
    pattern
      .split(',')
      .map((part) => part.trim())
      .some((part) => part === typegenPattern),
  );

const createTypegenPatterns = (transformer: (patternKey: string) => string) => {
  const transformedArray = typegenPatternKeys.map((patternKey) => ({
    [patternKey]: transformer(patternKey),
  }));
  // Return an object with all the transformed keys
  return transformedArray.reduce(function (result, item) {
    const firstKey = Object.keys(item)[0];
    result[firstKey] = item[firstKey];
    return result;
  }, {});
};

const enableTypegenNesting = () => {
  const fileNestingConfig = getFileNestingConfig();

  const fileNestingPatterns = fileNestingConfig.get('patterns');
  if (!fileNestingPatterns || typeof fileNestingPatterns !== 'object') return;

  // If the user chooses to enable file nesting for typegen files we need to make sure that VSCode's file nesting is also enabled
  fileNestingConfig.update('enabled', true, true);

  const getUpdatedPattern = (typegenPatternKey: string) => {
    // Check if the user has a pattern defined for ts files
    const existingTsPattern = getExistingNestingPattern(
      fileNestingPatterns,
      typegenPatternKey,
    );

    // If the user has defined a pattern for ts files we add our typegen pattern to it, otherwise we create a new pattern
    return existingTsPattern
      ? `${existingTsPattern}, ${typegenPattern}`
      : typegenPattern;
  };

  const updatedPatterns = createTypegenPatterns(getUpdatedPattern);

  // Update file nesting patterns with all existing patterns and our updated pattern
  fileNestingConfig.update(
    'patterns',
    {
      ...fileNestingPatterns, // Reuse existing patterns
      ...updatedPatterns, // Add our updated patterns
    },
    true,
  );
};

const removeEmptyPatterns = (obj: object) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, pattern]) => pattern !== ''),
  );

const disableTypegenNesting = () => {
  const fileNestingConfig = getFileNestingConfig();

  const fileNestingPatterns = fileNestingConfig.get('patterns');
  if (!fileNestingPatterns || typeof fileNestingPatterns !== 'object') return;

  const getUpdatedPattern = (typegenPatternKey: string) => {
    // Check if the user has a pattern defined for ts files
    const existingTsPattern: string | undefined = getExistingNestingPattern(
      fileNestingPatterns,
      typegenPatternKey,
    );

    // If there's no patterns defined for ts files we don't need to do anything
    if (!existingTsPattern || existingTsPattern === '') return '';
    else {
      // Remove our typegen pattern from the existing patterns
      return existingTsPattern
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part !== typegenPattern)
        .join(', ');
    }
  };

  const updatedPatterns = createTypegenPatterns(getUpdatedPattern);

  // Update file nesting patterns with all existing patterns and our updated pattern
  fileNestingConfig.update(
    'patterns',
    removeEmptyPatterns({
      ...fileNestingPatterns, // Reuse existing patterns
      ...updatedPatterns, // Add our updated pattern
    }),
    true,
  );
};

const addConfigChangeHandler = () => {
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('xstate.nestTypegenFiles')) {
      const xstateConfig = getXStateConfig();
      const updatedNestTypegenFiles =
        xstateConfig.get<boolean>('nestTypegenFiles');

      if (updatedNestTypegenFiles) {
        enableTypegenNesting();
      } else {
        disableTypegenNesting();
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
  const fileNestingConfig = getFileNestingConfig();

  // If there's no fileNestingConfig with patterns then we can't check the nesting, maybe the user is on a version of VSCode before 1.67
  if (!fileNestingConfig.has('patterns')) return;

  // VSCode's configuration for xstate
  const fileNestingPatterns = fileNestingConfig.get('patterns');
  if (!fileNestingPatterns || typeof fileNestingPatterns !== 'object') return;

  const xstateConfig = getXStateConfig();
  const nestTypegenFiles = xstateConfig.get<boolean>('nestTypegenFiles');

  // If the user has disabled file nesting but still has our pattern defined for ts files we remove it
  if (!nestTypegenFiles && hasTypegenPattern(fileNestingPatterns)) {
    disableTypegenNesting();
  } else if (nestTypegenFiles && !hasTypegenPattern(fileNestingPatterns)) {
    // Show prompt if the user wants to nest typegen files but hasn't defined our pattern yet
    const enableOption = 'Enable';
    const disableOption = "No, don't ask again";
    const learnMoreOption = 'Learn more';
    vscode.window
      .showInformationMessage(
        'Do you want to enable file nesting for XState typegen files?',
        enableOption,
        disableOption,
        learnMoreOption,
      )
      .then((choice) => {
        switch (choice) {
          case enableOption:
            enableTypegenNesting();
            break;
          case disableOption:
            getXStateConfig().update('nestTypegenFiles', false, true);
            disableTypegenNesting();
            break;
          case learnMoreOption:
            vscode.env.openExternal(
              Uri.parse('https://stately.ai/blog/nesting-xstate-typegen-files'),
            );
            break;
        }
      });
  }

  // Add a handler for when the user changes the config for xstate.nestTypegenFiles manually
  addConfigChangeHandler();
};
