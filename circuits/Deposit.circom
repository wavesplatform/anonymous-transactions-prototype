include "UTXOHasher.circom";

/*
# Deposit input structure
# public:
#   hash     256
#   balance   64
# private:
#   owner    208
#   secret   160
#   salt      80
*/

template Deposit() {
  signal input balance;
  signal input owner;
  signal input hash;

  signal private input secret;
  signal private input salt

  component hasher = UTXOHasher();

  hasher.balance <== balance;
  hasher.salt <== salt;
  hasher.owner <== owner;
  hasher.secret <== secret;
  hash === hasher.hash;

}

component main = Deposit()
