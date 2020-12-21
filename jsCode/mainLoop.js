const fop = require('../Lib/fileio');
const lib = require('../graphQL/genCode');
const tx = require('../Lib/text');
const measure = require('./tracer/measure');
const { env } = require('../env');
const cs = tx.cs;

let testMode = false;
const fc = new fop.FileClass();
fc.skipDir = ['node_modules', 'mixins', 'upload', 'uploadfolder', '.git', '.idea'];
let sLib = ''; let lastProj = '';

const go = async (exec, ext = ['.js']) => {
  let whole = 0; const promises = []; let lastResult = null;
  const project = tx.tDiv(env.project, '/', true);
  sLib = `const { traceMark } = require('${__filename}')`;
  if (project[1] === 'cfw') {
    lastProj = 'cfw';
    sLib = 'const { traceMark } = require(\'../../genCode/tracer\')';
  }
  console.log(cs.black + 'Scanning' + cs.reset + ' %s/' + cs.blue + '%s' + cs.reset, ...project);
  await fc.goFiles(env.project, (obj) => {
    if (!ext.includes(obj.ext)) return null;
    promises.push(exec(obj.currFile).then(r => {
      if (!r) return null;
      if (r.nPoints) whole += r.nPoints;
      if (r.isBreakAll) {
        obj.needBreak = true;
        lastResult = r;
      }
    }));
  });
  await Promise.all(promises);
  return lastResult || { nPoints: whole };
};

function isOpenQ(s) {
  const match = s.match(/(`)/mg);
  if (match && match.length) return ((match.length % 2) === 1);
  return false;
}
const cmdResult = (isBreakFile, isBreakAll, func = null, params = null) => ({ isBreakFile, isBreakAll, func, params });
async function execCmd(s) {
  console.log(cs.gold + ' --> ' + cs.cyan + '%s' + cs.reset, s);
  switch (s) {
    case 'pss': return cmdResult(true, true, measure);
    case 'ps': break;
    case 'cl':
      const path = lastProj === 'cfw' ? '/home/tscoder/Projects/cfw/packages/api/src/genCode/log' : `${__dirname}/log`;
      fop.execCmd(`sudo chmod -R 777 ${path}`);
      console.log(`${cs.yellow}Clear Log Directory: ${cs.blue}${path}${cs.reset}`);
      await fop.rmDir(`${path}`, false);
      return cmdResult(true, true);
    default: return null;
  }
}

async function mark(file) {
  const rTrace = /^\s*(?<value>(\w+\d*)(\.\w+\d*)*(\[.*\])?)\s*$/mg;
  let enable = true; let isGQL = false; let isBreak = false; let isLog = false; let saveFile = false;
  let i; let n = 0; let sMark = ''; let cmd; let s; let sNext; let sTrim; let showFile = false;
  let isLib = false; let drop = false;
  const lines = await fop.getFileLines(file);
  const skip = ['await'];

  for (i = 0; i < lines.length; i += 1) {
    s = lines[i]; sTrim = s.trim(); isLog = false;
    if (i + 1 < lines.length) sNext = lines[i + 1].trim(); else sNext = '';
    if (sTrim === sLib) isLib = true;
    if (isGQL) { if (isOpenQ(s)) isGQL = false; } else isGQL = isOpenQ(s);
    enable = !isGQL;
    if (enable && s.match(rTrace)) {
      if (sNext && (sNext.startsWith('.') || sNext.startsWith(']'))) continue;
      if (skip.includes(sTrim)) continue;
      if (!showFile) {
        console.log(cs.black + 'Module' + cs.reset + ': %s/' + cs.pink + '%s' + cs.reset, ...tx.tDiv(file, '/', true));
        showFile = true;
      }
      console.log(cs.gold + ' • ' + cs.black + 'TracePoint' + cs.reset + ' [' + cs.spring + ' %d ' + cs.reset + ']: '
        + cs.cyan + '%s' + cs.reset, (i + 1), sTrim);
      saveFile = true;
      cmd = await execCmd(sTrim);
      if (cmd) {
        lines.splice(i, 1); drop = true;
        isBreak = cmd.isBreakFile || cmd.isBreakAll;
        if (isBreak) break;
      }
      sMark = `${lib.space(lib.getTab(s))}traceMark(__filename, ${sTrim}, '${sTrim}');`;
      lines[i] = sMark; n += 1;
    }
  }
  if (saveFile) {
    if (!isLib && !isBreak) lines.unshift(sLib);
    if (!testMode) await fop.setFileLines(file, lines);
  }
  const rt = (isBreak) ? cmd : { nPoints: n };
  if (drop) rt.dropCnt = true;
  return rt;
};

let curr = 0;
const traceMark = (pathTrace, obj, sObj, sDir = '', saveAs = '') => {
  if (!obj) return;
  const nf = curr; curr += 1;
  const path = `${__dirname}/log/${sDir ? `${sDir}/` : ''}`;
  const content = tx.sObj(obj, true);
  const fileName = (saveAs === '') ? `${path}${nf.toString().padStart(5, '0')}_${sObj}.txt` : `${path}${saveAs}.txt`;
  if (sDir) {
    fop.mkDir(path).then(() => {
      fop.setFile(fileName, content).then(() => {});
    });
  } else {
    fop.setFile(fileName, content).then(() => {});
  }
};

const rollback = async (file) => {
  let i; let s; let showFile = false; let wasTrace = false; let saveFile = false; let point;
  const lines = await fop.getFileLines(file);

  for (i = 0; i < lines.length; i += 1) {
    s = lines[i]; wasTrace = false;
    if (s.startsWith('const { traceMark } = require(')) {
      console.log(cs.black + 'Remove:' + cs.reset + ' %s', s);
    }
    if (s.trim().startsWith('traceMark(')) {
      point = s.match(/\'(.*)\'/mg)[0]; point = point.substr(1, point.length - 2);
      console.log(cs.red + ' x' + cs.black + ' TracePoint: ' + cs.reset + '%s' + cs.cyan
        + '%s' + cs.reset + '%s', ...tx.tDiv(s.trim(), point, false, true));
    }
    if (s.startsWith('const { traceMark } = require(') || (s.trim().startsWith('traceMark('))) {
      lines.splice(i, 1);
      i -= 1; wasTrace = true;
      saveFile = true;
    }
    if (wasTrace) {
      if (!showFile) { console.log(cs.black + 'Module' + cs.reset + ': %s/' + cs.pink + '%s' + cs.reset,
        ...tx.tDiv(file, '/', true));
      showFile = true;
      }
    }
  }
  if (saveFile && !testMode) await fop.setFileLines(file, lines);
};

let markCount = 0;
const markProject = async (isTestMode) => {
  let rt; let dropCnt = false;
  testMode = isTestMode;
  if (testMode) console.log(`${cs.bar + cs.bgBlue + cs.yellow} Test Mode ${cs.reset}`);
  const conf = await fop.getObj('main.cfg');
  rt = await go(mark);
  while (true) {
    if (rt.dropCnt) dropCnt = true;
    if (rt.func) rt = await go(rt.func);
    else break;
  }
  if (!dropCnt && (rt.nPoints !== undefined) && (rt.nPoints === 0)) conf.nEmpty += 1; else conf.nEmpty = 0;
  if (conf.nEmpty > 1) {
    console.log(cs.green + 'Rollback' + cs.reset + '...');
    await go(rollback);
    conf.nEmpty = 0;
  }
  await fop.setObj('main.cfg', conf);
};

module.exports = {
  traceMark,
  markProject,
};
