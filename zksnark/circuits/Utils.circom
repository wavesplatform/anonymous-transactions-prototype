include "../circomlib/circuits/pedersen.circom";
include "../circomlib/circuits/bitify.circom";
include "../circomlib/circuits/comparators.circom";



template UTXOHasher() {
  signal input balance;
  signal input owner;
  signal input secret;
  signal output out;

  component hasher = Pedersen(568);
  var cur = 0;
  var i;

  component b_balance = Num2Bits(64);
  b_balance.in <== balance;
  for (i = 0; i<64; i++) {
    hasher.in[cur] <== b_balance.out[i];
    cur+=1;
  }

  component b_owner = Num2Bits(251);
  b_owner.in <== owner;
  for (i = 0; i<251; i++) {
    hasher.in[cur] <== b_owner.out[i];
    cur+=1;
  }

  component b_secret = Num2Bits(251);
  b_owner.in <== owner;
  for (i = 0; i<251; i++) {
    hasher.in[cur] <== b_owner.out[i];
    cur+=1;
  }

  out <== hasher.out[0];

}


template Selector(N) {
  signal input in[N];
  signal input index;
  signal output out;

  var acc1 = 0;
  var acc2 = 0;

  component eq[N];
  signal w_in[N];

  for (var i=0; i< N; i++){
    eq[i] = IsZero();
    eq[i].in <== index - i;
    acc1 += eq[i].out;
    w_in[i] <== eq[i].out * in[i];
    acc2 += w_in[i];
  }

  acc1 === 1;
  out <== acc2;
}


template Haser() {
  signal input in;
  signal output out;


  component b_in = Num2Bits(251);
  component h_out = Pedersen(251);

  b_in.in <== in;
  for (var i=0; i<251; i++) {
    h_out.in[i] <== b_in.out[i];
  }

  out <== h_out.out[0];
}


template Compressor() {
  signal input in[2];
  signal output out;
  component b_in[2];

  for(var i=0; i<2; i++) {
    b_in[i] = Num2Bits(251);
    b_in[i].in <== in[i];
  }
  component h_out = Pedersen(502);

  for (var i=0; i<251; i++) {
    h_out.in[i] <== b_in[0].out[i];
  }

  for (var i=0; i<251; i++) {
    h_out.in[251+i] <== b_in[1].out[i];
  }

  out <== h_out.out[0];
}


