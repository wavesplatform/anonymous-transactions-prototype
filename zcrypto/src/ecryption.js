const blake2 = require("blake2");
const babyjubjub = require("./babyJubJub.js");
const { buff2bigintLe, bigint2buffLe } = require("./binutils.js");
const { randomBuffer } = require("secure-random");
const assert = require("assert");

const b2hash = (v) => {
  const hasher = blake2.createHash('blake2b', { digestLength: 32 });
  hasher.update(Buffer.concat(v.map(x => bigint2buffLe(x, 32))));
  return babyjubjub.affine(buff2bigintLe(hasher.digest()));
}

const ecdh = (pubk, pk) => babyjubjub.mul(pubk, pk)[0];

const encrypt = (message, pubk, pk) => {
  const h = ecdh(pubk, pk);
  const iv = b2hash(message);
  return [iv, ...message.map((x, i) => babyjubjub.affine(x + b2hash([h, iv, BigInt(i)])))];
}

const decrypt = (encmessage, pubk, pk) => {
  const h = ecdh(pubk, pk);
  const [iv, ..._message] = encmessage;
  const message = _message.map((x, i) => babyjubjub.affine(x - b2hash([h, iv, BigInt(i)])))
  const checksum = iv === b2hash(message);
  return [checksum, message];
}

const encryt_test = () => {
  const pk = babyjubjub.affine(buff2bigintLe(randomBuffer(32)));
  const pubk = babyjubjub.mul(babyjubjub.G, babyjubjub.affine(buff2bigintLe(randomBuffer(32))));
  const message = Array(10).fill(0n).map((x, i) => babyjubjub.affine(buff2bigintLe(randomBuffer(32))));
  const encrypted = encrypt(message, pubk, pk);
  const decrypted = decrypt(encrypted, pubk, pk);
  assert.deepEqual(decrypted[1], message, "Decrypted message must be equal to initial message");
}

module.exports = { encrypt, decrypt, ecdh };

