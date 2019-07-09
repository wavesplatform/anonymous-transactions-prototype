include "./Utils.circom";


template Withdrawal(N) {

  signal input in_hashes[N];
  signal input nullifier;
  signal private input index;
  
  signal private input balance;
  signal private input secret;

  signal private input pubkey;
  signal private input privkey;


  

  component in_hash = Selector(N);
  in_hash.index <== index;
  for (var j=0; j<N; j++) {
    in_hash.in[j] <== in_hashes[j];
  }


  component utxohash = UTXOHasher();

  utxohash.balance <== balance;
  utxohash.pubkey <== pubkey;
  utxohash.secret <== secret;

  utxohash.out === in_hash.out;



  
  component cpubkey = PubKey();
  checkPreimage.in <== privkey;
  checkPreimage.out === pubkey;

  component cnullifier = Compressor();
  cnullifier.in[0] <== privkey;
  cnullifier.in[1] <== secret;

  nullifier === cnullifier[0].out;

}

component main = Withdrawal(N);