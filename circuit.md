# Anonymous transactions on wavesplatform

## State

Anonymous assets are Pedersen hashes of UTXO objects with the following structure:

```
struct utxo {
   balance:uint64
   pubkey:uint253
   secret:uint153
}
```

Hashes are computed at bn254 curve and presented inside dataset of dApp at Waves blockchain in mapping `hash("U"+utxo) => {true|false}`

Nullifiers are special codes, allowing us to spend UTXOs. If we spend the UTXO, we do not publish, which utxo is spent, but we publish the nullifier of spent UTXO at the blockchain.  `nullifier = hash(privkey, secret)`.

To protect from frontrun attack we need to keep separate independet set of spent nullifiers.

When we publish transfer or withdrawal, we need to check, that all affected UTXOs belong to sender and the nullifiers are not spent.

## Actions

Transfers and withdrawals are callable from self dapp, but the user must to create ephemeral key to sign the message. 

Deposits are usual invokeScript transactions.

### Deposit

![deposit](https://raw.githubusercontent.com/snjax/drawio/master/deposit.svg?sanitize=true)

#### zkSNARK
```
# public:
#   hash     254
#   balance   64
# private:
#   pubkey   253
#   entropy  253

```

#### Ride
```
func deposit(proof:ByteVector, v:ByteVector)
```
```
    let hash= take(v, 32)
```

### Transfer

![transfer](https://raw.githubusercontent.com/snjax/drawio/master/transfer.svg?sanitize=true)

#### zkSNARK

```
# Transfer input structure
# public:
#   in_hashes[16]      254
#   nullifier[2]       254
#   out_hash[2]        254
# private:
#   index[2]           254
#   in_balance[2]       64
#   in_secret[2]       253
#   out_balance[2]      64
#   out_entropy[2]     253
#   out_pubkey[2]      253
#   privkey            253
#   entropy            253
```

#### Ride
```
func transfer(msg:ByteVector, sig:ByteVector, pub:ByteVector) 
```
```
    let proof = take(msg, 256);
    let v = takeRight(msg, 320);
    let uk0 = getUtxoKey(takeLR(v, 0, 32))
    let uk1 = getUtxoKey(takeLR(v, 32, 64))
    let uk2 = getUtxoKey(takeLR(v, 64, 96))
    let uk3 = getUtxoKey(takeLR(v, 96, 128))
    let uk4 = getUtxoKey(takeLR(v, 128, 160))
    let uk5 = getUtxoKey(takeLR(v, 160, 192))
    let uk6 = getUtxoKey(takeLR(v, 192, 224))
    let uk7 = getUtxoKey(takeLR(v, 224, 256))
    let ouk0 = getUtxoKey(takeLR(v, 256, 288))
    let ouk1 = getUtxoKey(takeLR(v, 288, 320))
```

### Withdrawal

![withdrawal](https://raw.githubusercontent.com/snjax/drawio/master/withdrawal.svg?sanitize=true)

#### zkSNARK
```
# public:
#   in_hashes[16]      254
#   nullifier          254
#   receiver           208
#   in_balance          64
# private:
#   index              254
#   in_secret          253
#   privkey            253
```

#### Ride
```
func withdrawal(msg:ByteVector, sig:ByteVector, pub:ByteVector) 
```
```
    let proof = take(msg, 256);
    let v = takeRight(msg, 96);
    let hash = take(v, 32)
    let balance = toInt(v, 32 + 3*8)
    let secret = takeLR(v, 64, 96)
```



## UX

The solution is the DApp, deployed on Waves blockchain.

1. The first, user deposit assets to the smart contract.
2. After that the user may make an anonymous transfer with his asset, using ephemeral private keys. A transaction sender is a smart contract, that's why the user can use uninitialized private keys.
3. Also, the user must publish encrypted data of the transaction's outputs for somebody who receives the assets.
4. The user can scan blockchain, find his assets and withdraw his assets by publishing the zkSNARK proof to the blockchain

