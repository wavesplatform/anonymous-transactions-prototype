const axios = require("axios");
const { broadcast, waitForTx, setScript, invokeScript, nodeInteraction } = require("@waves/waves-transactions");
const rxrange = require('to-regex-range');
const { address, base58Encode, base58Decode, publicKey, privateKey } = require("@waves/waves-crypto");
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



let seed = env.MNEMONIC;
const rpc = env.WAVES_RPC;
const chainId = env.WAVES_CHAINID;


const dAppPk = env.DAPP;
const dApp = address({publicKey:dAppPk}, chainId);

const fee = 900000;

const utxoCompute = rpcCall("utxoCompute");
const depositProof = rpcCall("depositProof");
const withdrawalProof = rpcCall("withdrawalProof");
const transferProof = rpcCall("transferProof");

const encrypt_utxo = ({balance, pubkey, secret})=>encrypt([balance, pubkey, secret], babyJubJub.decompress(pubkey))



async function deposit(utxo) {
  utxo = await utxoCompute(utxo);
  const message = encrypt_utxo(utxo);
  const proofData = await depositProof(utxo);

  let tx = invokeScript({
    dApp,
    chainId,
    payment: [{ amount: Number(utxo.balance), assetId: null }],
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


async function withdrawal(utxo, receiver, db) {
  if (typeof db === "undefined") db = await syncData();
  assert(utxo.hash in db.utxos, "utxo is not present inside db");
  assert(!(utxo.nullifier in db.nullifiers), "utxo is spent");

  const all_utxos = Object.keys(db.utxos).map(BigInt);
  const in_hashes = [utxo.hash];
  for (let i=0; i < ANONYMITY_SET-1; i++) {
    in_hashes.push(all_utxos[Math.floor(Math.random()*all_utxos.length)]);
  }
  shuffle(in_hashes);
  const index=in_hashes.indexOf(utxo.hash);
  const proofData = await withdrawalProof({in_hashes, receiver, index, ...utxo});

  const tx = invokeScript({
    dApp,
    senderPublicKey:dAppPk,
    chainId,
    call: {
      function: "withdrawal",
      args: [{ type: "binary", value: proofData.proof }, 
        { type: "binary", value: proofData.inputs }]
    }, fee
  });

  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });

}


//in_hashes, index, nullifier, in_balance, in_secret, out_hash, out_balance, out_entropy, out_pubkey, privkey, entropy

async function transfer(in_utxo, out_utxo, db) {
  if (typeof db === "undefined") db = await syncData();
  const in_eq = (in_utxo.length===1) || (in_utxo[0].hash === in_utxo[1].hash);

  for (let i in in_utxo) {
    const utxo = in_utxo[i];
    assert(utxo.hash in db.utxos, "in_utxo is not present inside db");
    assert(!(utxo.nullifier in db.nullifiers), "in_utxo is spent");
  }

  for (let i in out_utxo) {
    const utxo = out_utxo[i];
    assert(utxo.balance >= 0n, "out_utxo is negative");
    assert(!(utxo.nullifier in db.nullifiers), "in_utxo is spent");
  }

  if(in_eq) assert(in_utxo[0].balance ===(BigInt(fee)+out_utxo[0].balance+out_utxo[1].balance), 
  "Sum of input is not equal to sum of output");
  else assert(in_utxo[0].balance + in_utxo[1].balance ===(BigInt(fee)+out_utxo[0].balance+out_utxo[1].balance), 
    "Sum of input is not equal to sum of output");

  for (let i in out_utxo) {
    out_utxo[i] = await utxoCompute(out_utxo[i]);
  }

  const all_utxos = Object.keys(db.utxos).map(BigInt);
  const in_hashes = in_utxo.map(x=>x.hash);
  for (let i=0; i < ANONYMITY_SET-in_utxo.length; i++) {
    in_hashes.push(all_utxos[Math.floor(Math.random()*all_utxos.length)]);
  }

  shuffle(in_hashes);
  if (in_utxo.length==1) in_utxo = [in_utxo[0], in_utxo[0]];

  const index=in_utxo.map(u=>in_hashes.indexOf(u.hash));
  const nullifier = in_utxo.map(x=>x.nullifier);
  const in_balance = in_utxo.map(x=>x.balance);
  const in_secret = in_utxo.map(x=>x.secret);
  const out_hash = out_utxo.map(x=>x.hash);
  const out_balance = out_utxo.map(x=>x.balance);
  const out_entropy = out_utxo.map(x=>x.entropy);
  const out_pubkey = out_utxo.map(x=>x.pubkey);
  const privkey = babyJubJub.privkey(seed);
  const entropy = rand256() % (1n<<253n);

  const proofData = await transferProof({in_hashes, index, nullifier, in_balance, in_secret, out_hash, out_balance, out_entropy, out_pubkey, privkey, entropy});

  const message = out_utxo.map(encrypt_utxo);

  const tx = invokeScript({
    dApp,
    senderPublicKey:dAppPk,
    chainId,
    call: {
      function: "transfer",
      args: [{ type: "binary", value: proofData.proof }, 
        { type: "binary", value: proofData.inputs },
        { type: "binary", value: serializeMessage(message[0]).toString("base64") },
        { type: "binary", value: serializeMessage(message[1]).toString("base64") }]
    }, fee
  });

  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });

}

async function messageNum() {
  const req = await nodeInteraction.accountDataByKey('MESSAGE_NUM', dApp, rpc);
  if (req) return req.value; else return 0;
}

async function syncData() {
  const privkey = babyJubJub.privkey(seed);
  const pubkey = babyJubJub.pubkey(seed)[0];
  const db = fs.existsSync("db.json") ? fload("db.json") : {utxos:{}, nullifiers:{}, assets:{}, MESSAGE_NUM:0};

  const push_utxo = o => db.utxos[o] = true;
  const push_nullifier = o => {if (o in db.assets) {delete db.assets[o];} db.nullifiers[o] = true; }
  const push_asset = o => {db.assets[o.nullifier] = o };


  const message_num = await messageNum();
  
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

const max = (...e) => {
  let res = e[0];
  for (let i = 1; i < e.length; i++) 
    if (res < e[i]) res = e[i];
  return res;
}


function randompk() {
  return babyJubJub.pubkey(rand256().toString())[0];
}


async function balance(db) {
  db = await collect(db);
  const balance = await nodeInteraction.balance(address(seed, chainId));
  const assets = Object.values(db.assets);
  return [balance, assets[0].balance];
}

async function collect(db) {
  db = typeof db === "undefined" ? await syncData() : db;
  while(true) {
    const assets = Object.values(db.assets);
    if (assets.length<=1)
      break;
    for(let i = 1; i<assets.length; i+=2) {
      const in_utxo = assets.slice(i-1, i+1);
      const out_utxo = [{balance: 0n, pubkey:randompk()}, {balance:in_utxo[0].balance+in_utxo[1].balance-BigInt(fee),pubkey:in_utxo[0].pubkey}]
      await transfer(in_utxo, out_utxo, db);
    }
    db = await syncData();
  }
  return db;
}

async function abstractTransfer(pubkey, balance, db) {
  db = await collect(db);
  const assets = Object.values(db.assets);
  assert(assets[0].balance >= (balance +BigInt(fee)), "Not enough balance to transfer");
  const in_utxo = [assets[0]];
  const out_utxo = [{balance, pubkey}, {balance: assets[0].balance - balance - BigInt(fee), pubkey: assets[0].pubkey}];
  await transfer(in_utxo, out_utxo, db);
  return await syncData();
}

async function abstractWithdrawal(receiver, balance, db) {
  receiver = typeof receiver === "bigint" ? receiver : address2bigint(receiver);
  db = await collect(db);
  let assets = Object.values(db.assets);
  assert(assets[0].balance >= (balance + 2n * BigInt(fee)), "Not enough balance to withdraw");
  db = await abstractTransfer(assets[0].pubkey, balance+BigInt(fee), db);
  assets = Object.values(db.assets);
  for(let i in assets) {
    if(assets[i].balance == (balance + BigInt(fee))) {
      await withdrawal(assets[i], receiver, db);
      return await collect();
    } 
  }
  throw("Unknown error");
}







const yargs = require("yargs")
    .version("0.1")
    .usage(`nodejs cli.js <command> <options>
account details command
=============
    nodejs cli.js details <option>
    Print details of current seed (pubkey and address at waves, pubkey and private key at the DApp)
    Print anonymous and not anonymous balance
    -s or --seed <seed>

deposit command
=========================
    nodejs cli.js deposit <options>
    Deposit waves to the DApp.
    -s or --seed <seed>
      or
    --pub <pubkey>
    
    -b or --balance <balance>

withdrawal command
========================
    nodejs cli.js withdrawal <options>
    Withdraw waves to address
    -s or --seed <seed> 
      or 
    -a or --address <address>
    
    -b or --balance <balance>

transfer command
==============
    nodejs cli.js transfer <options>
    Transfer waves to another address.
    -s or --seed <seed>
     or
    --pub <pubkey>
    
    -b or --balance <balance>
        `)
    .alias("s", "seed")
    .alias("b", "balance")
    .alias("a", "address")
    .alias("h", "help")
    .help("h")
    .epilogue(` `);

const {argv} = yargs;

(async ()=>{
  if (typeof argv._[0] === "undefined") {
    yargs.showHelp();
  } else if (argv._[0].toUpperCase() === "DETAILS") {
    seed = argv.seed ? argv.seed : seed;
    const assets = Object.values((await collect()).assets);
    const balance = assets.length>=1 ? assets[0].balance : 0n;
    console.log(`
seed:\t\t\t${seed}
waves private key:\t${privateKey(seed)}
waves pubkey:\t\t${publicKey(seed)}
waves address:\t\t${address(seed, chainId)}

DApp private key:\t${babyJubJub.privkey(seed)}
DApp public key:\t${babyJubJub.pubkey(seed)[0]}

Waves balance:\t\t${await nodeInteraction.balance(address(seed, chainId), rpc)}
DApp balance:\t\t${balance}
    `); 
  } else if(argv._[0].toUpperCase() === "DEPOSIT") {
    const rseed = argv.seed ? argv.seed : seed;
    const pubkey = argv.pub ? BigInt(argv.pub) : babyJubJub.pubkey(rseed)[0];
    assert(typeof argv.balance !== 'undefined', "no balance specified");
    const balance = BigInt(argv.balance);
    assert(balance >= BigInt(fee), `balance must be more than fee (${fee})`);
    console.log("Processing deposit...");
    await deposit({balance, pubkey});
    console.log("Collecting utxo into one...");
    await collect();
    console.log("OK");
  } else if(argv._[0].toUpperCase() === "WITHDRAWAL") {
    const rseed = argv.seed ? argv.seed : seed;
    receiver = argv.address ? argv.address : address(rseed, chainId);
    assert(typeof argv.balance !== 'undefined', "no balance specified");
    const balance = BigInt(argv.balance);
    console.log("Processing withdrawal...");
    await abstractWithdrawal(receiver, balance);
    console.log("OK");
  } else if(argv._[0].toUpperCase() === "TRANSFER") {
    const rseed = argv.seed ? argv.seed : seed;
    const pubkey = argv.pub ? BigInt(argv.pub) : babyJubJub.pubkey(rseed)[0];
    assert(typeof argv.balance !== 'undefined', "no balance specified");
    const balance = BigInt(argv.balance);
    assert(balance >= BigInt(fee), `balance must be more than fee (${fee})`);
    console.log("Processing transfer...");
    await abstractTransfer(pubkey, balance);
    console.log("OK");
  }

  process.exit();
})();


