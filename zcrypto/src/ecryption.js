const blake2 = require("blake2");
const babyjubjub = require("./babyJubJub.js");
const { buff2bigintLe, bigint2buffLe } = require("./utils.js");
const { randomBuffer } = require("secure-random");
const assert = require("assert");
const {rand256} = require("./utils.js");

const b2hash = (v) => {
  const hasher = blake2.createHash('blake2b', { digestLength: 32 });
  hasher.update(Buffer.concat(v.map(x => bigint2buffLe(x, 32))));
  return babyjubjub.affine(buff2bigintLe(hasher.digest()));
}

const ecdh = (pubk, pk) => babyjubjub.mul(pubk, pk)[0];

const encrypt = (message, pubk) => {
  const pk = rand256() % babyjubjub.L;
  const sender_pubk = babyjubjub.mul(babyjubjub.G, pk);  
  const h = ecdh(pubk, pk);
  const iv = b2hash(message);
  return [sender_pubk[0], iv, ...message.map((x, i) => babyjubjub.affine(x + b2hash([h, iv, BigInt(i)])))];
}

const decrypt = (encmessage, pk) => {
  const [pubk0, iv, ..._message] = encmessage;
  const pubk = babyjubjub.decompress(pubk0);
  const h = ecdh(pubk, pk);
  const message = _message.map((x, i) => babyjubjub.affine(x - b2hash([h, iv, BigInt(i)])))
  const checksum = iv === b2hash(message);
  return [checksum, message];
}


const encrypt_test = () => {
  const pk = babyjubjub.affine(buff2bigintLe(randomBuffer(32)));
  const pubk = babyjubjub.mul(babyjubjub.G, pk);
  const message = Array(10).fill(0n).map((x, i) => babyjubjub.affine(buff2bigintLe(randomBuffer(32))));
  const encrypted = encrypt(message, pubk);
  const decrypted = decrypt(encrypted, pk);
  assert.deepEqual(decrypted[1], message, "Decrypted message must be equal to initial message");
}

module.exports = { encrypt, decrypt, ecdh };

