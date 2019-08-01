const axios = require("axios");
const { broadcast, waitForTx, setScript, invokeScript, nodeInteraction } = require("@waves/waves-transactions");
const rxrange = require('to-regex-range');
const { address, base58Encode, base58Decode, publicKey } = require("@waves/waves-crypto");
const fs = require("fs");
const {rpcCall, rand256, serializeMessage, deserializeMessage, stringifyBigInts, unstringifyBigInts, fload, fsave, buff2bigintBe} = require("./zcrypto/src/utils.js")
const babyJubJub = require("./zcrypto/src/babyJubJub.js");
const {encrypt, decrypt} = require("./zcrypto/src/ecryption.js");
const assert = require("assert");

const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const ANONYMITY_SET=8;

const address2bigint = a => buff2bigintBe(base58Decode(a))
const validateStatus = (status) => status === 400 || status >= 200 && status < 300

const process400 = (resp) => resp.status === 400
  ? Promise.reject(Object.assign(new Error(), resp.data))
  : resp

async function accountDataEx(matches, address, nodeUrl) {
  const data = await axios.get(`addresses/data/${address}`, { params: {matches}, baseURL: nodeUrl, validateStatus })
    .then(process400)
    .then(x => x.data)
  return data.reduce((acc, item) => ({ ...acc, [item.key]: item }), {})
}



const seed = env.MNEMONIC;
const rpc = env.WAVES_RPC;
const chainId = env.WAVES_CHAINID;
const dApp = env.DAPP;
const fee = 900000;

const utxoCompute = rpcCall("utxoCompute");
const depositProof = rpcCall("depositProof");
const withdrawalProof = rpcCall("withdrawalProof");

const encrypt_utxo = ({balance, pubkey, secret})=>encrypt([balance, pubkey, secret], babyJubJub.decompress(pubkey))



async function deposit(seed, chainId, balance, pubkey) {
  const utxo = await utxoCompute({pubkey, balance});
  const message = encrypt_utxo(utxo);
  const proofData = await depositProof(utxo);

  let tx = invokeScript({
    dApp,
    chainId,
    payment: [{ amount: Number(balance), assetId: null }],
    call: {
      function: "deposit",
      args: [{ type: "binary", value: proofData.proof }, 
        { type: "binary", value: proofData.inputs },
        { type: "binary", value: serializeMessage(message).toString("base64") }]
    }, fee
  }, seed);
  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });
}

function wavesBufferDeserialize(s) {
  assert(s.indexOf("base64:") === 0, "s is not waves base64 string");
  return Buffer.from(s.substr(7), 'base64');
}

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}


async function withdrawal(seed, chainId, utxo, receiver, db) {
  if (typeof db === "undefined") db = await syncData();
  assert(utxo.hash in db.utxos, "utxo is not present inside db");
  assert(!(utxo.nullifier in db.nullifiers), "utxo is spent");

  const all_utxos = Object.keys(db.utxos).map(BigInt);
  const in_hashes = [utxo.hash];
  for (let i=0; i < ANONYMITY_SET-1; i++) {
    in_hashes.push(all_utxos[Math.floor(Math.random()*all_utxos.length)]);
  }
  shuffle(in_hashes);
  let index=0;
  for (; in_hashes[index]!=utxo.hash; index++) {}
  const proofData = await withdrawalProof({in_hashes, receiver, index, ...utxo});

  let tx = invokeScript({
    dApp,
    chainId,
    call: {
      function: "withdrawal",
      args: [{ type: "binary", value: proofData.proof }, 
        { type: "binary", value: proofData.inputs }]
    }, fee
  }, seed);
  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });

}

async function syncData() {
  const privkey = babyJubJub.privkey(seed);
  const pubkey = babyJubJub.pubkey(seed)[0];
  const db = fs.existsSync("db.json") ? fload("db.json") : {utxos:{}, nullifiers:{}, assets:{}, MESSAGE_NUM:0};

  const push_utxo = o => db.utxos[o] = true;
  const push_nullifier = o => {if (o in db.assets) {delete db.assets[o];} db.nullifiers[o] = true; }
  const push_asset = o => {db.assets[o.nullifier] = o };


  const message_num = (await nodeInteraction.accountDataByKey('MESSAGE_NUM', dApp, rpc)).value;
  
  if(message_num===db.MESSAGE_NUM)
    return db;

  const r = rxrange(db.MESSAGE_NUM, message_num-1);
  const res = await accountDataEx(`M:${r}`, dApp, rpc);


  for (let k in res) {

    const b = wavesBufferDeserialize(res[k].value);

    const data = deserializeMessage(b);
    if (data.length === 14) {
      push_nullifier(data[0]);
      push_nullifier(data[1]);
      push_utxo(data[2]);
      push_utxo(data[3]);
      const em = [data.slice(4, 9), data.slice(9, 14)];
      for (let i in em) {
        const [checksum, m] = decrypt(em[i], privkey);
        if(checksum && (m[1] === pubkey)) {
          const utxo = await utxoCompute({
            balance:m[0],
            privkey,
            secret:m[2]
          });
          if(!(utxo.nullifier in db.assets))
            push_asset(utxo);
        }
      }
    } else if (data.length === 1) {
      push_nullifier(data[0]);
    } else if (data.length === 6) {
      const [utxo, ...em] = data;
      push_utxo(utxo);
      const [checksum, m] = decrypt(em, privkey);
      if(checksum && (m[1] === pubkey)) {
        const utxo = await utxoCompute({
          balance:m[0],
          privkey,
          secret:m[2]
        });
        if(!(utxo.nullifier in db.assets))
          push_asset(utxo);
      }
    }
    
  }
  db.MESSAGE_NUM = message_num;
  fsave("db.json", db);
  return db;
}

console.log();






(async ()=>{
  const pubkey = babyJubJub.pubkey(seed)[0];
  await deposit(seed, chainId, 1000000n, pubkey);
  let db = await syncData();
  console.log(db);
  await withdrawal(seed, chainId, Object.values(db.assets)[0], address2bigint(dApp), db);
  db = await syncData();
  console.log(db);

  

  process.exit();
})()
