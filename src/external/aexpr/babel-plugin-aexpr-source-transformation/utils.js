
export const GENERATED_IMPORT_IDENTIFIER = Symbol("generated import identifier");

export function addCustomTemplate(file, name) {
  let declar = file.declarations[name];
  if (declar) return declar;

  let identifier = file.declarations[name] = file.addImport("aexpr-source-transformation-propagation", name, name);
  identifier[GENERATED_IMPORT_IDENTIFIER] = true;
  return identifier;

  // let ref = customTemplates[name];
  // console.log(file.addImport("aexpr-source-transformation-propagation", "aexpr"));
  // let uid = file.declarations[name] = file.scope.generateUidIdentifier(name);
  //
  // ref = ref().expression;
  // ref[GENERATED_FUNCTION] = true;
  //
  // if (t.isFunctionExpression(ref) && !ref.id) {
  //     ref.body._compact = true;
  //     ref._generated = true;
  //     ref.id = uid;
  //     ref.type = "FunctionDeclaration";
  //     file.path.unshiftContainer("body", ref);
  // } else {
  //     ref._compact = true;
  //     file.scope.push({
  //         id: uid,
  //         init: ref,
  //         unique: true
  //     });
  // }
  //
  // return uid;
}
