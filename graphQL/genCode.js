const fsPromise = require('fs').promises;
const fs = require('fs');
const tOp = require('../Lib/text');
const { env } = require('../env');

Go();

async function Go() {
  // const ql = [];
  // const fsc = new fsClass()
  // fsc.skipDir = ['node_modules', '.idea', 'acl', 'utils'];
  // await fsc.goFiles('../../', async (file) => {
  //   if (file.ext === '.graphql') {
  //     console.log(file.currFile);
  //     const actions = getActions(file.name)
  //     const rt = groupGQL(parseGQL(await getFile(file.currFolder + '/' + file.currFile)));
  //     ql.push(...rt);
  //
  //   }
  // });

  //const file = await getFile(env.file);
  const file = await getFile('Workset.graphql');
  const rt = groupGQL(parseGQL(file));
  rt.forEach(el => { setDefaultHandlers(el); genCode(el); });
}

async function genCode(obj, isTimeStamp = true) {
  const sMt = '$[Mutations]', sQr = '$[Query]', sActs = '$[Actions]', acts = [];
  let posMt, posQr, posActs, rt;

  checkDir(obj.servDir); checkDir(obj.servDir + '/' + 'handlers');
  const tpl = (await getFile(__dirname + '/Templates/Service.tpl')).split('\n').map(s => {
    s = s.replace('$[TimeStamp]', isTimeStamp);
    s = s.replace('$[ServiceName]', obj.servName);
    posMt = s.indexOf(sMt); posQr = s.indexOf(sQr); posActs = s.indexOf(sActs);
    if(posMt !== -1) {
      rt = getDefMutations(obj, posMt)
      s = s.replace(sMt, rt);
    }
    if(posQr !== -1) {
      rt = getDefQuery(obj, posQr);
      s = s.replace(sQr, rt);
    }
    if(posActs !== -1) {
      s = s.replace(sActs, getCodeActions(obj, posActs));
    }
    return s;
  });

  const file = tpl.join('\n');
  await setFile(obj.servDir + obj.servName + '.service.js', file);
  await setFile(obj.servDir + obj.servName + '.graphql', obj.tmpFile);
  await genHandlers(obj);
}
async function genHandlers(obj) {
  // return ctx.call('validations.insert', {entity: {text: ctx.params.text}});

  const path = getDirService(obj.servName) + 'handlers/';
  let code = '', hs = [];
  obj.Mutation.fields.forEach(f => hs.push(f.name));
  obj.Query.fields.forEach(f => hs.push(f.name));

  for (const h of obj.Mutation.fields) {
    code = '\n// ' + getDeclaration(h) + '\n';
    code += 'export async function ' + h.name + '(ctx) {\n' + getCode(obj, h) + '\n}';
    await setFile(path + h.name + '.js', code);
  }
  for (const h of obj.Query.fields) {
    code = '\n// ' + getDeclaration(h) + '\n';
    code += 'export async function ' + h.name + '(ctx) {\n' + getCode(obj, h) + '\n}';
    await setFile(path + h.name + '.js', code);
  }

  let imp = '';
  hs.forEach(h => {
    imp += 'export * from \'./' + h + '\';\n';
  })
  await setFile(path + 'index.js', imp);
}
function getCode(obj, field) {
  //return ctx.call('validations.insert', {entity: {text: ctx.params.text}});
  let code = '', params = '';
  switch (field.name) {
    case 'add' + obj.name: case 'add' + obj.servNameOne:
      return tab(1) + 'return ' + _ctxCallSub(obj, field, 'insert', 'entity');
    case 'update' + obj.name: case 'update' + obj.servNameOne:
      return tab(1) + 'return ' + _ctxCall(obj, field, 'update');
    case 'remove' + obj.name: case 'remove' + obj.servNameOne:
      return tab(1) + 'await ' + _ctxCall(obj, field, 'remove') + '\n' + tab(1) + 'return true;';
    case obj.servNameOne: case obj.name:
      return tab(1) + 'return ' + _ctxCallMeta(obj, field, 'get');
    case obj.servName:
      code = tabInc() + 'return ' + ctxCall(obj, 'find', true); code = code.replace('$meta', ' meta: { $cache: false } ');
      if(existField('skip', field.params)) {
        params = tabInc() + 'limit: ctx.params.limit,' + tabNew() + 'offset: ctx.params.skip,' + tabDec();
      }
      code = code.replace('$params', params);
      //code = code.substr(0, code.length - 2) + ', { meta: { $cache: false } })';
      return code;
    case obj.servName + 'Count':
      code = tab(1) + 'return (await ' + _ctxCall(obj, field, 'find');
      code = code.substr(0, code.length - 2) + ', { meta: { $cache: false } })).length;';
      return code;
  }
  return code;
}
function ctxCall(obj, cmd, isMeta = false) {
  return 'ctx.call(\'' + obj.servName + '.' + cmd + '\', {$params}' + (isMeta ? ', {$meta}' : '') + ');';
}

function _ctxCallMeta(obj, field, cmd, nTab = 1) {
  let code = '';
  if (field.params.length <= 1) {
    code = 'ctx.call(\'' + obj.servName + '.' + cmd + '\', { ';
    code += field.params[0].name + ': ctx.params.' + field.params[0].name;
    code += ' }, { meta: { $cache: false } });';
    return code;
  } else {
    nTab++;
    code = 'ctx.call(\'' + obj.servName + '.' + cmd + '\', {\n';
    field.params.forEach((p, i) =>
      code += tab(nTab) + p.name + ': ctx.params.' + p.name + ',\n');
    code += tab(--nTab) + '}, { meta: { $cache: false } });';
    return code;
  }
}


function _ctxCall(obj, field, cmd, nTab = 1) {
  let code = '';
  if (field.params.length <= 1) {
    code = 'ctx.call(\'' + obj.servName + '.' + cmd + '\', { ';
    code += field.params[0].name + ': ctx.params.' + field.params[0].name;
    code += ' });';
    return code;
  } else {
    nTab++;
    code = 'ctx.call(\'' + obj.servName + '.' + cmd + '\', {\n';
    field.params.forEach((p, i) =>
      code += tab(nTab) + p.name + ': ctx.params.' + p.name + ',\n');
    code += tab(--nTab) + '});';
    return code;
  }
}


function _ctxCallSub(obj, field, cmd, sub, nTab = 1) {
  let code = '';
  if (field.params.length <= 1) {
    code = 'ctx.call(\'' + obj.servName + '.' + cmd + '\', { ' + sub + ': { ';
    field.params.forEach((p, i) =>
      code += p.name + ': ctx.params.' + p.name + ((i === field.params.length) ? ', ' : ''));
    code += ' }});';
    return code;
  } else {
    nTab++;
    code = 'ctx.call(\'' + obj.servName + '.' + cmd + '\', {\n' + tab(nTab++) + sub + ': {\n';
    field.params.forEach((p, i) =>
      code += tab(nTab) + p.name + ': ctx.params.' + p.name + ',\n');
    code += tab(--nTab) + '},\n' + tab(--nTab) + '});';
    return code;
  }
}
function _ctxCallPage(obj, field, cmd, sub = 'query', nTab = 1) {
  let code = '';
  nTab++;
  code = 'ctx.call(\'' + obj.servName + '.' + cmd + '\', {\n' + tab(nTab++) + sub + ': {\n';
  field.params.forEach((p, i) =>
    code += tab(nTab) + p.name + ': ctx.params.' + p.name + ',\n');
  code += tab(--nTab) + '},\n' + tab(--nTab) + '});';
  return code;
}

function setDefaultHandlers(obj) {
  let s = 'extend type Mutation {\n    add' + obj.name + '(' + getParams(obj) + '): ' + obj.name + '\n';
  s += '    update' + obj.name + '(id: ObjID!, ' + getParams(obj) + '): ' + obj.name + '\n';
  s += '    remove' + obj.name + '(id: ObjID!): ' + obj.name + '\n}\n\n';

  s += 'extend type Query {\n    ' + obj.servNameOne + '(id: ObjID!): ' + obj.name + '\n';
  s += '    ' + obj.servName + '(' + getParams(obj) + '): [' + obj.name + ']\n';
  s += '    ' + obj.servName + 'Count(' + getParams(obj) + '): Int\n}';

  //obj.tmpFile += '\n' + s;

  const rt = parseGQL(s), Mutations = rt[0], Query = rt[1];
  if(obj.Mutation) {
    Mutations.fields.forEach(mt => {
      if(!existField(mt.name, obj.Mutation.fields))
        obj.Mutation.fields.push(mt);
    })
  } else obj.Mutation = Mutations;

  if(obj.Query) {
    Query.fields.forEach(qr => {
      if(!existField(qr.name, obj.Query.fields))
        obj.Query.fields.push(qr);
    })
  } else obj.Query = Query;
}
function existField(name, obj) {
  for(let f of obj)
    if(name === f.name) return true;
  return false;
}
function existAction(action, root) {
  const result = false;
  result = existField()
}
function getDefMutations(obj, nSpace) {
  let rt = '', fst = true;
  obj.Mutation.fields.forEach(mt => {
    rt += (!fst ? space(nSpace) : '') + mt.name + ': { action: \'' + mt.name + '\' },\n';
    if(fst) fst = false;
  });
  return rt.trim();
}
function getDefQuery(obj, nSpace, isSkipLimit = true) {
  let rt = '', fst = true;
  obj.Query.fields.forEach(qr => {
    rt += (!fst ? space(nSpace) : '') + qr.name + ': { action: \'' + qr.name + '\' },\n';
    if(fst) fst = false;
  });
  return rt.trim();
}
function getDeclaration(field) {
   let s = field.name + '(';
   let sparams = '';
   field.params.forEach(p => sparams += p.name + ': ' + p.type +', ');
   sparams = sparams.substr(0, sparams.length - 2);
   s += sparams + ')' + field.type.type;
   return s;
}
function getCodeActions(obj, nSpace) {
  let rt = '';
  obj.Mutation.fields.forEach(s => {
    rt += space(nSpace) + s.name + ': { handler: handlers.' + s.name + " },\n";
  });
  obj.Query.fields.forEach(s => {
    rt += space(nSpace) + s.name + ': { handler: handlers.' + s.name + " },\n";
  })
  return rt.trim();
}
function getParams(obj) {
  let s = ''
  obj.fields.forEach(fld => {
    if(fld.isArray) return;
    switch (fld.name) {
      case 'id':
      case 'createdAt':
      case 'updatedAt':
        return;
      default:
        s += fld.name + ': ' + getCodeGQLType(fld) + ', ';
    }
  });
  return s.substr(0, s.length - 2);
}
function getCodeGQLType(type) {
  return type.type + (type.isRoot ? '!' : '');
}

// GraphQL
function parseGQL(txt) {
  const result = []; let i; let obj; let el;
  const els = tOp.getFunctions(txt);
  for (i = 0; i < els.length; i += 1) {
    el = els[i];
    // obj = getGQLName(el.var);
    // obj.fields = ((obj.name === 'Query') || (obj.name === 'Mutation'))
    //   ? getGQLResolvers(spl[i + 1]) : getGQLFields(spl[i + 1]);
    // obj.isRoot = getRoot(obj);
    // if(obj.isRoot) obj.tmpFile = txt;
    // result.push(obj);
  }

  let spl = splitQuotes(trimText(txt), '{}').map(s => s.trim()).filter(s => !!s);
  for (i = 0; i < spl.length; i += 2) {
    obj = getGQLName(spl[i]);
    obj.fields = ((obj.name === 'Query') || (obj.name === 'Mutation'))
      ? getGQLResolvers(spl[i + 1]) : getGQLFields(spl[i + 1]);
    obj.isRoot = getRoot(obj);
    if(obj.isRoot) obj.tmpFile = txt;
    result.push(obj);
  }
  return result;
}
function groupGQL(ls) {
  let i, j, iSt = 0, root, rt = [];
  for(i = 0; i < ls.length; i++) {
    if(ls[i].isRoot) {
      root = ls[i]; root.els = [];
      if(iSt !== i) { // Включаем до рута
        for (j = iSt; j < i; j++) root.els.push(ls[j]);
      }
      // Включаем до Query, либо до следующего рута
      for(j = i + 1; j < ls.length; j++) {
        if(ls[j].name === 'Mutation') { root.Mutation = ls[j]; continue; }
        if(ls[j].name === 'Query') { root.Query = ls[j]; i = iSt = j + 1; break; }
        if(ls[j].isRoot) { i = iSt = j + 1; break; }
        root.els.push(ls[j]);
      }
      root.servName = toService(root.name);
      root.servNameOne = toServiceOne(root.name);
      root.servDir = getDirService(root.servName);
      rt.push(root);
    }
  }
  return rt;
}
function connectGQL(objs) {
  let i, j;
  for(i = 0; i < objs.length; i++)
    for(j = i + 1; j < objs.length; j++)
    {

    }
}
function getRoot(obj) {
  if(obj.type !== 'type') return false;
  let isRoot = false;
  obj.fields.forEach(f => { if(f.name === 'id') isRoot = true; });
  return isRoot;
}
function getGQLType(txt) {
  const obj = {};
  if(!txt) return obj;
  const spl = txt.split('=');
  obj.type = spl[0].trim();
  if(spl[1]) obj.def = spl[1].trim();
  if(obj.type[0] === '[') obj.isArray = true;
  const pos = obj.type.indexOf('!')
  if(pos !== -1) {
    obj.type = obj.type.replace('!', '');
    obj.isRequare = true;
  }
  return obj;
}
function getGQLFields(txt, separator = '\n') {
  return txt.split(separator).map(s => {
    const field = s.split(':');
    const obj = getGQLType(field[1]);
    obj.name = field[0].trim();
    return obj;
  });
}
function getGQLResolvers(txt) {
  return txt.split('\n').map(s => {
    const spl = splitQuotes(s, '()');
    const obj = {};
    obj.name = spl[0].trim();
    obj.params = getGQLFields(spl[1], ',');
    obj.type = getGQLType(spl[2]);
    return obj;
  })
}
function getGQLName(txt) {
  const spl = txt.split(' ');
  if ((spl.length === 3) && (spl[0] === 'extend')) spl.splice(0, 1);
  return { name: spl[1], type: spl[0] };
}
async function getActions(service) {
  const result = [];
  let start = false, pos = -1, spl;
  (await getFile(getFileService(service))).split('\n').forEach(s => {
    if(s.trim().startsWith('action')) { start = true; return ; }
    if(start) {
      if(pos === -1) pos = getTab(s);
      spl = s.split(':');
      if((getTab(s) === pos) && (spl.length > 1)) result.push(spl[0].trim());
    }
  });
  return result;
}
function getFileService(service) {
  return getDirService(service) + service + '.service.js';
}
function getDirService(service) {
  return  __dirname + '/services/' + service + '/';
}
// String operations - splitQuotes(txt, '{}')
function splitQuotes(txt, ch) {
  let els = txt.split(ch[0]), sub;
  for(let i = 0; i < els.length; i++) {
    sub = els[i].split(ch[1]);
    if (sub.length === 2) {
      els[i] = sub[0];
      els.splice(i++ + 1, 0, sub[1]);
    }
  }
  return els;
}
function trimText(txt) {
  return txt.split('\n').map(s => {
    return s.split('#')[0];
  }).filter(s => !!s).join('\n');
}
function toServiceOne(service) {
  service = service[0].toLowerCase() + service.slice(1)
  return service;
}
function toService(service) {
  service = service[0].toLowerCase() + service.slice(1)
  service += service[service.length - 1] === 's' ? 'es' : 's';
  return service;
}

let tabSize = 2, nTab = 0;
const space = (nSpace) => ''.padStart(nSpace);
function tabInc() { nTab++; return tabNew(); }
function tabNew() { return '\n' + space(nTab * tabSize); }
function tabDec() { nTab--; return tabNew(); }
const tab = (nTab) => space(nTab * tabSize);
function getTab(s) {
  let i = 0;
  while (s[i++] === ' ');
  return i - 1;
}
// File IO
async function getFile(path) {
  return (await fsPromise.readFile(path, 'utf8')).toString();
}
async function setFile(path, file) {
  return (await fsPromise.writeFile(path, file));
}
function checkDir(path) {
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  } catch (e) {
    console.log(e);
  }
}
// Iterators
function research(DBObj)
{
  console.log(DBObj.modelName)
  const obj = DBObj.schema.obj
  goObj(obj, (key, value) => {
    let type, s, ref, required, defValue, array;
    if (value[0]) {
      array = true;
      value = value[0];
    }
    type = value.name || value.type.name;
    required = value.required;
    defValue = value.default;
    ref = value.ref;
    s = key + '| ' + type;
    if(array) s += '| array';
    if(required) s += '| ' + "required";
    if(defValue !== undefined) s += '| default: ' + defValue;
    if(ref) s += '| ' + ref;
    console.log(s.padStart(s.length + 3))
  });
}
function goObj(obj, exec) {
  let key, value;
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    value = obj[key]
    if (exec(key, value)) break;
  }
}
function goText(txt, exec) {
  let line = 0;
  const spl = txt.split('\n');
  spl.forEach(s => exec(s, line++));
}
async function goFile(file, exec) {
  const txt = await getFile(file);
  goText(txt, exec);
}

module.exports = {
  space,
  getTab,
  Go,
}
