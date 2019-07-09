
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
  signal private input owner;
  signal private input secret;

  component hasher = UTXOHasher();
  hasher.balance <== balance;
  hasher.owner <== owner;
  hasher.secret <== secret;
  hash === hasher.out;
}

component main = Deposit();