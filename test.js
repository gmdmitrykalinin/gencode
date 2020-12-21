const m = [
  65,
  116,
  32,
  108,
  105,
  110,
  101,
  58,
  49,
  32,
  99,
  104,
  97,
  114,
  58,
  53,
  56,
  13,
  10
];

console.log(String.fromCharCode.apply(null, m));
// *** UnKnown can't find 52.174.0.193: Non-existent domain

const now = Date.now();
const dt = new Date(now);

console.log(new Date(now));

const rg = /(?R)/mg;
