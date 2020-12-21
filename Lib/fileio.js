const fs = require('fs');
const { exec } = require('child_process');
const fsPromise = require('fs').promises;
const { cs } = require('./text');

class FileClass {
  currFolder;
  currFile;
  currFiles;
  filename;
  name;
  ext;
  level;
  skipDir;
  needSkipFile;
  needSkipFolder;
  needBreak;
  isFolder;

  constructor(root = '') {
    this.level = 0;
    this.drop();
  }

  drop() {
    this.needSkipFile = this.needSkipFolder = false;
  }

  async goFiles(root, onFile) {
    this.currFolder = root || __dirname;
    let files;
    try {
      files = await fsPromise.readdir(this.currFolder, { withFileTypes: true });
    } catch (e) {
      console.log(e.message);
      this.drop();
      return;
    }
    this.currFiles = files;
    for (let file of files) {
      this.drop();
      this.filename = file.name;
      this.currFile = this.currFolder + '/' + this.filename;
      const symbols = Object.getOwnPropertySymbols(file)
      this.isFolder = (file[symbols[0]] === 2);
      if (this.isFolder) {
        if (this.skipDir && this.skipDir.includes(file.name)) continue;
        onFile(this);
        if (this.needBreak) return;
        if (this.needSkipFile) continue;
        if (this.needSkipFolder) { this.drop(); return; }
        const saveDir = this.currFolder;
        //this.currFolder += '/' + file.name;
        this.level++;
        await this.goFiles(this.currFile, onFile)
        this.level--;
        this.currFolder = saveDir;
        if (this.needBreak) return;
      } else {
        this.ext = getExtension(file.name);
        this.name = getName(file.name);
        onFile(this);
        if (this.needBreak) return;
        this.name = this.ext = '';
        if (this.needSkipFile) continue;
        if (this.needSkipFolder) { this.drop(); return; }
      }
    }
  }
}

function getExtension(filename) {
  const i = filename.lastIndexOf('.');
  return (i < 0) ? '' : filename.substr(i);
}
function getName(filename) {
  const i = filename.lastIndexOf('.');
  return (i < 0) ? '' : filename.substr(0, i);
}
const setFile = async (file, s) => fsPromise.writeFile(file, s, 'utf8');
const getFile = async file => (await fsPromise.readFile(file, 'utf8')).toString();
const getFileLines = async file => (await fsPromise.readFile(file, 'utf8')).toString().split('\n');
const setFileLines = async (file, lines) => fsPromise.writeFile(file, lines.join('\n'), 'utf8');
const setObj = async (file, obj) => setFile(file, JSON.stringify(obj, null, 2));
const getObj = async file => JSON.parse(await getFile(file));
const mkDir = async (sDir) => {
  let exist = fs.existsSync(sDir);
  if (exist) return;
  const trace = sDir.split('/');
  let path = '/';
  const promises = [];

  trace.forEach((sub) => {
    if (!sub) return;
    path += `${sub}/`;
    exist = fs.existsSync(path);
    if (!exist) {
      promises.push(fsPromise.mkdir(path));
    }
  });

  try {
    await Promise.all(promises);
  } catch (e) {
    console.log(`Error ${cs.red}${e.message}${cs.reset}`);
  }
};
const rmDir = async (path, delPath = true) => {
  try {
    if (!fs.existsSync(path)) return null;
    const files = await fs.promises.readdir(path, { withFileTypes: true });
    const promises = [];
    files.forEach((file) => {
      if (file.isDirectory()) promises.push(rmDir(`${path}/${file.name}`));
      else {
        fs.chmodSync(`${path}/${file.name}`, '777');
        promises.push(fs.promises.unlink(`${path}/${file.name}`));
      }
    });
    await Promise.all(promises);
    if (delPath) await fs.promises.rmdir(path);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

const execCmd = (cmd) => {
  exec(cmd, (error, stdout, stderr) => {
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  });
};

module.exports = {
  FileClass,
  getFile,
  setFile,
  getFileLines,
  setFileLines,
  getExtension,
  getObj,
  setObj,
  mkDir,
  rmDir,
  execCmd,
};
