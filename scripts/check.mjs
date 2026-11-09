import {readFileSync,existsSync} from 'node:fs';
import {Script} from 'node:vm';
for (const file of ['dist/index.html','dist/circuit.html','dist/circuit.css','dist/circuit.js','dist/circuit-data.js','dist/lab.html','dist/experience.css','dist/experience.js','dist/vendor/three.module.min.js','dist/style.css','dist/hyperspace.css','dist/app.js']) if(!existsSync(file)) throw new Error(`Missing ${file}`);
new Script(readFileSync('dist/app.js','utf8'));
const html=readFileSync('dist/lab.html','utf8');
for(const [,id] of readFileSync('dist/app.js','utf8').matchAll(/\$\('([^']+)'\)/g)) if(!html.includes(`id="${id}"`)) throw new Error(`Missing element: ${id}`);
JSON.parse(readFileSync('vercel.json','utf8'));
console.log('Static assets, JavaScript syntax, DOM references and Vercel configuration verified.');
