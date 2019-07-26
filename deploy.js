const fetch = require("node-fetch");
const { broadcast, waitForTx, setScript, invokeScript } = require("@waves/waves-transactions");
const { address, base58Encode } = require("@waves/waves-crypto");
const fs = require("fs");
const {spawn} = require('child_process');


const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}




const seed = env.MNEMONIC;
const rpc = env.WAVES_RPC;
const chainId = env.WAVES_CHAINID;
const dApp = address(env.MNEMONIC, chainId);

const ridetpl = fs.readFileSync("ride/zwaves.ride", {encoding:"utf8"});


async function shellRequest([proc, ...params]) {
  const p = spawn(proc, params);
  let data = [];
  let error = [];
  p.stdout.on('data', (t)=> {data.push(t); });
  p.stderr.on('data', (t)=> {error.push(t); });
  await new Promise(resolve => p.on('close', resolve));
  if (error.length>0) throw(Buffer.concat(error).toString()); 
  return JSON.parse(Buffer.concat(data)).vk;
}

async function getVKSerialized(f) {
  return await shellRequest(["node", "zksnark/cli.js", "serializevk", "-c", f])
}



(async () => {
  const ridescript = ridetpl
    .replace(`let depositVK=base58''`, `let depositVK=base58'${await getVKSerialized("zksnark/circuitsCompiled/Deposit_vk.json")}'`)
    .replace(`let withdrawalVK=base58''`, `let withdrawalVK=base58'${await getVKSerialized("zksnark/circuitsCompiled/Withdrawal_vk.json")}'`)
    .replace(`let transferVK=base58''`, `let transferVK=base58'${await getVKSerialized("zksnark/circuitsCompiled/Transfer_vk.json")}'`);



  let request = await fetch(`${env.WAVES_RPC}utils/script/compile`, { method: "POST", body: ridescript })
  const { script } = await request.json();

  let tx = setScript({ script, fee: 1400000, chainId}, seed);
  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });

  process.exit();
})();