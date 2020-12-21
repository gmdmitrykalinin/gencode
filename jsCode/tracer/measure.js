const stringify = require('json-stringify-safe');
const fop = require('../../Lib/fileio');
const lib = require('../../graphQL/genCode');
const tx = require('../../Lib/text');
const cs = tx.cs;

const getFunc = (s) => {
  const rFunc = /(async)?\s*function\s+(?<name>\S+)\((?<params>((?:[^\)]|\.)+))\)\s*{/mg;
  const rFuncLambda = /(const|let)\s+(?<name>\S+)\s*=\s*(async)?\s*((\((?<params>((?:[^\)]|\.)+))\))|(?<paramsOne>\S+))\s*=>\s*{/mg;
  let obj = tx.getObj(s, rFunc);
  if (!obj.name) obj = tx.getObj(s, rFuncLambda);
  return obj;
}

const measure = async (file) => {
  const br = new tx.Bracers();
  let s; let sJoin; let func;
  const lines = await fop.getFileLines(file);
  for (let i = 0; i < lines.length; i += 1) {
    s = lines[i]; sJoin += s;
    func = getFunc(sJoin);
    if(func.name) {
      func.row = i + 1;
      console.log(func.name);
      sJoin = '';
    }
    br.calc(s);
  }
}

module.exports = measure;
