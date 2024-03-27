import ts from 'typescript';
import {
  isMachineCallExpression,
  isMachineNamedImportSpecifier,
  isMachinePropertyAccessExpression,
} from '../predicates';

export const machineToCreateMachine: ts.TransformerFactory<ts.SourceFile> =
  (context) => (sourceFile) => {
    const { factory } = context;
    return ts.visitNode(sourceFile, visit);

    function visit(node: ts.Node): ts.Node {
      if (isMachineNamedImportSpecifier(node)) {
        // if we have `propertyName`, it's using `as` syntax so we need to
        // rename `propertyName`. otherwise we just rename `name`.
        const [propertyName, name] = node.propertyName
          ? [factory.createIdentifier('createMachine'), node.name]
          : [node.propertyName, factory.createIdentifier('createMachine')];

        return factory.updateImportSpecifier(
          node,
          node.isTypeOnly,
          propertyName,
          name,
        );
      }

      if (isMachineCallExpression(node)) {
        return factory.updateCallExpression(
          node,
          factory.createIdentifier('createMachine'),
          node.typeArguments,
          node.arguments,
        );
      }

      if (isMachinePropertyAccessExpression(node)) {
        return factory.updatePropertyAccessExpression(
          node,
          node.expression,
          factory.createIdentifier('createMachine'),
        );
      }

      return ts.visitEachChild(node, visit, context);
    }
  };
