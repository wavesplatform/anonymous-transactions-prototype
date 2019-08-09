const { broadcast, waitForTx, setScript, invokeScript, nodeInteraction, transfer } = require("@waves/waves-transactions");
const { address, base58Encode, base58Decode, publicKey, privateKey } = require("@waves/waves-crypto");
const fetch = require('node-fetch');
const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}


let seed = env.MNEMONIC;
const rpc = env.WAVES_RPC;
const chainId = env.WAVES_CHAINID;


const fauseed = "arm march lottery domain vibrant damp action crazy cloud humor increase sheriff"


const fauscript = `
{-# STDLIB_VERSION 3 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

@Verifier(tx)
func verify() = {
  match (tx) {
      case o:TransferTransaction =>
          !isDefined(o.assetId) && o.fee <= 900000 && o.amount <= 10000000000 && sigVerify(tx.bodyBytes, tx.proofs[0], tx.senderPublicKey)
      case _ =>
          false
  }
}
`;

(async ()=> {

  if ((process.argv.length==3) && (process.argv[2]=="deploy")) {
    let request = await fetch(`${env.WAVES_RPC}utils/script/compile`, { method: "POST", body: fauscript })
    const { script } = await request.json();
    let tx = setScript({ script, fee: 1400000, chainId}, fauseed);
    await broadcast(tx, rpc);
    await waitForTx(tx.id, { apiBase: rpc });

  } else {
    const tx = transfer({
      fee:500000,
      amount:10000000000,
      recipient:address(seed, chainId)
    }, fauseed);
    await broadcast(tx, rpc);
    await waitForTx(tx.id, { apiBase: rpc });
    console.log(await nodeInteraction.balance(address(seed, chainId), rpc));
  }
  process.exit();
})();