// Dump top-level declarations of an esbuild IIFE bundle with normalized token streams.
const acorn = require('acorn');
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
// find IIFE body
let body = null;
for (const st of ast.body) {
  if (st.type === 'ExpressionStatement') {
    let e = st.expression;
    if (e.type === 'CallExpression' && (e.callee.type === 'ArrowFunctionExpression' || e.callee.type === 'FunctionExpression')) { body = e.callee.body.body; break; }
  }
}
const out = [];
function toks(start, end) {
  const res = [];
  const t = acorn.tokenizer(src.slice(start, end), { ecmaVersion: 'latest' });
  let prev = null;
  for (const tok of t) {
    let v;
    const tt = tok.type.label;
    if (tt === 'name') v = (prev === '.' || prev === '?.') ? '.' + tok.value : '§' + tok.value;
    else if (tt === 'string') v = 'S:' + tok.value;
    else if (tt === 'num') v = 'N:' + tok.value;
    else if (tt === 'template') v = 'T:' + tok.value;
    else if (tt === 'regexp') v = 'R:' + tok.value.pattern;
    else v = tok.value !== undefined && typeof tok.value === 'string' && tok.value.length ? tok.value : tt;
    res.push(v);
    prev = tt === '.' || tt === '?.' ? tt : (tt === 'name' ? 'name' : tt);
  }
  return res;
}
let idx = 0;
for (const st of body) {
  if (st.type === 'FunctionDeclaration') {
    out.push({ i: idx++, name: st.id.name, kind: 'function', start: st.start, end: st.end });
  } else if (st.type === 'VariableDeclaration') {
    for (const d of st.declarations) {
      const names = [];
      (function collect(p) { if (!p) return; if (p.type === 'Identifier') names.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => collect(q.value || q.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(collect); else if (p.type === 'RestElement') collect(p.argument); else if (p.type === 'AssignmentPattern') collect(p.left); })(d.id);
      out.push({ i: idx++, name: names.join(','), kind: 'var', start: d.start, end: d.end, multi: names.length > 1 });
    }
  } else if (st.type === 'ClassDeclaration') {
    out.push({ i: idx++, name: st.id.name, kind: 'class', start: st.start, end: st.end });
  } else {
    out.push({ i: idx++, name: '', kind: st.type, start: st.start, end: st.end });
  }
}
for (const o of out) o.toks = toks(o.start, o.end);
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log(process.argv[2], out.length, 'decls');
