include "../node_modules/circomlib/circuits/pedersen.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/escalarmulfix.circom"



template UTXOHasher() {
  signal input balance;
  signal input pubkey;
  signal input secret;
  signal output out;

  component hasher = Pedersen(570);
  var cur = 0;
  var i;

  component b_balance = Num2Bits(64);
  b_balance.in <== balance;
  for (i = 0; i<64; i++) {
    hasher.in[cur] <== b_balance.out[i];
    cur+=1;
  }

  component b_pubkey = Num2Bits(253);
  b_pubkey.in <== pubkey;
  for (i = 0; i<253; i++) {
    hasher.in[cur] <== b_pubkey.out[i];
    cur+=1;
  }

  component b_secret = Num2Bits(253);
  b_pubkey.in <== pubkey;
  for (i = 0; i<253; i++) {
    hasher.in[cur] <== b_pubkey.out[i];
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


template PubKey() {
  signal input in;
  signal output out;

  var BASE = [
    17777552123799933955779906779655732241715742912184938656739573121738514868268,
    2626589144620713026669568689430873010625803728049924121243784502389097019475
  ];
  component ecmul = EscalarMulFix(253, BASE);
  component in_bits = Num2Bits(253);
  in_bits.in <== in;
  for (var i=0; i<251; i++) {
    ecmul.in[i] <== in_bits.out[i];
  }
  out <== ecmul.out[0];
}

template Hasher() {
  signal input in;
  signal output out;

  component b_in = Num2Bits(253);
  component h_out = Pedersen(253);

  b_in.in <== in;

  for (var i=0; i<253; i++) {
    h_out.in[i] <== b_in.out[i];
  }

  out <== h_out.out[0];
}


template Hasher253() {
  signal input in;
  signal output out;

  component b_in = Num2Bits(253);
  component h_out = Pedersen(253);

  b_in.in <== in;

  for (var i=0; i<253; i++) {
    h_out.in[i] <== b_in.out[i];
  }

  component b_out1 = Num2Bits_strict();
  component b_out2 = Bits2Num(253);

  b_out1.in <== h_out.out[0];
  for (var i=0; i<253; i++) {
    b_out2.in[i] <== b_out1.out[i];
  }
  out <== b_out2.out;
}


template Compressor() {
  signal input in[2];
  signal output out;
  component b_in[2];

  for(var i=0; i<2; i++) {
    b_in[i] = Num2Bits(253);
    b_in[i].in <== in[i];
  }
  component h_out = Pedersen(506);

  for (var i=0; i<253; i++) {
    h_out.in[i] <== b_in[0].out[i];
  }

  for (var i=0; i<253; i++) {
    h_out.in[253+i] <== b_in[1].out[i];
  }

  out <== h_out.out[0];
}


template Compressor253() {
  signal input in[2];
  signal output out;
  component b_in[2];

  for(var i=0; i<2; i++) {
    b_in[i] = Num2Bits(253);
    b_in[i].in <== in[i];
  }
  component h_out = Pedersen(506);

  for (var i=0; i<253; i++) {
    h_out.in[i] <== b_in[0].out[i];
  }

  for (var i=0; i<253; i++) {
    h_out.in[253+i] <== b_in[1].out[i];
  }

  component b_out1 = Num2Bits_strict();
  component b_out2 = Bits2Num(253);

  b_out1.in <== h_out.out[0];
  for (var i=0; i<253; i++) {
    b_out2.in[i] <== b_out1.out[i];
  }
  out <== b_out2.out;
}
