import type {
  ExtractorDigraphDef,
  LineAndCharacterPosition,
  LinesAndCharactersRange,
  Patch,
} from '@xstate/ts-project';
import * as vscode from 'vscode-languageserver-protocol';

type TextEdit =
  | {
      type: 'insert';
      uri: string;
      position: LineAndCharacterPosition;
      newText: string;
    }
  | {
      type: 'replace';
      uri: string;
      range: LinesAndCharactersRange;
      newText: string;
    };

export const getMachineAtIndex = new vscode.RequestType<
  {
    uri: string;
    machineIndex: number;
  },
  ExtractorDigraphDef | undefined,
  never
>('stately-xstate/get-machine-at-index');

export const applyPatches = new vscode.RequestType<
  {
    uri: string;
    machineIndex: number;
    patches: Patch[];
  },
  TextEdit[],
  never
>('stately-xstate/apply-patches');
