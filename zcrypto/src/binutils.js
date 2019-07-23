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

const buff2bigintLe = (b) => {
  let t = 0;
  let ti = 0;
  let res = 0n;
  for (let i = 0; i < b.length; i++) {
    t = (t << 8) + b[i];
    ti += 1;
    if (ti == 4) {
      res = (res << 32n) + BigInt(t);
      t = 0;
      ti = 0;
    }
  }
  if (ti > 0) {
    res = (res << BigInt(ti * 8)) + BigInt(t);
  }
  return res;
}

module.exports = { bigint2buffLe, buff2bigintLe }