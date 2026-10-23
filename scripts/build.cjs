const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
const source = path.join(root, 'dist');
const version = (process.env.GITHUB_SHA || Date.now().toString()).replace(/[^a-zA-Z0-9]/g, '');
fs.mkdirSync(output, {recursive:true});
for (const name of fs.readdirSync(source)) {
  const file = path.join(source,name);
  if (fs.statSync(file).isDirectory()) {
    fs.cpSync(file, path.join(output,name), {recursive:true});
    continue;
  }
  let data = fs.readFileSync(file);
  if (/\.(html|js)$/.test(name)) {
    let text = data.toString('utf8');
    text = text.replace(/((?:src|href)="[^"\n]+\.(?:js|css))(?:\?[^"\n]*)?"/g, `$1?v=${version}"`);
    text = text.replace(/(from\s+['"]\.[^'"\n]+\.js)(?:\?[^'"\n]*)?(['"])/g, `$1?v=${version}$2`);
    text = text.replace(/__VERSION__/g, version);
    data = Buffer.from(text);
  }
  fs.writeFileSync(path.join(output,name), data);
}
fs.writeFileSync(path.join(output,'version.json'), JSON.stringify({version}));
fs.writeFileSync(path.join(output,'.nojekyll'), '');
console.log('Site préparé dans public/ — version '+version);
