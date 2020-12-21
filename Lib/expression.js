const { getObj, getText } = require('../Lib/text');

let evaluate;
const getQuotes = (cmd, iStart) => {
  let i; let start; let level = 0;
  for (i = iStart; i < cmd.length; i += 1) {
    if (cmd[i] === '(') {
      if (!level) start = i;
      level += 1;
    }
    if (cmd[i] === ')') {
      level -= 1;
      if (!level) return { start, end: i };
    }
  }
  return null;
}
const expandQuotes = (cmd, obj) => {
  let pos = getQuotes(cmd, 0);
  if (pos) return cmd.slice(0, pos.start) + evaluate(cmd.slice(pos.start + 1, pos.end), obj) + cmd.slice(pos.end + 1, cmd.length);
  return cmd;
};
const divider = (cmd, op, split) => {
  const pos = cmd.indexOf(op);
  if (pos === -1) return undefined;
  console.log(`Operand: ${cmd.slice(0, pos)} [${op}] ${cmd.slice(pos + op.length, cmd.length)}`);
  return split(cmd.slice(0, pos), cmd.slice(pos + op.length, cmd.length));
};

const func = (cmd, sFunc, obj) => {
  let pos = cmd.indexOf(sFunc);
  if (pos === -1) return undefined;
  pos = getQuotes(cmd, pos);
  return cmd.slice(0, pos.start) + evaluateFunc(sFunc, cmd.slice(pos.start + 1, pos.end), obj) + cmd.slice(pos.end + 1, cmd.length);
}
const evaluateFunc = (sFunc, params, obj) => {
  console.log(`Function: ${sFunc} (${params})`);
}
const extract = (field, obj) => {
  const fields = field.split('.');

}

const rFunc = /(?<text>\w+\d*)\s?\(/
evaluate = (cmd, obj) => {
  let s = cmd.trim(); let result = undefined;
  console.log('Start: ' + cmd);

  if (cmd.match(rFunc)) evaluate(func(cmd, getText(cmd, rFunc), obj));
  s = expandQuotes(s, obj);
  if (s !== cmd.trim()) console.log('Quotes: ' + s);

  result = divider(s, '&&', (left, right) => evaluate(left, obj) && evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '||', (left, right) => evaluate(left, obj) || evaluate(right, obj)); if (result !== undefined) return result;

  result = divider(s, '>=', (left, right) => evaluate(left, obj) >= evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '>', (left, right) => evaluate(left, obj) > evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '<=', (left, right) => evaluate(left, obj) <= evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '<', (left, right) => evaluate(left, obj) < evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '==', (left, right) => evaluate(left, obj) === evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '!=', (left, right) => evaluate(left, obj) !== evaluate(right, obj)); if (result !== undefined) return result;

  result = divider(s, '+', (left, right) => evaluate(left, obj) + evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '-', (left, right) => evaluate(left, obj) - evaluate(right, obj)); if (result !== undefined) return result;

  result = divider(s, '*', (left, right) => evaluate(left, obj) * evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '/', (left, right) => evaluate(left, obj) / evaluate(right, obj)); if (result !== undefined) return result;
  result = divider(s, '%', (left, right) => evaluate(left, obj) % evaluate(right, obj)); if (result !== undefined) return result;


  if (s.match(/^[+-]?\d+/)) {
    console.log('Int: ' + Number.parseInt(s, 10));
    return Number.parseInt(s, 10);
  }
  if (s.match(/^[+-]?([0-9]*[.])?[0-9]+$/)) {
    console.log('Float: ' + Number.parseFloat(s));
    return Number.parseFloat(s);
  }
  console.log('End: ' + s);
  return s;
};

// let s = '5 + (18 - 4) * 3 + 2 * (5 + 3) - 1';
// console.log(evaluate(s));
let s = '12 > 5 && (10 < 6 || 5 > 4 * 2)';
console.log(evaluate(s));
//let s = '5>3 && (isAll(hops.time < 20) || isAny(isReg(hops.domain, \'tut.*\'))';
//console.log(evaluate(s));


//console.log(Math['min']);
