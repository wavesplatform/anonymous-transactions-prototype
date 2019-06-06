const { broadcast, waitForTx, invokeScript } = require("@waves/waves-transactions");
const { address, base58encode } = require("@waves/waves-crypto");

const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}


const chainId = env.WAVES_CHAINID;
const dApp = address(env.MNEMONIC, chainId);
const testacc = env.MNEMONIC_TEST;
const rpc = env.WAVES_RPC;

function u256vec(n) {
  const res = new Uint8Array(32);
  let t = n;
  for (let i = 31; i >= 0; i--) {
    res[i] = parseInt(t & 0xffn);
    t >>= 8n;
  }
  return Buffer.from(res).toString("base4");
}

function vec256rand() {
  const res = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    res[i] = Math.floor(Math.random() * 256);
  }
  return Buffer.from(res).toString("base64");
}


async function depositTest(hash) {
  const tx = invokeScript({
    dApp,
    chainId,
    call: {
      function: "deposit",
      args: [{ type: "binary", value: "" }, { type: "binary", value: hash }]
    }, payment: [{ amount: "100000000" }]
  }, testacc);
  return await broadcast(tx, rpc);
}

async function withdrawal() { }

async function main() {
  const hashValue = vec256rand();
  const res = await depositTest(hashValue);
  console.log(res);
  await waitForTx(res.id, { apiBase: rpc })
  process.exit();
}

main()
