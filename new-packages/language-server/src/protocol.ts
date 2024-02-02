import type { ExtractorDigraphDef, Patch } from '@xstate/ts-project';
import * as vscode from 'vscode-languageserver-protocol';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type TextEdit = DistributiveOmit<
  import('@xstate/ts-project').TextEdit,
  'fileName'
> & {
  uri: string;
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
