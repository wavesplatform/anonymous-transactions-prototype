const blake2 = require("blake2");
const babyjubjub = require("./babyJubJub.js");

const hash = (v) => {
  const hasher = blake2.createHash('blake2b', {digestLength: 32});
  hasher.update(v);
  return hasher.digest();
}

const ecdh = (pubk, pk) => babyjubjub.mul(pubk, pk)[0];

const encrypt = (message, pubk, pk) {
  const seed = ecdh(pk, pubk);
}