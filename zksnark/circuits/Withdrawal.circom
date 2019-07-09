include "./Utils.circom";


template Withdrawal(N) {

  signal input in_hashes[N];
  signal input nullifier;
  signal private input index;
  
  signal private input balance;
  signal private input secret;

  signal private input owner;
  signal private input owner_preimage;


  

  component in_hash = Selector(N);
  in_hash.index <== index;
  for (var j=0; j<N; j++) {
    in_hash.in[j] <== in_hashes[j];
  }


  component utxohash = UTXOHasher();

  utxohash.balance <== balance;
  utxohash.owner <== owner;
  utxohash.secret <== secret;

  utxohash.out === in_hash.out;



  
  component checkPreimage = Hasher();
  checkPreimage.in <== owner_preimage;
  checkPreimage.out === owner;

  component cnullifier = Compressor();
  cnullifier.in[0] <== owner_preimage;
  cnullifier.in[1] <== secret;

  nullifier[0] === cnullifier[0].out;

}

component main = Withdrawal(N);