const clipboardy = require('clipboardy');
const fOp = require('./Lib/fileio');
const tOp = require('./Lib/text');

if (process.argv.length < 5) return;
const env = {
  project: process.argv[2],
  projectShort: tOp.tDiv(process.argv[2], '/', true)[1],
  file: process.argv[3],
  fileShort: tOp.tDiv(process.argv[3], '/', true)[1],
  ext: '',
  row: Number.parseInt(process.argv[5], 10),
  column: Number.parseInt(process.argv[4], 10),
  clipboard: clipboardy.readSync(),
};
env.ext = fOp.getExtension(env.fileShort).substr(1);

module.exports = {
  env,
};
