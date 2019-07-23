const bigint2buffLe = (x, n) {
  const b = Buffer.alloc(n);
  for(let i=0; i<n;i+=4){
    const c = Number(x & 0xffffffffn)
    b[i] = c & 0xff;
    b[i+1] = (c & 0xff00)>>8;
    b[i+2] = (c & 0xff0000)>>16;
    b[i+3] = (c & 0xff000000)>>24;
    x>>=32n;
    if(x===0n) break;
  }
}

module.exports = {bigint2buffLe}