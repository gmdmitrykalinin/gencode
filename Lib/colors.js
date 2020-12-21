console.log(Number.parseFloat(10));
let i, j;
console.log('          1           2           3           4           5           6           7           8           '
     +      '9          21          51          52   ');
for(i = 30; i < 108; i++) {
  if(i === 21 || i === 51 || i === 52 || i === 98 || i === 99) continue;
  if(i >= 38 && i <= 39) continue;
  if(i >= 48 && i <= 89) continue;
  console.log(`${i.toString().padStart(3)}: \x1b[${i}m\x1b[1m Some text \x1b[0m \x1b[${i}m\x1b[2m Some text \x1b[0m `
     + `\x1b[${i}m\x1b[3m Some text \x1b[0m \x1b[${i}m\x1b[4m Some text \x1b[0m \x1b[${i}m\x1b[5m Some text \x1b[0m `
     + `\x1b[${i}m\x1b[6m Some text \x1b[0m \x1b[${i}m\x1b[7m Some text \x1b[0m \x1b[${i}m\x1b[8m Some text \x1b[0m `
     + `\x1b[${i}m\x1b[9m Some text \x1b[0m \x1b[${i}m\x1b[21m Some text \x1b[0m \x1b[${i}m\x1b[51m Some text \x1b[0m `
     + `\x1b[${i}m\x1b[52m Some text \x1b[0m`);
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
}
//          0         1       2         3        4        5           6
const ct = [cs.light, cs.red, cs.green, cs.gold, cs.blue, cs.magenta, cs.spring,
//  7         8        9          10        11         12      13       14       15
    cs.white, cs.dark, cs.corral, cs.olive, cs.yellow, cs.sky, cs.pink, cs.cyan, cs.black];

//          0           1         2           3          4          5             6
const cb = [cs.bgLight, cs.bgRed, cs.bgGreen, cs.bgGold, cs.bgBlue, cs.bgMagenta, cs.bgSpring,
//  7           8          9            10          11           12        13         14         15
    cs.bgWhite, cs.bgDark, cs.bgCorral, cs.bgOlive, cs.bgYellow, cs.bgSky, cs.bgPink, cs.bgCyan, cs.bgBlack];

let s = '';
console.log();
console.log();
for (i = 0; i < ct.length; i++) {
  s = '';
  for (j = 0; j < cb.length; j++) s += cs.bar + ct[i] + cb[j] + ` [${i}, ${j}] `.padStart(11) + cs.reset + '  ';
  console.log(s);
  console.log();
}

console.log();
console.log();
for (i = 0; i < ct.length; i++) {
  s = '';
  for (j = 0; j < cb.length; j++) s += ct[i] + cb[j] + ` [${i}, ${j}] `.padStart(11) + cs.reset + '  ';
  console.log(s);
  console.log();
}

