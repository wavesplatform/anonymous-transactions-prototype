include "../node_modules/circomlib/circuits/comparators.circom";

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