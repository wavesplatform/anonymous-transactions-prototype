include "./utils/Hasher253.circom";
include "./utils/UTXOHasher.circom";
include "./utils/PubKey.circom";
include "./utils/Compressor.circom";
include "./utils/Selector.circom";

template Withdrawal(N) {

  signal input in_hashes[N];
  signal input nullifier;
  signal input receiver;
  signal input balance;

  signal private input index;
  signal private input secret;
  signal private input privkey;

  component null_receiver = IsZero();
  null_receiver.in <== receiver;
  null_receiver.out === 0;
  

  component in_hash = Selector(N);
  in_hash.index <== index;
  for (var j=0; j<N; j++) {
    in_hash.in[j] <== in_hashes[j];
  }

  component cpubkey = PubKey();
  cpubkey.in <== privkey;

  component utxohash = UTXOHasher();

  utxohash.balance <== balance;
  utxohash.pubkey <== cpubkey.out;
  utxohash.secret <== secret;

  utxohash.out === in_hash.out;


  component cnullifier = Compressor();
  cnullifier.in[0] <== privkey;
  cnullifier.in[1] <== secret;

  nullifier === cnullifier.out;

}

component main = Withdrawal(16);