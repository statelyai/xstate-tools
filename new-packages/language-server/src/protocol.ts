import { ExtractorDigraphDef } from '@xstate/ts-project';
import * as vscode from 'vscode-languageserver-protocol';

export const getMachineAtIndex = new vscode.RequestType<
  {
    uri: string;
    machineIndex: number;
  },
  ExtractorDigraphDef | undefined,
  never
>('stately-xstate/get-machine-at-index');
