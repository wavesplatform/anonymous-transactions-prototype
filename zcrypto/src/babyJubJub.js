


const A = 168700n;
const D = 168696n;
const Q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const L = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;
const G = [17777552123799933955779906779655732241715742912184938656739573121738514868268n, 2626589144620713026669568689430873010625803728049924121243784502389097019475n];


const egcd = (a, b) => (a===0n)? [b, 0n, 1n] : ((g, y, x) => [g, x - (b/a) * y, y ])(...egcd(b % a, a))

const modinv = (a, m) => {
  m = (typeof(m)==="undefined") ? Q : m;
  a = affine(a, m)
  const [g, x, y] = egcd(a, m);
  if (g !== 1n) {
    console.log(a,m)
    throw(Error("modular inverse does not exist"));
  }
  else
    return x % m
}

const affine = (x, m) => {
  m = (typeof(m)==="undefined") ? Q : m;
  return ((x % m) + m)%m
}

const add = ([x1, y1],[x2, y2]) => [affine((x1*y2+x2*y1)*modinv(1n+D*x1*x2*y1*y2)), affine((y1*y2-A*x1*x2)*modinv(1n-D*x1*x2*y1*y2))];



const mul = (a,b) => {
  b = affine(b);
  const _mul = (a,b)=> {
    if (b === 0n) return [0n, 1n];
    const dbl = add(a,a);
    return ((b&1n)===0n) ? _mul(dbl, b>>1n) : add(a, _mul(dbl, b>>1n));
  }
  return _mul(a,b);
}

const incurve = ([x,y])=>{
  const x2=x*x, y2=y*y;
  return (A*x2 + y2 - 1n - D*x2*y2) % Q === 0n;
}

const iszero = ([x,y])=> x%Q===0n && (y-1n)%Q ===0n;

const insubgroup = (p) => incurve(p) && iszero(mul(p, L));


module.exports = {A, D, Q, L, G, modinv, affine, add, mul, incurve, iszero, insubgroup};