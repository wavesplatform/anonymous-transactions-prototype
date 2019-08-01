const crypto = require("crypto");
const {buff2bigintLe} = require("./utils.js");


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
const sub = ([x1, y1],[x2, y2]) => [affine((x1*y2-x2*y1)*modinv(1n-D*x1*x2*y1*y2)), affine((y1*y2+A*x1*x2)*modinv(1n+D*x1*x2*y1*y2))];



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




const privkey = mnemonic => {
  let offset = 0;
  while(true) {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(offset);
    const pk = affine(buff2bigintLe(crypto.createHash('sha256').update(mnemonic, 'utf8').update(b).digest()), L)
    const pubk = mul(G, pk);
    if (pubk[0]<(1n<<253n)) return pk;
    offset++;
  }
}
const pubkey = x => typeof x ==="string" ? pubkey(privkey(x)) : mul(G, x)


const powm = (base, exponent, modulus) => {  
  if (exponent < 0n) throw("Negative exponent");   
  let result = 1n;
  while (exponent > 0n) {
    if ((exponent & 1n) === 1n)
      result = (result * base) % modulus;
    exponent >>= 1n;   
    base = (base * base) % modulus
  }  
  return result;
}

const legendre = (a,p) => powm(a, (p-1n)>>1n, p);

const tonelli = (n, p) => {
	if (legendre(n, p)!== 1n) throw("not a square (mod p)");
	let q = p - 1n;
	let s = 0n;
	while ((q & 1n) === 0n) {
		q >>= 1n;
		s++;
	}
	if (s===1n) return powm(n, (p+1n)>>2n, p)
  let z = 2n;
  for (; z < p; z++) 
		if ((p-1n)=== legendre(z, p)) {
      z++;
      break;
    }
  z--;
	let c = powm(z, q, p);
	let r = powm(n, (q+1n)>>1n, p);
	let t = powm(n, q, p);
	let m = s;
	let t2 = 0n;
	while (((t-1n) % p) !== 0n) {
    t2 = (t * t) % p;
    let i = 1n;
		for (; i < m; i++){
			if (((t2-1n) % p) === 0n) {
        i++;
        break;
      }
			t2 = (t2 * t2) % p;
    }
    i--;
    b = powm(c, 1n << (m - i - 1n), p)
    r = (r * b) % p
    c = (b * b) % p
    t = (t * c) % p
    m = i
	}
	return r
}

const decompress = (x) => {
  const x2 = affine(x*x);
  const s = affine((A*x2-1n)*modinv(D*x2-1n));
  let y = affine(tonelli(s, Q));
  if (insubgroup([x,y])) return [x,y];
  y = affine(-y);
  if (insubgroup([x,y])) return [x,y];
  else throw("Wrong compressed point.")
}


module.exports = {A, D, Q, L, G, modinv, affine, add, sub, mul, incurve, iszero, insubgroup, privkey, pubkey, decompress};