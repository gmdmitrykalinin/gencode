const stringify = require('json-stringify-safe');

const rKeys = /((?<key>.*)\s+:\s+(?<value>.*))/mg;
const trim = (str, chars) => str.split(chars).filter(Boolean).join(chars);
function clone(obj) {
  const result = {};
  if (obj) {
    Object.keys(obj).forEach((key) => {
      result[key] = obj[key];
    });
  }
  return result;
}
function goReg(reg, text, exec) {
  let part;
  do {
    part = reg.exec(text);
    if (!part) break;
    if (exec(part.groups)) break;
  } while (part && (part.index !== text.length));
}
function goRegArray(reg, text, exec) {
  const result = [];
  goReg(reg, text, (groups) => { result.push(exec ? exec(groups) : clone(groups)); });
  return result;
}
function partition(ls, predicate) {
  let sub = []; const rt = [];
  for (let i = 0; i < ls.length; i += 1) {
    sub.push(ls[i]);
    if (predicate(ls[i], i)) {
      rt.push(sub);
      sub = [];
    }
  }
  return rt;
}
function crossCompare(items, exec, distance = 0) {
  let item;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (distance && (j - i) > distance) break;
      item = exec(items[i], items[j], i, j);
      if (item === items[i]) {
        items.splice(i, 1); i -= 1;
        break;
      }
      if (item === items[j]) {
        items.splice(j, 1); j -= 1;
      }
    }
  }
};
function setInt(ls, key) {
  for (let i = 0; i < ls.length; i += 1) {
    ls[i][key] = Number.parseInt(ls[i][key], 10);
  }
  return ls;
};
const getObj = (text, reg) => {
  let obj = reg.exec(text);
  if (obj && obj.groups) obj = clone(obj.groups);
  return obj || {};
};
const getText = (text, reg) => {
  const obj = reg.exec(text);
  if (obj && obj.groups) return obj.groups.text;
  return '';
};
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
const tDiv = (text, divider, isLast = false, putDivider = false) => {
  const pos = isLast ? text.lastIndexOf(divider) : text.indexOf(divider);
  if (pos !== -1) {
    const rt = [];
    rt.push(text.substr(0, pos));
    if (putDivider) rt.push(divider);
    rt.push(text.substr(pos + divider.length));
    return rt;
  }
  return null;
};
const matchCount = (text, sub) => {
  let n = 0;
  if (typeof sub === 'string') {
    let pos = 0;
    while ((pos = text.indexOf(sub, pos)) !== -1) { n++; pos++; }
  } else n = text.match(sub).length || 0;
  return n;
};
const getStart = (text, divider, isLast = false) => {
  const pos = isLast ? text.lastIndexOf(divider) : text.indexOf(divider);
  if (pos !== -1) return text.substr(0, pos);
  return text;
};
const getEnd = (text, divider, isLast = false) => {
  const pos = isLast ? text.lastIndexOf(divider) : text.indexOf(divider);
  if (pos !== -1) return text.substr(pos + divider.length);
  return '';
};
const sObj = (obj, showType = true) => {
  const type = showType ? typeof obj : undefined;
  let name = (type === 'object' && obj.constructor && obj.constructor.name) ? obj.constructor.name : '';
  if (name === 'Object') name = '';

  let value = '';
  switch (name) {
    case 'Map':
      if (obj.size) obj.forEach((v, k) => value += `${k}: [ ${sObj(v, showType)} ]\n`);
      else for (let key in obj) value += `${key}: [ ${sObj(obj[key], showType)} ]\n`;
      break;
    default: value = stringify(obj, null, 2);
  }
  return `${type ? `${type}\n` : ''}${type && name ? `${name}\n` : ''}${showType ? '\n' : ''}${value}`;
};
const getBracers = (text, iPos = 0, br = '{}') => {
  let iStart = iPos; let iOpen; let iClose; let lvl = 0;
  while (true) {
    iOpen = text.indexOf(br[0], iPos);
    if (iOpen === -1) iOpen = text.length;
    iClose = text.indexOf(br[1], iPos);
    if (iClose === -1) { iClose = text.length; break; }
    if (iOpen < iClose) { if (!lvl) iStart = iOpen; lvl += 1; iPos = iOpen + 1; }
    else {
      lvl -= 1;
      if (!lvl) break; else iPos = iClose + 1;
    }
  }
  return text.slice(iStart, iClose + 1);
}
const getFunctions = (text) => {
  let iPos = 0; let iQuote; const rt = [];
  let declaration; let body;
  while ((iQuote = text.indexOf('{', iPos)) !== -1) {
    declaration = text.slice(iPos, iQuote);
    body = getBracers(text, iQuote);
    rt.push({declaration, body});
    iPos = iQuote + body.length;
  }
  return rt;
}
const getCmt = (text, ch = '//') => {
  let iPos = 0; let iEnd; const rt = [];
  while ((iPos = text.indexOf(ch, iPos)) !== -1) {
    iEnd = text.indexOf('\n', iPos + 1);
    if (iEnd === -1) iEnd = text.length;
    rt.push(text.slice(iPos + ch.length, iPos));
    iPos += 1;
  }
}
const getGQLFunction = (text) => {

}
const getGQLFunctions = (text) => getFunctions(text).map(fn => getGQLFunction(fn));

class Bracers {
  lvlBrace;

  lvlArray;

  lvlRound;

  constructor() {
    this.drop();
  }

  calc(s) {
    this.lvlBrace += matchCount(s, '{') - matchCount(s, '}');
    this.lvlArray += matchCount(s, '[') - matchCount(s, ']');
    this.lvlRound += matchCount(s, '(') - matchCount(s, ')');
  }

  drop() {
    this.lvlBrace = 0;
    this.lvlArray = 0;
    this.lvlRound = 0;
  }
}
const cs = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  reg: '\x1b[2m',
  italic: '\x1b[3m',
  under: '\x1b[4m',
  inv: '\x1b[7m',
  not: '\x1b[9m',
  bar: '\x1b[51m',
  light: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  gold: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  spring: '\x1b[36m',
  white: '\x1b[37m',
  bgLight: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgGold: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgSpring: '\x1b[46m',
  bgWhite: '\x1b[47m',
  dark: '\x1b[90m',
  corral: '\x1b[91m',
  olive: '\x1b[92m',
  yellow: '\x1b[93m',
  sky: '\x1b[94m',
  pink: '\x1b[95m',
  cyan: '\x1b[96m',
  black: '\x1b[97m',
  bgDark: '\x1b[100m',
  bgCorral: '\x1b[101m',
  bgOlive: '\x1b[102m',
  bgYellow: '\x1b[103m',
  bgSky: '\x1b[104m',
  bgPink: '\x1b[105m',
  bgCyan: '\x1b[106m',
  bgBlack: '\x1b[107m',
};

module.exports = {
  cs,
  tDiv,
  getStart,
  getEnd,
  getObj,
  getText,
  matchCount,
  getBracers,
  getFunctions,
  Bracers,
  sObj,
};

const rt = getFunctions(`# _workset

type Workset {
    id: ObjID!
    businessJustification: String
    FRRReference: String
    schedule: String
    tags: [String]
    rules: [Rule]
    owner: String
    lastUpdater: String
    tasks: [String]
    worksetStatus: WorksetStatusEnum
    mockMode: Boolean
    # see [200120183000]
    integralStatus: String
    typeOfTest: TypeOfTestEnum
    isNegative: Boolean
    lastActivityTime: DateTime
    createdAt: DateTime
    updatedAt: DateTime
    testId: String
    lastTaskStatuses: [TaskStatus]
    lastBatchWorks: [Work]
    validationRuleSets: [ValidationRuleSet]
}
enum TypeOfTestEnum {
    frontend
    backend
}
enum WorksetStatusEnum {
    created
    running
    stopped
    done
}

enum PlatformEnum { linux windows }

type SourceHost {
    ip: String
    mask: Int
    domainName: String
}

type TargetHost {
    ip: String
    mask: Int
    ports: [String]
    domainName: String
}

type TargetHostB {
    ip: String
    mask: Int
}

type Rule {
    id: ObjID!
    protocols: [String!]!
    sourceHost: SourceHost
    targetHost: TargetHost
    sshauth: SSHAuth
    # see [200120183000]
    integralStatus: String
    platform: PlatformEnum
}

input TargetHostInput {
    ip: String
    mask: Int
    ports: [String]
}

input SourceHostInput {
    ip: String
    mask: Int
}


type IpPair {
    sourceIP: String!
    targetIP: String!
    # see-[200120183300]
    lastTestStatus: String
}

type RuleUnits {
    businessJustification: String
    FRRReference: String
    tags: [String]
    schedule: String
    protocols: [String]
    ports: [String]
    tasks: [String]
    sourceHost: SourceHost
    targetHost: TargetHost
    segmentElementsCount: Int
    segmentElements: [IpPair]
    debugInfo: DebugInfo
}

input RuleUnitsFilterInput {
    findString: String
    # see-[200120183300]
    lastTestStatuses: [String]
}

# --- ---

type MetaFind {
    isChecked: Boolean
    count: Int
}

type ProtocolsFind {
    value: ProtocolEnum!
    metaFind: MetaFind
}

type PortsFind {
    value: String!
    metaFind: MetaFind
}

type StringsFind {
    value: String!
    metaFind: MetaFind
}

type IdAndName {
    id: String
    name: String
}

type IdAndNameFind {
    value: IdAndName
    metaFind: MetaFind
}

type TimeRangeFacet {
    count: Int
    range: String
}

input TimeRangeInput {
    start: DateTime,
    end: DateTime,
}

# [[200130162400]]
input WorksetsFilterInput {
    businessJustification: [String!]
    FRRReference: [String!]
    tags: [String!]
    bjOrTag: String

    ip: String
    sourceIP: String
    targetIP: String

    ipAndMask: String
    ipAndMaskSource: String
    ipAndMaskTarget: String

    sourceIPMask: Int
    targetIPMask: Int
    mask: Int

    domainNames: [String!]

    protocols: [ProtocolEnum!]
    ports: [String!]
    tasks: [String!]

    # user ids
    userCreators: [String!]
    # user ids
    userLastUpdaters: [String!]
    # user ids
    users: [String!]

    findString: String

    typeOfTest: TypeOfTestEnum = backend
    lastActivityTime: TimeRangeInput
}

type TaskStatus { task: String status: String }

type FindParams {
    findString: String
    businessJustifications: [StringsFind!]
    FRRReferences: [StringsFind!]
    protocols: [ProtocolsFind!]
    ports: [PortsFind!]
    tags: [StringsFind!]
    tasks: [StringsFind!]
    luisResult: String
    userCreators: [IdAndNameFind!]
    userLastUpdaters: [IdAndNameFind!]
    users: [IdAndNameFind!]
    domainNames: [StringsFind!]
    lastActivityTime: [TimeRangeFacet]
}

type DebugInfo {
    statusesGetDuration: Int
}

type WorksetsPlus {
    worksetCollection: [Workset]
    worksetsCount: Int!
    findParams: FindParams
}

input RuleInput {
    id: ObjID
    protocols: [String]
    sourceHost: SourceHostInput
    targetHost: TargetHostInput
    sshauth: ObjID
    platform: PlatformEnum
}

input WorksetInput {
    businessJustification: String
    FRRReference: String
    # cron string
    schedule: String
    tags: [String]
    tasks: [String]
    rules: [RuleInput]
    mockMode: Boolean
    typeOfTest: TypeOfTestEnum
    isNegative: Boolean
    validationRuleSets: [ObjID]
}

# --- ---

type WorkSetResultStats {
    total: Int
    passed: Int
    failed: Int
    items: [WorkSetResultStatsItem]
}

type WorkSetResultStatsItem {
    time: DateTime
    passed: Int
    failed: Int
}

input WorkSetResultStatsFilter {
    worksetId: ObjID
    rule: ID
    task: [String]
    sourceIP: String
    targetIP: String
    protocol: [String]
    workStatus: [String]
}

type WorkSetRunStats {
    total: Int
    scheduled: Int
    completed: Int
    items: [WorkSetRunStatsItem]
}

type WorkSetRunStatsItem {
    time: DateTime
    scheduled: Int
    completed: Int
}

enum WorksetsRunStatsGroupBy {
    batch
    workset
}

extend type Query {
    # graphql-[[191128122800]], resolver [191128123947], realise [200228144400]
    worksets(skip: Int = 0, limit: Int = 100, filter: WorksetsFilterInput = {}, sort: String): WorksetsPlus
    workset(id: ObjID): Workset
    worksetCount: Int
    worksetUniqIpCount: Int
    # resolver [200203144300]; realise [200229172000]
    ruleUnits(skip: Int = 0, limit: Int = 100, ruleId: String!, filter: RuleUnitsFilterInput): RuleUnits

    # realise [200302162800], resolver [200302162500]
    ruleStatistics(ruleId: String!): StartDateTimesStatistic

    worksetsResultStats(start: DateTime! end: DateTime! interval: String): WorkSetResultStats
    worksetsRunStats(
        start: DateTime!
        end: DateTime!
        interval: String
        groupBy: WorksetsRunStatsGroupBy = workset
    ): WorkSetRunStats
}

extend type Mutation {
    # graphql-[[191128110400]], resolver [191128104752]
    createWorkset(input: WorksetInput!):Workset

    copyWorkset(id: ObjID!, n: Int = 1): Int

    updateWorkset(id: String!, input: WorksetInput!):Workset

    # graphql-[[191217160600]]
    deleteWorkset(id: String!): Int

    deleteWorksetAll(NameContains: String = ""): Int

    # graphql-[[191228164400]]
    runWorkset(id: String!): Boolean

    runWorksetAll(NameContains: String = ""): Int

    stopWorkset(id: String!): Boolean

    stopWorksetAll(NameContains: String = ""): Int

    debug(data: String!, data2: String): String

}
`);
console.log(rt);
