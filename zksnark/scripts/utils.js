const fs = require("fs");
const { bigInt } = require("snarkjs");


const fload = (fname) => unstringifyBigInts(JSON.parse(fs.readFileSync(fname, "utf8")));
const fdump = (fname, data) => fs.writeFileSync(fname, JSON.stringify(stringifyBigInts(data)), "utf8");

const g1ToBuff = (p) => Buffer.concat([bigInt.beInt2Buff(p[0], 32), bigInt.beInt2Buff(p[1], 32)]);
const g2ToBuff = (p) => Buffer.concat([bigInt.beInt2Buff(p[0][0], 32), bigInt.beInt2Buff(p[0][1], 32), bigInt.beInt2Buff(p[1][0], 32), bigInt.beInt2Buff(p[1][1], 32)]);
const serializeVK = (vk) => Buffer.concat([g1ToBuff(vk.vk_alfa_1), ...[vk.vk_beta_2, vk.vk_gamma_2, vk.vk_delta_2].map(g2ToBuff), ...vk.IC.map(g1ToBuff)]);
const serializeProof = (proof) => Buffer.concat([g1ToBuff(proof.pi_a), g2ToBuff(proof.pi_b), g1ToBuff(proof.pi_c)]);
const serializeInputs = (inputs) => Buffer.concat(inputs.map(x => bigInt.beInt2Buff(x, 32)));



function p256(o) {
  if ((typeof (o) == "bigint") || (o instanceof bigInt)) {
    let nstr = o.toString(16);
    while (nstr.length < 64) nstr = "0" + nstr;
    nstr = "0x" + nstr;
    return nstr;
  } else if (Array.isArray(o)) {
    return o.map(p256);
  } else if (typeof o == "object") {
    const res = {};
    for (let k in o) {
      res[k] = p256(o[k]);
    }
    return res;
  } else {
    return o;
  }
}


function unstringifyBigInts(o) {
  if ((typeof (o) == "string") && (/^[0-9]+$/.test(o))) {
    return bigInt(o);
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o == "object") {
    const res = {};
    for (let k in o) {
      res[k] = unstringifyBigInts(o[k]);
    }
    return res;
  } else {
    return o;
  }
}

function stringifyBigInts(o) {
  if ((typeof (o) == "bigint") || (o instanceof bigInt)) {
    return o.toString(10);
  } else if (Array.isArray(o)) {
    return o.map(stringifyBigInts);
  } else if (typeof o == "object") {
    const res = {};
    for (let k in o) {
      res[k] = stringifyBigInts(o[k]);
    }
    return res;
  } else {
    return o;
  }
}


module.exports = { fload, fdump, serializeVK, serializeProof, serializeInputs }