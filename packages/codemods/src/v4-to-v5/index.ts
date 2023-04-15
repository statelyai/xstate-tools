import ts from 'typescript';

export const v4ToV5: ts.TransformerFactory<ts.SourceFile> =
  (context) => (sourceFile) => {
    const { factory } = context;

    return sourceFile;
  };
