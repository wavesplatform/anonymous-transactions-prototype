const { broadcast, invokeScript } = require("@waves/waves-transactions");
const { address, base58encode } = require("@waves/waves-crypto");

const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}


const chainId = env.WAVES_CHAINID;
const dappAddress = address(env.MNEMONIC, chainId);
const testacc = env.MNEMONIC_TEST;

function u256vec(n) {
  const res = new Uint8Array(32);
  let t = n;
  for (let i = 31; i >= 0; i--) {
    res[i] = parseInt(t & 0xffn);
    t >>= 8n;
  }
  return base58encode(res);
}

function vec256rand() {
  const res = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    res[i] = Math.floor(Math.random() * 256);
  }
  return base58encode(res);
}


async function depositTest(hash) {
  const tx = invokeScript({
    dappAddress,
    chainId,
    call: {
      function: "deposit",
      args: [{ type: "binary", value: base58encode([]) }, { type: "binary", hash }]
    }, payment: [{ amount: "100000000" }]
  }, testacc);
  return await broadcast(tx, WAVES_RPC);
}

async function withdrawal() { }

async function main() {
  const hashValue = vec256rand();
  let res = await depositTest(hashValue);
  console.log(res);
  process.exit();
}

main()
