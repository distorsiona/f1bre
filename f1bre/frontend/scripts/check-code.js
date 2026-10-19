/** Valida módulos, imports y archivos de entrada sin arrancar el navegador ni consultar APIs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
const modules = new Map();
// Comprobación conservadora de referencias libres: detecta helpers olvidados al separar archivos.
const browserGlobals = new Set([
  'Array',
  'Object',
  'String',
  'Number',
  'Boolean',
  'Math',
  'Date',
  'JSON',
  'Set',
  'Map',
  'Promise',
  'Error',
  'URL',
  'Blob',
  'AbortController',
  'document',
  'window',
  'location',
  'Option',
  'fetch',
  'setTimeout',
  'clearTimeout',
  'encodeURIComponent',
  'decodeURIComponent',
  'parseInt',
  'undefined',
  'Infinity',
  'NaN',
  'globalThis',
  'console',
]);
function checkReferences(ast, file) {
  const declared = new Set(browserGlobals),
    references = [];
  function bind(pattern) {
    if (!pattern) return;
    if (pattern.type === 'Identifier') declared.add(pattern.name);
    else if (pattern.type === 'RestElement') bind(pattern.argument);
    else if (pattern.type === 'AssignmentPattern') bind(pattern.left);
    else if (pattern.type === 'ArrayPattern') pattern.elements.forEach(bind);
    else if (pattern.type === 'ObjectPattern')
      pattern.properties.forEach((property) => bind(property.value || property.argument));
  }
  function visit(node, parent, key) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator') bind(node.id);
    if (
      ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)
    ) {
      bind(node.id);
      node.params.forEach(bind);
    }
    if (node.type === 'CatchClause') bind(node.param);
    if (node.type === 'ImportDeclaration')
      node.specifiers.forEach((specifier) => bind(specifier.local));
    if (node.type === 'Identifier') {
      const property =
        parent?.type === 'MemberExpression' && key === 'property' && !parent.computed;
      const objectKey = parent?.type === 'Property' && key === 'key' && !parent.computed;
      const importedName = parent?.type === 'ImportSpecifier' && key === 'imported';
      if (!property && !objectKey && !importedName) references.push(node.name);
    }
    for (const [childKey, value] of Object.entries(node)) {
      if (['start', 'end'].includes(childKey)) continue;
      if (Array.isArray(value)) value.forEach((child) => visit(child, node, childKey));
      else if (value && typeof value === 'object') visit(value, node, childKey);
    }
  }
  visit(ast);
  for (const name of references)
    if (!declared.has(name))
      throw Error(`Unbound reference ${name} in ${path.relative(root, file)}`);
}
for (const file of walk(path.join(root, 'src')).filter((file) => file.endsWith('.js'))) {
  const ast = parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' }),
    exports = new Set(),
    imports = [];
  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration')
      imports.push({
        target: path.resolve(path.dirname(file), node.source.value.split(/[?#]/)[0]),
        names: node.specifiers
          .filter((specifier) => specifier.type === 'ImportSpecifier')
          .map((specifier) => specifier.imported.name),
      });
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration?.type === 'VariableDeclaration')
        node.declaration.declarations.forEach((declaration) => exports.add(declaration.id.name));
      else if (node.declaration?.id) exports.add(node.declaration.id.name);
      node.specifiers.forEach((specifier) => exports.add(specifier.exported.name));
    }
  }
  modules.set(file, { imports, exports });
  checkReferences(ast, file);
}
for (const [file, module] of modules)
  for (const dependency of module.imports) {
    if (!modules.has(dependency.target))
      throw Error(`Missing import: ${file} → ${dependency.target}`);
    for (const name of dependency.names)
      if (!modules.get(dependency.target).exports.has(name))
        throw Error(`Missing export ${name} in ${dependency.target}`);
  }
const complete = new Set();
function checkCycles(file, stack = []) {
  if (stack.includes(file))
    throw Error(
      `Circular import: ${[...stack, file].map((file) => path.relative(root, file)).join(' → ')}`,
    );
  if (complete.has(file)) return;
  for (const dependency of modules.get(file).imports)
    checkCycles(dependency.target, [...stack, file]);
  complete.add(file);
}
for (const file of modules.keys()) checkCycles(file);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))
  if (!fs.existsSync(path.join(root, match[1]))) throw Error(`Missing HTML dependency ${match[1]}`);
for (const file of walk(path.join(root, 'styles')).filter((file) => file.endsWith('.css')))
  for (const match of fs
    .readFileSync(file, 'utf8')
    .matchAll(/@import url\(['"](\.\/[^'"]+)['"]\)/g))
    if (!fs.existsSync(path.resolve(path.dirname(file), match[1])))
      throw Error(`Missing stylesheet ${match[1]}`);
console.log(
  `Validated ${modules.size} ES modules: syntax, imports, exports, no cycles, and HTML/CSS dependencies.`,
);
