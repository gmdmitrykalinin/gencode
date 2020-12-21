const tOp = require('./Lib/text');
const { env } = require('./env');
const { cs } = tOp; const rs = [];


rs.push({ name: 'Parser', project: 'cfw', fileNames: ['parser.js'], func: () => require('./jsCode/tracer/cParser').goParser() });
rs.push({ name: 'CodeTestMode', fileNames: ['package.json'], func: () => require('./jsCode/mainLoop').markProject(true) });
rs.push({ name: 'Code', ext: ['js'], func: () => require('./jsCode/mainLoop').markProject() });
rs.push({ name: 'GraphQL', ext: ['graphql'], func: () => require('./graphQL/genCode').Go() });

let rule; let success;
console.log('\n' + cs.cyan + cs.bgSpring + cs.bar + ' genCode ' + cs.bgMagenta + ' v1.0 ' + cs.reset);
for (let i = 0; i < rs.length; i += 1) {
  rule = rs[i]; success = true;
  success &= (!rule.project) || (rule.project && ((env.project === rule.project) || (env.projectShort === rule.project)));
  success &= (!rule.fileNames) || (rule.fileNames && (rule.fileNames.includes(env.file) || (rule.fileNames.includes(env.fileShort))));
  success &= (!rule.ext) || (rule.ext && rule.ext.includes(env.ext));
  if (success) { rule.func(); break; }
}
