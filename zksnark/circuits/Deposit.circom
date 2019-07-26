
include "./utils/Hasher253.circom";
include "./utils/UTXOHasher.circom";



template Deposit() {
  signal input hash;
  signal input balance;
  signal private input pubkey;
  signal private input entropy;

  component secret = Hasher253();

  secret.in <== entropy;


  component hasher = UTXOHasher();
  hasher.balance <== balance;
  hasher.pubkey <== pubkey;
  hasher.secret <== secret.out;
  hash === hasher.out;
}

component main = Deposit();