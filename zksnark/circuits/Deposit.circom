
include "./Utils.circom";

/*
# Withdrawal input structure
# public:
#   hash     256
#   balance   64
# private:
#   owner    251
#   secret   251
*/

template Deposit() {
  signal input balance;
  signal input hash;
  signal input pubentropy;
  signal private input pubkey;

  signal private input priventropy;

  component secret = Compressor253();

  secret.in[0] <== pubentropy;
  secret.in[1] <== priventropy;
  

  component hasher = UTXOHasher();
  hasher.balance <== balance;
  hasher.pubkey <== pubkey;
  hasher.secret <== secret.out;
  hash === hasher.out;
}

component main = Deposit();