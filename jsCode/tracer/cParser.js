const fop = require('../../Lib/fileio');
const tOp = require('../../Lib/text');
const { env } = require('../../env');

const goParser = async () => {
  const lines = await fop.getFileLines(process.argv[3]);
  let i; let s; let sTrim; const setState = env.column !== 1; let state = false;
  for (i = 0; i < lines.length; i += 1) {
    s = lines[i]; sTrim = s.trim();
    if (sTrim.startsWith('const debug = ')) {
      state = tOp.getEnd(sTrim, '=').trim() === 'true;';
      console.log(`Current: ${state}, NeedState: ${setState}`);
      if (setState !== state) lines[i] = `const debug = ${setState};`;
      continue;
    }
    if (setState) {
      if (s.startsWith('export const getConsole')) lines[i] = s.slice(7, s.length);
      if (s.startsWith('export default')) lines[i] = '//' + s;
      if (s.startsWith('export default') || s.startsWith('//export default')) {
        let params;
        if (i + 1 < lines.length && lines[i + 1]) params = lines[i + 1].split(' ');
        lines.splice(i + 1, lines.length - (i + 1));
        const ins = env.clipboard.split('\n');
        if (ins.length) {
          lines.push("getConsole('" + (params && params[0] && params[0] !== '-' ? params[0] : '') + "', `" + ins[0]);
          ins.shift();
          lines.push(...ins);
          lines[lines.length - 1] = lines[lines.length - 1] + "`, '" + (params && params[1] && params[1] !== '-' ? params[1] : 'linux')
            + "', '" + (params && params[2] && params[2] !== '-' ? params[2] : 'backend') + "');";
          lines.push('');
        }
        break;
      }
    } else {
      if (s.startsWith('const getConsole')) lines[i] = 'export ' + s;
      if (s.startsWith('//export default')) {
        lines[i] = s.slice(2, s.length);
        lines.splice(i + 1, lines.length - (i + 1));
        lines.push('');
      }
    }
  }
  await fop.setFileLines(process.argv[3], lines);
};

module.exports = {
  goParser,
};
