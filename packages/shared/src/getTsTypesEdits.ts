import { TypegenData } from './getTypegenData';

export const getTsTypesEdits = (types: TypegenData[]) =>
  types
    .filter(
      (type) =>
        !type.typesNode.value ||
        type.typesNode.value.argument !== type.data.tsTypesValue.argument ||
        type.typesNode.value.qualifier !== type.data.tsTypesValue.qualifier,
    )
    .map((type) => ({
      range: type.typesNode.range,
      newText: `{} as import("${type.data.tsTypesValue.argument}").${type.data.tsTypesValue.qualifier}`,
    }));
