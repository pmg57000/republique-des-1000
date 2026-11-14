const acorn = require('acorn');
const fs = require('fs');
const [,, srcFile, start, end, mapFile] = process.argv;
const src = fs.readFileSync(srcFile, 'utf8').slice(+start, +end);
const mp = JSON.parse(fs.readFileSync(mapFile, 'utf8')).mapping;
let out = '', last = 0, prev = null;
for (const tok of acorn.tokenizer(src, { ecmaVersion: 'latest' })) {
  if (tok.type.label === 'name' && prev !== '.' && prev !== '?.' && Object.prototype.hasOwnProperty.call(mp, tok.value) && tok.value.length <= 3) {
    out += src.slice(last, tok.start) + mp[tok.value]; last = tok.end;
  }
  prev = tok.type.label;
}
out += src.slice(last);
process.stdout.write(out);
