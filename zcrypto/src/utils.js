const {spawn} = require('child_process');
const fs = require('fs');

function mapObject(obj, fn) {
  return Object.keys(obj).reduce(
    (res, key) => {
      res[key] = fn(obj[key]);
      return res;
    },
    {}
  )
}

function deepMap(obj, fn) {
  const deepMapper = val => typeof val === 'object' ? deepMap(val, fn) : fn(val);
  if (Array.isArray(obj)) {
    return obj.map(deepMapper);
  }
  if (typeof obj === 'object') {
    return mapObject(obj, deepMapper);
  }
  return obj;
}


const stringifyBigInts = (o) => deepMap(o, x=>(typeof x === "bigint")?x.toString(10):x);
const unstringifyBigInts = (o) => deepMap(o, x=>((typeof(x) === "string") && (/^[0-9]+$/.test(x) ))? BigInt(x) : x );
const fload = f => unstringifyBigInts(JSON.parse(fs.readFileSync(f)))
const fsave = (f, data) => fs.writeFileSync(f, JSON.stringify(stringifyBigInts(data)))

const rpcCall = (rpc) => async (...params) => {
  const p = spawn("node", ["zksnark/cli.js"]);
  let data = [];
  let error = [];
  //console.log(JSON.stringify(stringifyBigInts({rpc, params})));
  p.stdin.write(JSON.stringify(stringifyBigInts({rpc, params})));
  p.stdout.on('data', (t)=> {data.push(t); });
  p.stderr.on('data', (t)=> {console.log(t.toString()); error.push(t); });
  await new Promise(resolve => p.on('close', resolve));
  if (error.length>0) throw(Buffer.concat(error).toString()); 
  return unstringifyBigInts(JSON.parse(Buffer.concat(data)));
}


function rand256() {
  n = 0n;
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(Math.random() * (1 << 30));
    n = (n << 30n) + BigInt(x);
  }
  return n % (1n << 256n);
}

const bigint2buffLe = (x, n) => {
  const b = Buffer.alloc(n);
  let t = 0;
  let ti = 4;
  for (let i = 0; i < n; i++) {
    if (ti == 4) {
      t = Number(x & 0xffffffffn)
      ti = 0;
      x >>= 32n;
    }
    b[i] = t & 0xff;
    t >>= 8;
    ti += 1;

    if (x === 0n && t === 0) break;
  }
  return b;
}


const bigint2buffBe = (x, n) => {
  const b = Buffer.alloc(n);
  let t = 0;
  let ti = 4;
  for (let i = b.length-1; i >= 0; i--) {
    if (ti == 4) {
      t = Number(x & 0xffffffffn)
      ti = 0;
      x >>= 32n;
    }
    b[i] = t & 0xff;
    t >>= 8;
    ti += 1;

    if (x === 0n && t === 0) break;
  }
  return b;
}

const buff2bigintLe = (b) => {
  let t = 0;
  let ti = 0;
  let res = 0n;
  for (let i = b.length-1; i >=0 ; i--) {
    t = (t << 8) + b[i];
    ti += 1;
    if (ti == 3) {
      res = (res << 24n) + BigInt(t);
      t = 0;
      ti = 0;
    }
  }
  if (ti > 0) {
    res = (res << BigInt(ti * 8)) + BigInt(t);
  }
  return res;
}

const buff2bigintBe = (b) => {
  let t = 0;
  let ti = 0;
  let res = 0n;
  for (let i = 0; i < b.length ; i++) {
    t = (t << 8) + b[i];
    ti += 1;
    if (ti == 3) {
      res = (res << 24n) + BigInt(t);
      t = 0;
      ti = 0;
    }
  }
  if (ti > 0) {
    res = (res << BigInt(ti * 8)) + BigInt(t);
  }
  return res;
}



function chunks(buffer, chunkSize) {
	let result = [];
	let len = buffer.length;
	let i = 0;
	while (i < len) {
		result.push(buffer.slice(i, i += chunkSize));
	}
	return result;
}


const serializeMessage = (m) => Buffer.concat(m.map(x => bigint2buffBe(x, 32)));
const deserializeMessage = (m) => chunks(m, 32).map(buff2bigintBe)



module.exports = {fload, fsave, rpcCall, rand256, bigint2buffLe, buff2bigintLe, bigint2buffBe, buff2bigintBe, serializeMessage, deserializeMessage, stringifyBigInts, unstringifyBigInts };