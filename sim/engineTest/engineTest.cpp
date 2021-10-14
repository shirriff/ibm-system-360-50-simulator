#include "catch.hpp"
#include "state.hpp"
#include "engine.hpp"


// Helper to call all the adder routines
void adder(State &state, Entry_t &entry) {
  adderLX(state, entry);
    adderRY(state, entry);
    adderDG(state, entry);
    adderT(state, entry);
}

void setBS(State &state, bool bs0, bool bs1, bool bs2, bool bs3) {
  state.BS[0] = bs0;
  state.BS[1] = bs1;
  state.BS[2] = bs2;
  state.BS[3] = bs3;
}

void setS(State &state, std::vector<bool>v) {
  for (int i = 0; i < 8; i++) {
    state.S[i] = v[i];
  }
}

TEST_CASE( "adder") {
  State state;
  Entry_t entry;
  state.L = 0x12345678;
  state.R = 0x23456789;
  entry.LX = 1; /* L */
  entry.RY = 1; /* R */
  entry.TC = 1; /* add */
  entry.AD = 1; /* default op */
  entry.AL = 0; /* shift */
  entry.DG = 0; /* default */
  adder(state, entry);
  REQUIRE( state.T0 == 0x12345678 + 0x23456789);
}

TEST_CASE( "adder2") {
  State state;
  Entry_t entry;
  state.L = 0x1234;
  state.H = 0x1233;
  entry.LX = 1; /* L */
  entry.RY = 4; /* H */
  entry.TC = 0; /* sub */
  entry.AD = 1; /* default op */
  entry.AL = 0; /* shift */
  entry.DG = 0; /* default */
  adder(state, entry);
  REQUIRE( state.T0 == 0xfffffffe); // H - L, 1"s complement
}

TEST_CASE( "adder3") {
  State state;
  Entry_t entry;
  state.M = 0x12345678;
  entry.CE = 4;
  entry.LX = 3; /* E */
  entry.RY = 3; /* M23 */
  entry.TC = 1; /* add */
  entry.AD = 1; /* default op */
  entry.AL = 0; /* shift */
  entry.DG = 0; /* default */
  adder(state, entry);
  REQUIRE( state.T0 == (4 << 1) + 0x5678);
}

TEST_CASE( "adder lx 0 0") {
  State state;
  Entry_t entry;
  state.L = 0x12345678;
  entry.LX = 0;
  adderLX(state, entry);
  REQUIRE( state.XG == 0);
}

TEST_CASE( "adder lx 1 L") {
  State state;
  Entry_t entry;
  state.L = 0x12345678;
  entry.LX = 1;
  adderLX(state, entry);
  REQUIRE( state.XG == 0x12345678);
}

TEST_CASE( "adder lx 2 SGN") {
  State state;
  Entry_t entry;
  state.L = 0x12345678;
  entry.LX = 2;
  adderLX(state, entry);
  REQUIRE( state.XG == 0x80000000);
}

TEST_CASE( "adder lx 3 E") {
  State state;
  Entry_t entry;
  entry.LX = 3;
  entry.CE = 0x9;
  adderLX(state, entry);
  REQUIRE( state.XG == 0x12);
}

TEST_CASE( "adder lx 4 LRL") {
  State state;
  Entry_t entry;
  state.L = 0x12345678;
  entry.LX = 4; /* LRL */
  adderLX(state, entry);
  REQUIRE( state.XG == 0x56780000);
}

TEST_CASE( "adder lx 5 LWA") {
  State state;
  Entry_t entry;
    state.L = 0x12345678;
  entry.LX = 5;
  adderLX(state, entry);
  REQUIRE( state.XG == 0x1234567b);
  entry.LX = 5;
  entry.RY = 0;
  adderRY(state, entry);
  REQUIRE( state.Y == 3);
}

TEST_CASE( "adder lx 6 4") {
  State state;
  Entry_t entry;
  entry.LX = 6;
  adderLX(state, entry);
  REQUIRE( state.XG == 4);
}

TEST_CASE( "adder lx 7 64C", "[!hide]") {
  State state;
  Entry_t entry;
  entry.LX = 7;
  adderLX(state, entry);
  REQUIRE( state.XG == ~64); // Complement of 64
}

TEST_CASE( "adder RY 0 0") {
  State state;
  Entry_t entry;
  entry.RY = 0;
  adderRY(state, entry);
  REQUIRE( state.Y == 0);
}

TEST_CASE( "adder RY 1 R") {
  State state;
  Entry_t entry;
  state.R = 0x12345678;
  entry.RY = 1;
  adderRY(state, entry);
  REQUIRE( state.Y == 0x12345678);
}

TEST_CASE( "adder RY 2 M") {
  State state;
  Entry_t entry;
  state.M = 0x12345678;
  entry.RY = 2;
  adderRY(state, entry);
  REQUIRE( state.Y == 0x12345678);
}

TEST_CASE( "adder RY 3 M23") {
  State state;
  Entry_t entry;
  state.M = 0x12345678;
  entry.RY = 3;
  adderRY(state, entry);
  REQUIRE( state.Y == 0x5678);
}

TEST_CASE( "adder RY 4 H") {
  State state;
  Entry_t entry;
  state.H = 0x12345678;
  entry.RY = 4;
  adderRY(state, entry);
  REQUIRE( state.Y == 0x12345678);
}

TEST_CASE( "adder RY 5 SEMT", "[!hide]") {
}

  // Based on 02D3
TEST_CASE( "adder-dec") {
  State state;
  Entry_t entry;
  state.R = 0;
  entry.RY = 1;
  entry.TC = 0;
  entry.LX = 0;
  entry.TR = 1;
  entry.AD = 1;
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.T0 == 0xffffffff);
}

  // The default adder inputs when nothing happens
TEST_CASE( "adder-default") {
  State state;
  Entry_t entry;
  entry.RY = 0;
  entry.TC = 1;
  entry.LX = 0;
  entry.TR = 7;
  entry.AD = 1;
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.T0 == 0);
}

TEST_CASE( "adder ad 2 BCF0", "[!hide]") {
}

TEST_CASE( "adder-carry0 ad 4 BC0") {
  State state;
  Entry_t entry;
  state.XG = 0xffffffff;
  state.Y = 0x00000001;
  state.CIN = 0;
  entry.AD = 4; /* BC0 */
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0);

  state.R = 0xfffffffe;
  state.L = 0x00000001;
  state.CIN = 0;
  entry.RY = 1; /* R */
  entry.TC = 1;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 4;  /* BC0 */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0xffffffff);

  state.R = 0xffffffff;
  state.L = 0x10000000;
  state.CIN = 0;
  entry.RY = 1; /* R */
  entry.TC = 1;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 4;  /* BC0 */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0x0fffffff);
}

// 32-bit not
uint32_t invert(uint32_t x) {
  return (~x) ;
}

TEST_CASE( "adder-carry0 sub ad 4 BC0") {
  State state;
  Entry_t entry;
  // Basic subtraction is 1"s complement
  state.Y = 0x00000000;
  state.XG = invert(0x00000001);
  state.CIN = 0;
  entry.AD = 4; /* BC0 */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0xfffffffe); // R - L, subtraction is one short without carry-in

  state.Y = 0xffffffff;
  state.XG = invert(0x00000000);
  state.CIN = 0;
  entry.AD = 4; /* BC0 */
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0xfffffffe); // subtraction is one short

  state.Y = 0xefffffff;
  state.XG = invert(0x10000000);
  state.CIN = 0;
  entry.AD = 4; /* BC0 */
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0xdffffffe); // subtraction is one short
}

TEST_CASE( "adder-carry0 sub +hot1 ad 4 BC0") {
  State state;
  Entry_t entry;
  // Add hot1 to get 2"s complement subtraction
  state.Y = 0x00000000;
  state.XG = invert(0x00000001);
  entry.DG = 2; /* HOT1 */
  adderDG(state, entry);
  entry.AD = 4; /* BC0 */
  adderT(state, entry);
  REQUIRE( state.CAR == 0); // Carry = not borrow
  REQUIRE( state.T0 == 0xffffffff);

  state.Y = 0xffffffff;
  state.XG = invert(0x00000000);
  entry.DG = 2; /* HOT1 */
  adderDG(state, entry);
  entry.AD = 4; /* BC0 */
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0xffffffff);

  state.Y = 0xefffffff;
  state.XG = invert(0x10000000);
  entry.DG = 2; /* HOT1 */
  adderDG(state, entry);
  entry.AD = 4; /* BC0 */
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0xdfffffff);
}

TEST_CASE( "adder-overflow ad 5 BC⩝C") {
  State state;
  Entry_t entry;
  // Normal positive addition
  state.XG = 0x12345678;
  state.Y = 0x12345678;
  state.CIN = 0;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0x12345678 + 0x12345678);

  // positive + positive yields negative overflow
  // Normal positive addition
  state.XG = 0x12345678;
  state.Y = 0x12345678;
  state.CIN = 0;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0x12345678 + 0x12345678);

  // positive + positive yields negative overflow
  state.XG = 0x70000000;
  state.Y = 0x70000000;
  state.CIN = 0;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0xe0000000);

  // positive + negative okay
  state.XG = 0x70000000;
  state.Y = 0xffffffff;
  state.CIN = 0;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0x6fffffff);

  // negative + negative okay
  state.XG = 0xffffffff;
  state.Y = 0xffffffff;
  state.CIN = 0;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0xfffffffe);


  state.XG = 0x80000000;
  state.Y = 0xffffffff;
  state.CIN = 0;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0x7fffffff);

  // -1 + 0: no overflow
  state.XG = 0x00000000;
  state.Y = 0xffffffff;
  state.CIN = 0;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0xffffffff);

  // -1 + 0 + carry: no overflow
  state.XG = 0x00000000;
  state.Y = 0xffffffff;
  state.CIN = 1;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0);

  // -1 + 0 + carry: no overflow
  state.Y = 0x00000000;
  state.XG = 0xffffffff;
  state.CIN = 1;
  entry.AD = 5; /* BC⩝C */
  adderT(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0);
}

TEST_CASE( "adder-subtract-overflow ad 5 BC⩝C") {
  State state;
  Entry_t entry;
  // Normal positive subtraction: note that L is subtracted from R
  state.R = 0x12345678;
  state.L = 0x12345677;
  entry.RY = 1; /* R */
  entry.TC = 0;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 5;  /* BC⩝C */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0); // 1"s complement subtraction

  // positive - positive yields negative
  state.R = 0x70000000;
  state.L = 0x70000001;
  entry.RY = 1; /* R */
  entry.TC = 0;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 5;  /* BC⩝C */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0xfffffffe);

  // positive - negative okay
  state.R = 0x12345678;
  state.L = 0xffffffff;
  entry.RY = 1; /* R */
  entry.TC = 0;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 5;  /* BC⩝C */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0x12345678);

  // positive - negative overflow
  state.R = 0x7fffffff;
  state.L = 0xfffffffe;
  entry.RY = 1; /* R */
  entry.TC = 0;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 5;  /* BC⩝C */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0x80000000);

  // negative - negative okay
  state.R = 0xfffffffe;
  state.L = 0xffffffff;
  entry.RY = 1; /* R */
  entry.TC = 0;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 5;  /* BC⩝C */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 0);
  REQUIRE( state.T0 == 0xfffffffe);

  // negative - positive overflow
  state.R = 0x80000000;
  state.L = 0x00000001;
  entry.RY = 1; /* R */
  entry.TC = 0;
  entry.LX = 1; /* L */
  entry.TR = 7;
  entry.AD = 5;  /* BC⩝C */
  entry.AL = 0;
  entry.DG = 0;
  adder(state, entry);
  REQUIRE( state.CAR == 1);
  REQUIRE( state.T0 == 0x7ffffffe);
}

// Block carry from 8, save carry from 1. Used for floating point exponent math.
TEST_CASE( "adder ad 6 BC1B") {
  State state;
  Entry_t entry;
  // Exponents equal
  state.XG = 0x12345678;
  state.AUX = 0;
  state.Y = (~(0x12345678)) ;
  state.CIN = 1;
  entry.AD = 6;
  adderT(state, entry);
  REQUIRE( state.T0 == 0x00000000);
  REQUIRE( state.CAR == 1); // Carry

  // Exponents equal, sign different
  state.XG = 0x12345678;
  state.AUX = 0;
  state.Y = (~(0x92345678)) ;
  state.CIN = 1;
  entry.AD = 6;
  adderT(state, entry);
  REQUIRE( state.T0 == 0x80000000);
  REQUIRE( state.CAR == 1); // Carry

  // First exponent smaller
  state.XG = 0x11345678;
  state.AUX = 0;
  state.Y = (~(0x12345678)) ;
  state.CIN = 1;
  entry.AD = 6;
  adderT(state, entry);
  REQUIRE( state.T0 == 0x7f000000);
  REQUIRE( state.CAR == 0); // No carry

  // First exponent larger
  state.XG = 0x13345678;
  state.AUX = 0;
  state.Y = (~(0x92345678)) ;
  state.CIN = 1;
  entry.AD = 6;
  adderT(state, entry);
  REQUIRE( state.T0 == 0x81000000);
  REQUIRE( state.CAR == 1); // Carry
}

// Carry out of pos 8
TEST_CASE( "adderT ad 7 BC8") {
  State state;
  Entry_t entry;
  state.XG = 0x00000000;
  state.AUX = 0;
  state.Y = 0xffffffff;
  state.CIN = 0;
  entry.AD = 7;
  adderT(state, entry);
  REQUIRE( state.CAR == 0);

  state.XG = 0x00800000;
  state.AUX = 0;
  state.Y = 0x00800000;
  state.CIN = 0;
  entry.AD = 7;
  adderT(state, entry);
  REQUIRE( state.CAR == 1);

  state.XG = 0x00ffffff;
  state.AUX = 0;
  state.Y = 0x00000001;
  state.CIN = 0;
  entry.AD = 7;
  adderT(state, entry);
  REQUIRE( state.CAR == 1);
}

TEST_CASE( "adderT ad 8 DHL") {
  State state;
  Entry_t entry;
  state.XG = 0xdddddddd;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 8;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0); // No correction

  state.XG = 0xdddddd2d;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 8;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x6); // Low-order

  state.XG = 0x22222222;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 8;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x06666666); // All correction

  state.XG = 0xdddddddd;
  state.AUX = 1;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 8;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x60000000); // Aux correction
  REQUIRE( state.AUX == 0);

  state.XG = 0xdddddd22;
  state.AUX = 1;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 8;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x60000006); // Low-order, aux

  state.XG = 0x22222220;
  state.AUX = 1;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 8;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x66666666); // All correction, AUX
}

TEST_CASE( "adder ad 9 DC0") {
  State state;
  Entry_t entry;
  setS(state, {0, 1, 0, 0, 0, 0, 0, 0});
  entry.AD = 9;
  entry.DG = 0;
  adderDG(state, entry); // Note AD 9 implemented in adderDG
  REQUIRE( state.CIN == 1);
}

TEST_CASE( "adder ad 10 DDC0", "[!hide]") {
}

TEST_CASE( "adderT ad 11 DHH") {
  State state;
  Entry_t entry;
  state.XG = 0xdddddddd;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 11;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0); // No correction
  REQUIRE( state.AUX == 0);

  state.XG = 0xddddddd2;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 11;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0); // No correction, aux
  REQUIRE( state.AUX == 1);

  state.XG = 0x22222220;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 11;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x06666666); // All correction
  REQUIRE( state.AUX == 0);

  state.XG = 0xffffffff;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 11;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x06666666); // All correction, AUX
  REQUIRE( state.AUX == 1);

  state.XG = 0x22002002;
  state.AUX = 0;
  state.Y = 0;
  state.CIN = 0;
  entry.AD = 11;
  adderT(state, entry);
  REQUIRE( state.pending.L == 0x06600600); // Some correction, AUX
  REQUIRE( state.AUX == 1);
}

TEST_CASE( "adder ad 12 DCBS", "[!hide]") {
}

TEST_CASE( "adder dg 1 CSTAT→ADDER") {
  State state;
  Entry_t entry;
  state.CSTAT = 0;
  entry.DG = 1; /* CSTAT→ADDER */
  adderDG(state, entry);
  REQUIRE( state.CIN == 0);

  state.CSTAT = 1;
  entry.DG = 1; /* CSTAT→ADDER */
  adderDG(state, entry);
  REQUIRE( state.CIN == 1);
}

TEST_CASE( "adder dg2 HOT1→ADDER") {
  State state;
  Entry_t entry;
  state.L = 0x12345678;
  entry.LX = 1; /* L */
  entry.RY = 0; /* 0 */
  entry.TC = 1; /* add */
  entry.AD = 1; /* default op */
  entry.DG = 2; /* HOT1→ADDER */
  adder(state, entry);
  REQUIRE( state.T0 == 0x12345679);
}

TEST_CASE( "adder dg 3 G1-1") {
  State state;
  Entry_t entry;
  state.G1 = 1;
  entry.DG = 3; /* G1-1 */
  adderDG(state, entry);
  REQUIRE( state.G1NEG == 0);
  REQUIRE( state.pending.G1 == 0);

  state.G1 = 0;
  entry.DG = 3; /* G1-1 */
  adderDG(state, entry);
  REQUIRE( state.G1NEG == 1);
  REQUIRE( state.pending.G1 == 0); // No change
}

TEST_CASE( "adder dg 4 HOT1,G-1") {
  State state;
  Entry_t entry;
  state.G1 = 2;
  state.G2 = 1;
  entry.DG = 4;
  adderDG(state, entry);
  REQUIRE( state.pending.G1 == 0); // no change
  REQUIRE( state.pending.G2 == 0);
  REQUIRE( state.CIN == 1);

  state.G1 = 2;
  state.G2 = 0;
  entry.DG = 4;
  adderDG(state, entry);
  REQUIRE( state.pending.G1 == 1);
  REQUIRE( state.pending.G2 == 0xf);
  REQUIRE( state.CIN == 1);
}

TEST_CASE( "adder dg 5 G2-1") {
  State state;
  Entry_t entry;
  state.G2 = 1;
  entry.DG = 5; /* G2-1 */
  adderDG(state, entry);
  REQUIRE( state.G2NEG == 0);
  REQUIRE( state.pending.G2 == 0);

  state.G2 = 0;
  entry.DG = 5; /* G2-1 */
  adderDG(state, entry);
  REQUIRE( state.G2NEG == 1);
  REQUIRE( state.pending.G2 == 0); // No change below 0
}

TEST_CASE( "adder dg 6 G-1") {
  State state;
  Entry_t entry;
  state.G1 = 2;
  state.pending.G1 = 2;
  state.G2 = 1;
  entry.DG = 6;
  adderDG(state, entry);
  REQUIRE( state.pending.G1 == 2); // No change
  REQUIRE( state.pending.G2 == 0);

  state.G1 = 2;
  state.pending.G1 = 2;
  state.G2 = 0;
  entry.DG = 6;
  adderDG(state, entry);
  REQUIRE( state.pending.G1 == 1);
  REQUIRE( state.pending.G2 == 0xf);
}

TEST_CASE( "adder dg 7 G1,2-1") {
  State state;
  Entry_t entry;
  state.G1 = 0;
  state.G2 = 1;
    state.pending.G1 = 7;
  entry.DG = 7;
  adderDG(state, entry);
  REQUIRE( state.G1NEG == 1);
  REQUIRE( state.G2NEG == 0);
  REQUIRE( state.pending.G1 == 7); // No change
  REQUIRE( state.pending.G2 == 0);

  state.G1 = 0xf;
  state.G2 = 0;
  entry.DG = 7;
  adderDG(state, entry);
  REQUIRE( state.G1NEG == 0);
  REQUIRE( state.G2NEG == 1);
  REQUIRE( state.pending.G1 == 0xe);
  REQUIRE( state.pending.G2 == 0); // No change
}


TEST_CASE( "iar0") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.R = 0x56781234;
  entry.IV = 0;
  iar(state, entry);
#if 0
  assert.expect(0);
#endif
}

TEST_CASE( "iar iv 1 WL→IVD") {
  State state;
  Entry_t entry;
  state.WL = 0x0;
  entry.IV = 1;
  iar(state, entry); // Nop, implemented in iar2
  entry.IV = 1;
  iar2(state, entry);
  state.WL = 0x9;
  entry.IV = 1;
  iar2(state, entry);
# if 0
  assert.throws(function() {
  state.WL = 0xa;
  entry.IV = 1;
    iar2(state, entry);
  }
#endif
}

TEST_CASE( "iar iv 2 WR→IVD") {
  State state;
  Entry_t entry;
  state.WR = 0x0;
  entry.IV = 2;
  iar(state, entry); // Nop, implemented in iar2
  entry.IV = 2;
  iar2(state, entry);
  state.WR = 0x9;
  entry.IV = 2;
  iar2(state, entry);
#if 0
  assert.throws(function() {
  state.WR = 0xa;
  entry.IV = 2;
    iar2(state, entry);
  }
#endif
}

TEST_CASE( "iar iv 3 W→IVD") {
  State state;
  Entry_t entry;
  state.WL = 0x0;
  state.WR = 0x4;
  entry.IV = 3;
  iar(state, entry); // Nop, implemented in iar2
  entry.IV = 3;
  iar2(state, entry);
#if 0
  assert.throws(function() {
  state.WL = 0xa;
  entry.IV = 3;
    iar2(state, entry);
  }
  assert.throws(function() {
  state.WL = 0x0;
  state.WR = 0xf;
  entry.IV = 3;
    iar2(state, entry);
  }
#endif
}

TEST_CASE( "iar iv 4 IA/4→A,IA") {
  State state;
  Entry_t entry;
  state.IAR = 0x12340000;
  entry.IV = 4;
  iar(state, entry);
  REQUIRE( state.IAR == 0x12340004);
  REQUIRE( state.SAR == 0x12340004);
}

TEST_CASE( "iar iv 5 IA+2/4") {
  State state;
  Entry_t entry;
  // instruction length << 30
  state.ILC = 0;
  state.IAR = 0x12340000;
  entry.IV = 5;
  iar(state, entry);
  REQUIRE( state.IAR == 0x12340000);

  state.ILC = 1;
  state.IAR = 0x12340000;
  entry.IV = 5;
  iar(state, entry);
  REQUIRE( state.IAR == 0x12340002); // +2

  state.ILC = 2;
  state.IAR = 0x12340000;
  entry.IV = 5;
  iar(state, entry);
  REQUIRE( state.IAR == 0x12340004); // +4

  state.ILC = 3;
  state.IAR = 0x12340000;
  entry.IV = 5;
  iar(state, entry);
  REQUIRE( state.IAR == 0x12340004); // +4
}

TEST_CASE( "iar iv 6 IA+2") {
  State state;
  Entry_t entry;
  state.IAR = 0x12340000;
  entry.IV = 6;
  iar(state, entry);
  REQUIRE( state.IAR == 0x12340002);
}

TEST_CASE( "iar iv 7 IA+0/2→A") {
  State state;
  Entry_t entry;
  // No refetch: should increment
  state.SAR = 1;
  state.IAR = 0x12340002;
  state.REFETCH = 0;
  entry.IV = 7;
  entry.ZN = 0;
  iar(state, entry);
  REQUIRE( state.SAR == 0x12340004);
  // Refetch, no increment
  state.SAR = 1;
  state.IAR = 0x12340002;
  state.REFETCH = 1;
  entry.IV = 7;
  entry.ZN = 0;
  iar(state, entry);
  REQUIRE( state.SAR == 0x12340002);

  // Even halfword, SMIF. Should increment. But rounded down? So no change?
  // Unclear if this case should increment or not or if it matters.
  state.SAR = 1;
  state.IAR = 0x12340000;
  state.REFETCH = 0;
  entry.IV = 7;
  entry.ZN = 1;
  iar(state, entry);
  REQUIRE( state.SAR == 0x12340000);
  // Odd halfword, no refetch, SMIF. Should skip access.
  state.SAR = 1;
  state.IAR = 0x12340002;
  state.REFETCH = 0;
  entry.IV = 7;
  entry.ZN = 1;
  iar(state, entry);
  REQUIRE( state.SAR == 1);
  // Odd halfword, refetch, SMIF. Should not increment
  state.SAR = 1;
  state.IAR = 0x12340002;
  state.REFETCH = 1;
  entry.IV = 7;
  entry.ZN = 1;
  iar(state, entry);
  REQUIRE( state.SAR == 0x12340002);
}

TEST_CASE( "latch tr 1 R") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.R = 0x56781234;
  entry.TR = 1; /* R */
  adderLatch(state, entry);
  REQUIRE( state.R == 0x12345678);
}

TEST_CASE( "latch tr 2 R0") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.R = 0x56781234;
  entry.TR = 2; /* R0 */
  adderLatch(state, entry);
  REQUIRE( state.R == 0x12781234);
}

TEST_CASE( "latch tr 3 M") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.R = 0x56781234;
  entry.TR = 3; /* M */
  adderLatch(state, entry);
  REQUIRE( state.M == 0x12345678);
}

TEST_CASE( "latch tr 4 D") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.R = 0x56781234;
  state.SAR = 0x20;
  entry.TR = 4; /* M */
  adderLatch(state, entry);
  REQUIRE( state.SDR == 0x12345678);
  REQUIRE( state.MS[0x20] == 0x12345678);
}

TEST_CASE( "latch tr 5 L0") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.L = 0x56781234;
  entry.TR = 5; /* L0 */
  adderLatch(state, entry);
  REQUIRE( state.L == 0x12781234);
}

TEST_CASE( "latch tr 6 R,A") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.R = 0x56781234;
  entry.TR = 6; /* R,A */
  adderLatch(state, entry);
  REQUIRE( state.R == 0x12345678);
  REQUIRE( state.SAR == 0x12345678);
}

TEST_CASE( "latch tr 7 L") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 7; /* L */
  adderLatch(state, entry);
  REQUIRE( state.L == 0x12345678);
}

TEST_CASE( "latch tr 8 HA→A", "[!hide]") {
}

TEST_CASE( "latch tr 9 R,AN") {
  State state;
  Entry_t entry;
  state.T = 0x12345679;
  entry.TR = 9; /* R,AN */
  adderLatch(state, entry);
  REQUIRE( state.R == 0x12345679);
  REQUIRE( state.SAR == 0x12345679);
  REQUIRE( state.TRAP == 0);
}

TEST_CASE( "latch tr 10 R,AW") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 10; /* R,AW */
  adderLatch(state, entry);
  REQUIRE( state.R == 0x12345678);
  REQUIRE( state.SAR == 0x12345678);
  REQUIRE( state.TRAP == 0);
  state.T = 0x12345672;
  }

TEST_CASE( "latch tr 11 R,AD") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 11; /* R,AD */
  adderLatch(state, entry);
  REQUIRE( state.R == 0x12345678);
  REQUIRE( state.SAR == 0x12345678);
  state.T = 0x12345674;
}

TEST_CASE( "latch tr 12 D→IAR") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.SAR = 0x10;
  state.MS[0x10] = 0x3456789a;
  entry.TR = 12; /* IAR */
  adderLatch(state, entry);
  REQUIRE( state.IAR == 0x0006789a);
}

TEST_CASE( "latch tr 13 SCAN→D", "[!hide]") {
}

TEST_CASE( "latch tr 14 R13") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.R = 0xaabbccdd;
  entry.TR = 14;
  adderLatch(state, entry);
  REQUIRE( state.R == 0xaa345678);
}

TEST_CASE( "latch tr 15 A") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 15;
  adderLatch(state, entry);
  REQUIRE( state.SAR == 0x12345678);
}

TEST_CASE( "latch tr 16 L,A") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 16;
  adderLatch(state, entry);
  REQUIRE( state.L == 0x12345678);
  REQUIRE( state.SAR == 0x12345678);
}

// 17: I/O

// 18: unused

// 19: I/O

TEST_CASE( "latch tr 20 H") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 20; /* H */
  adderLatch(state, entry);
  REQUIRE( state.H == 0x12345678);
}

TEST_CASE( "latch tr 21 IA") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 21;
  adderLatch(state, entry);
  REQUIRE( state.IAR == 0x00345678);
}

TEST_CASE( "latch tr 22 FOLD→D", "[!hide]") {
}

// 23: unused

TEST_CASE( "latch tr 24 L,M") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 24;
  adderLatch(state, entry);
  REQUIRE( state.L == 0x12345678);
  REQUIRE( state.M == 0x12345678);
}

  // Complex instruction decoding
TEST_CASE( "latch 25 MLJK") {
  State state;
  Entry_t entry;
  // X=0, B=0
  state.T = 0x12300678;
  entry.TR = 25;
  adderLatch(state, entry);
  REQUIRE( state.L == state.T);
  REQUIRE( state.M == state.T);
  REQUIRE( state.REFETCH == 0);
  REQUIRE( state.J == 0);
  REQUIRE( state.MD == 0);
  REQUIRE( state.S[0] == 1); // X=0, i.e. T(12-15) == J
  REQUIRE( state.S[1] == 1); // B=0, i.e. T(16-19) == MD

  // X=4, B=0
  state.T = 0x12340678;
  entry.TR = 25;
  adderLatch(state, entry);
  REQUIRE( state.L == state.T);
  REQUIRE( state.M == state.T);
  REQUIRE( state.REFETCH == 0);
  REQUIRE( state.J == 4);
  REQUIRE( state.MD == 0);
  REQUIRE( state.S[0] == 0); // X!=0, i.e. T(12-15) == J
  REQUIRE( state.S[1] == 1); // B=0, i.e. T(16-19) == MD

  // X=4, B=5
  state.T = 0x12345678;
  entry.TR = 25;
  adderLatch(state, entry);
  REQUIRE( state.L == state.T);
  REQUIRE( state.M == state.T);
  REQUIRE( state.REFETCH == 0);
  REQUIRE( state.J == 4);
  REQUIRE( state.MD == 5);
  REQUIRE( state.S[0] == 0); // X!=0, i.e. T(12-15) == J
  REQUIRE( state.S[1] == 0); // B!=0, i.e. T(16-19) == MD

  // X=0, B=5
  state.T = 0x12305678;
  entry.TR = 25;
  adderLatch(state, entry);
  REQUIRE( state.L == state.T);
  REQUIRE( state.M == state.T);
  REQUIRE( state.REFETCH == 0);
  REQUIRE( state.J == 0);
  REQUIRE( state.MD == 5);
  REQUIRE( state.S[0] == 1); // X=0, i.e. T(12-15) == J
  REQUIRE( state.S[1] == 0); // B=0, i.e. T(16-19) == MD

  // Now test ILC, SYL1
  for (int i = 0; i < 16; i++) {
  state.T = i << 28;
  entry.TR = 25;
    adderLatch(state, entry);
    int top2 = i >> 2;
    if (top2 == 0) {
      REQUIRE( state.SYL1 == 1);
      REQUIRE( state.ILC == 1);
    } else if (top2 == 1 || top2 == 2) {
      REQUIRE( state.SYL1 == 0);
      REQUIRE( state.ILC == 2);
    } else {
      REQUIRE( state.SYL1 == 0);
      REQUIRE( state.ILC == 3);
    }
  }
}

TEST_CASE( "latch tr 26 MHL") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.M = 0x11223344;
  entry.TR = 26;
  adderLatch(state, entry);
  REQUIRE( state.MD == 0x1);
  REQUIRE( state.M == 0x11221234);
}

TEST_CASE( "latch tr 27 MD") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 27;
  adderLatch(state, entry);
  REQUIRE( state.MD == 0x3);
}

TEST_CASE( "latch tr 28 M,SP") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 28;
  adderLatch(state, entry);
  REQUIRE( state.M == 0x12345678);
  REQUIRE( state.KEY == 0x3);
}

TEST_CASE( "latch29 D*BS") {
  State state;
  Entry_t entry;
  // BS = 0011: only modify last two memory words
  state.T = 0x12345678;
  setBS(state, 0, 0, 1, 1);
  state.SAR = 0x30;
  state.MS[0x30] = 0x9abcdef0;
  entry.TR = 29;
  adderLatch(state, entry);
  REQUIRE( state.SDR == 0x9abc5678);
  REQUIRE( state.MS[0x30] == 0x9abc5678);
}

TEST_CASE( "latch tr 30 L13") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  state.L = 0xaabbccdd;
  entry.TR = 30;
  adderLatch(state, entry);
  REQUIRE( state.L == 0xaa345678);
}

TEST_CASE( "latch tr 31 J") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.TR = 31; /* J */
  adderLatch(state, entry);
  REQUIRE( state.J == 0x4); // Note bits 12-15
}

TEST_CASE( "mover") {
  State state;
  Entry_t entry;
  // Extract 5 from E, 8 from M3
  state.M = 0x12345678;
  state.MB = 3;
  entry.LU = 0;
  entry.MV = 2; /* MMB */
  entry.UL = 0; /* E */
  entry.UR = 2; /* V */
  entry.WM = 6; /* WL->J */
  entry.CE = 0x5;
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == 0x58);
  REQUIRE( state.WL == 0x5);
  REQUIRE( state.J == 0x5);
  REQUIRE( state.WR == 0x8);
}

TEST_CASE( "mover lu 4 XTR") {
  State state;
  Entry_t entry;
  state.M = 0x12345678;
  state.MB = 3;
  entry.LU = 4; /* XTR */
  entry.MV = 2; /* MMB */
  entry.UL = 0; /* E */
  entry.UR = 2; /* V */
  entry.WM = 6; /* WL->J */
  entry.CE = 0x5;
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.U == 0);
}

TEST_CASE( "mover2") {
  State state;
  Entry_t entry;
  // E->WR, W->MMB
  state.MB = 0;
  state.M = 0x12345678;
  entry.LU = 0;
  entry.MV = 0;
  entry.UL = 1;
  entry.UR = 0;
  entry.WM = 1;
  entry.RY = 0;
  entry.CE = 7;
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == 7);
  REQUIRE( state.WL == 0);
  REQUIRE( state.WR == 7);
  REQUIRE( state.M == 0x07345678);
}

TEST_CASE( "movers") {
  State state;
  Entry_t entry;
  // E->WR, W->MMB
  state.LB = 0;
  state.L = 0x34000000;
  state.MB = 0;
  state.M = 0x12000000;
  // LLB -> U, MLB -> V, ?->WL, ?->WR
  entry.LU = 7;
  entry.MV = 2;
  entry.UL = 3;
  entry.UR = 3;
  entry.WM = 0;
  state.WFN = 1; // or
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == uint8_t(0x12 | 0x34));

  state.WFN = 2; // and
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == uint8_t(0x12 & 0x34));

  state.WFN = 3; // xor
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == uint8_t(0x12 ^ 0x34));

  state.WFN = 4; // char
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == 0x34);

  state.WFN = 5; // zone
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == 0x32); // Assuming w"s zone is overwritten, keep numeric

  state.WFN = 6; // numeric
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == 0x14);

  state.WFN = 0; // cross
  moverU(state, entry);
  moverV(state, entry);
  moverWL(state, entry);
  moverWR(state, entry);
  storeMover(state, entry);
  REQUIRE( state.W == 0x43);
}

TEST_CASE("moverU 0") {
  State state;
  Entry_t entry;
  entry.LU = 0;
  moverU(state, entry);
  REQUIRE( state.U == 0);
}

TEST_CASE("moverU 1 MD,F") {
  State state;
  Entry_t entry;
  state.MD = 0x3;
  state.F = 0x4;
  entry.LU = 1;
  moverU(state, entry);
  REQUIRE( state.U == 0x34);
}

TEST_CASE("moverU 2 R3") {
  State state;
  Entry_t entry;
  state.R = 0x11223344;
  entry.LU = 2;
  moverU(state, entry);
  REQUIRE( state.U == 0x44);
}

TEST_CASE("moverU 4 XTR") {
  State state;
  Entry_t entry;
  entry.LU = 4;
  moverU(state, entry);
  REQUIRE( state.U == 0);
}

TEST_CASE("moverU 5 PSW4") {
  State state;
  Entry_t entry;
  state.ILC = 2;
  state.CR = 3;
  state.PROGMASK = 0xa;
  entry.LU = 5;
  moverU(state, entry);
  REQUIRE( state.U == 0xba);
}

TEST_CASE("moverU 6 LMB") {
  State state;
  Entry_t entry;
  state.L = 0x11223344;
  state.MB = 2;
  entry.LU = 6;
  moverU(state, entry);
  REQUIRE( state.U == 0x33);
}

TEST_CASE("moverU 7 LLB") {
  State state;
  Entry_t entry;
  state.L = 0x11223344;
  state.LB = 1;
  entry.LU = 7;
  moverU(state, entry);
  REQUIRE( state.U == 0x22);
}

TEST_CASE("moverV 0 0") {
  State state;
  Entry_t entry;
  entry.MV = 0;
  moverV(state, entry);
  REQUIRE( state.V == 0);
}

TEST_CASE("moverV 1 MLB") {
  State state;
  Entry_t entry;
  state.M = 0x11223344;
  state.LB = 1;
  entry.MV = 1;
  moverV(state, entry);
  REQUIRE( state.V == 0x22);
}

TEST_CASE("moverV 2 MMB") {
  State state;
  Entry_t entry;
  state.M = 0x11223344;
  state.MB = 2;
  entry.MV = 2;
  moverV(state, entry);
  REQUIRE( state.V == 0x33);
}

TEST_CASE("storeMover WM 1 W→MMB") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 0x8;
  state.WR = 0x9;
  state.MB = 2;
  state.M = 0x11223344;
  entry.WM = 1;
  storeMover(state, entry);
  REQUIRE( state.M == 0x11228944);
}

TEST_CASE("storeMover WM 2 W67→MB") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 2;
  storeMover(state, entry);
  REQUIRE( state.MB == 1);
}

TEST_CASE("storeMover WM 3 W67→LB") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 3;
  storeMover(state, entry);
  REQUIRE( state.LB == 1);
}

TEST_CASE("storeMover WM 4 W27→PSW4") {
  State state;
  Entry_t entry;
  state.W = 0x98;
  state.WL = 9;
  state.WR = 8;
  entry.WM = 4;
  storeMover(state, entry);
  REQUIRE( state.CR == 0x1);
  REQUIRE( state.PROGMASK == 0x8);
}

TEST_CASE("storeMover WM 5 W→PSW0") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 5;
  storeMover(state, entry);
  REQUIRE( state.SYSMASK == 0x89);
}

TEST_CASE("storeMover WM 6 WL→J") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 6;
  storeMover(state, entry);
  REQUIRE( state.J == 8);
}

TEST_CASE("storeMover WM 7 W→CHCTL", "[!hide]") {
}

TEST_CASE("storeMover WM 8 W,E→A(BUMP)") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 8;
  entry.CE = 7;
  storeMover(state, entry);
  REQUIRE( state.SAR == 0x100089c);
}

TEST_CASE("storeMover WM 9 WL→G1") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 9;
  storeMover(state, entry);
  REQUIRE( state.pending.G1 == 8);
}

TEST_CASE("storeMover WM 10 WR→G2") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 10;
  storeMover(state, entry);
  REQUIRE( state.pending.G2 == 9);
}

TEST_CASE("storeMover WM 11 W→G") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 11;
  storeMover(state, entry);
  REQUIRE( state.pending.G1 == 8);
  REQUIRE( state.pending.G2 == 9);
}

TEST_CASE("storeMover WM 12 W→MMB(E?)", "[!hide]") {
}

TEST_CASE("storeMover WM 13 WL→MD") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 13;
  storeMover(state, entry);
  REQUIRE( state.MD == 8);
}

TEST_CASE("storeMover WM 14 WR→F") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 14;
  storeMover(state, entry);
  REQUIRE( state.F == 9);
}

TEST_CASE("storeMover WM 15 W→MD,F") {
  State state;
  Entry_t entry;
  state.W = 0x89;
  state.WL = 8;
  state.WR = 9;
  entry.WM = 15;
  storeMover(state, entry);
  REQUIRE( state.MD == 8);
  REQUIRE( state.F == 9);
}

TEST_CASE( "counters") {
  State state;
  Entry_t entry;
  state.LB = 1;
  state.MB = 1;
  state.MD = 1;
  entry.UP = 0; /* 0 -> */
  entry.LB = 1;
  entry.MB = 0;
  entry.MD = 0;
  counters(state, entry);
  REQUIRE( state.LB == 0);
  REQUIRE( state.MB == 1);
  REQUIRE( state.MD == 1);
  entry.UP = 1; /* 3 -> */
  entry.LB = 0;
  entry.MB = 1;
  entry.MD = 0;
  counters(state, entry);
  REQUIRE( state.LB == 0);
  REQUIRE( state.MB == 3);
  REQUIRE( state.MD == 1);
  entry.UP = 2; /* dec */
  entry.LB = 0;
  entry.MB = 1;
  entry.MD = 1;
  counters(state, entry);
  REQUIRE( state.LB == 0);
  REQUIRE( state.MB == 2);
  REQUIRE( state.MD == 0);
  entry.UP = 3; /* inc */
  entry.LB = 1;
  entry.MB = 1;
  entry.MD = 0;
  counters(state, entry);
  REQUIRE( state.LB == 1);
  REQUIRE( state.MB == 3);
  REQUIRE( state.MD == 0);
}

TEST_CASE( "localStorage") {
  State state;
  Entry_t entry;
  for (int i = 0; i < 64; i++) {
    state.LS[i] = i;
  }
  entry.WS = 1; /* WS1 -> LSA */
  entry.SF = 2; /* LS->R->LS */
  entry.WS = 1; /* WS1 -> LSA */
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 17); // LSFN = 0b110001
  entry.SF = 2; /* LS->R->LS */
  localStore(state, entry);
  REQUIRE( state.R == 17);
}

TEST_CASE("localStorage LSAR 1 WS1→LSA") {
  State state;
  Entry_t entry;
  entry.WS = 1;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x11);
}

TEST_CASE("localStorage LSAR 2 WS2→LSA") {
  State state;
  Entry_t entry;
  entry.WS = 2;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x12);
}

TEST_CASE("localStorage LSAR 3 WS,E→LSA") {
  State state;
  Entry_t entry;
  entry.WS = 3;
  entry.CE = 5;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x15);
}

TEST_CASE("localStorage LSAR 4 FN,J→LSA") {
  State state;
  Entry_t entry;
  state.FN = 2;
  state.J = 3;
  entry.WS = 4;
  entry.SF = 7;
  state.LSAR = 0;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0); // Blocked by SF=7
  state.FN = 2;
  state.J = 3;
  entry.WS = 4;
  entry.SF = 0;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x23);
}

TEST_CASE("localStorage LSAR 5 FN,JΩ1→LSA") {
  State state;
  Entry_t entry;
  state.FN = 2;
  state.J = 2;
  entry.WS = 5;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x23);
}

TEST_CASE("localStorage LSAR 6 FN,MD→LSA") {
  State state;
  Entry_t entry;
  state.FN = 2;
  state.MD = 7;
  entry.WS = 6;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x27);
}

TEST_CASE("localStorage LSAR 7 FN,MDΩ1→LSA") {
  State state;
  Entry_t entry;
  state.FN = 2;
  state.MD = 6;
  entry.WS = 7;
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x27);
}

TEST_CASE( "localStorage SF=0 R→LS") {
  State state;
  Entry_t entry;
  state.LSAR = 0x32;
  state.LS[0x32] = 0x12345678;
  state.R = 0x11223344;
  entry.SF = 0;
  localStore(state, entry);
  REQUIRE( state.LS[0x32] == 0x11223344);
  REQUIRE( state.R == 0x11223344);
}

TEST_CASE( "localStorage SF=1 LS→L,R→LS") {
  State state;
  Entry_t entry;
  state.LSAR = 0x32;
  state.LS[0x32] = 0x12345678;
  state.R = 0x11223344;
  entry.SF = 1;
  localStore(state, entry);
  REQUIRE( state.LS[0x32] == 0x11223344);
  REQUIRE( state.L == 0x12345678);
  REQUIRE( state.R == 0x11223344);
}

TEST_CASE( "localStorage WS=2 WS2→LSA, SF=2 LS→R→LS") {
  State state;
  Entry_t entry;
  state.LS[0x12] = 0x12345678;
  state.R = 0x11223344;
  entry.WS = 2;
  localStorageLSAR(state, entry); // WS2→LSA
  REQUIRE( state.LSAR == 0x12);
  entry.SF = 2;
  localStore(state, entry);
  REQUIRE( state.R == 0x12345678);
}

TEST_CASE( "localStorage SF=4 L→LS") {
  State state;
  Entry_t entry;
  state.LSAR = 0x32;
  state.LS[0x32] = 0x12345678;
  state.L = 0x11223344;
  entry.SF = 4;
  localStore(state, entry);
  REQUIRE( state.LS[0x32] == 0x11223344);
  REQUIRE( state.L == 0x11223344);
}

TEST_CASE( "localStorage SF=5 LS→R,L→LS") {
  State state;
  Entry_t entry;
  state.LSAR = 0x32;
  state.LS[0x32] = 0x12345678;
  state.L = 0x11223344;
  state.R = 0x55667788;
  entry.SF = 5;
  localStore(state, entry);
  REQUIRE( state.LS[0x32] == 0x11223344);
  REQUIRE( state.L == 0x11223344);
  REQUIRE( state.R == 0x12345678);
}

TEST_CASE( "localStorage SF=6 LS→L→LS") {
  State state;
  Entry_t entry;
  state.LSAR = 0x32;
  state.LS[0x32] = 0x12345678;
  state.L = 0x11223344;
  entry.SF = 6;
  localStore(state, entry);
  REQUIRE( state.LS[0x32] == 0x12345678);
  REQUIRE( state.L == 0x12345678);
}

TEST_CASE( "ls sf 0 R→LS") {
  State state;
  Entry_t entry;
  state.R = 0x12345678;
  state.LSAR = 0x31;
  // Update LSA
  entry.CE = 4;
  entry.WS = 3; /* WS,E→LSA */
  localStorageLSAR(state, entry);
  // Update LS
  entry.SF = 0; /* R→LS */
  localStore(state, entry);
  REQUIRE( state.LS[0x14] == 0x12345678);
}

TEST_CASE( "ls3  WS,E→LSA") {
  State state;
  Entry_t entry;
  state.R = 0x12345678;
  entry.CE = 5;
  entry.WS = 3; /* WS,E→LSA */
  localStorageLSAR(state, entry);
  REQUIRE( state.LSAR == 0x15); // LSFN = 0b110101
  entry.SF = 0; /* R→LS */
  localStore(state, entry);
  REQUIRE( state.LS[0x15] == 0x12345678);
}

TEST_CASE( "roar1") {
  State state;
  Entry_t entry;
  entry.ZP = 0x12;
  entry.ZF = 0x7;
  entry.ZN = 4;
  roar(state, entry);
  REQUIRE( state.ROAR == 0x49c);
  entry.AB = 1;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "roar-zn") {
  State state;
  Entry_t entry;
  // Test ZN functions
  state.ROAR = 0x49c;
  entry.ZP = 0x12;
  entry.ZF = 0x7;
  entry.ZN = 2; /* AΩ(B=0)→A */
  roarZN(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  entry.ZP = 0x12;
  entry.ZF = 0x7;
  entry.ZN = 3; /* AΩ(B=1)→A */
  roarZN(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  entry.ZP = 0x12;
  entry.ZF = 0x7;
  entry.ZN = 6; /* BΩ(A=0)→B */
  roarZN(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

  // Test ZF functions (ZN = 0)
TEST_CASE( "roar-zf") {
  State state;
  Entry_t entry;
  state.ROAR = 0x480;
  state.F = 3;
  entry.ZP = 0x12;
  entry.ZF = 10; /* F->ROAR */
  entry.ZN = 0;
  roarZN(state, entry);
  REQUIRE( state.ROAR == ((0x12 << 6) | (0x3 << 2)));

  state.ROAR = 0x4ff;
  state.ED = 0xf;
  entry.ZP = 0x12;
  entry.ZF = 12; /* ED->ROAR */
  entry.ZN = 0;
  roarZN(state, entry);
  REQUIRE( state.ROAR == 0x4ff);

  state.ROAR = 0x4ff;
  state.ED = 0;
  entry.ZP = 0x12;
  entry.ZF = 12; /* ED->ROAR */
  entry.ZN = 0;
  roarZN(state, entry);
  REQUIRE( state.ROAR == 0x4c3);

  state.ROAR = 0x480;
  state.M = 0x24ffffff;
  entry.ZP = 0x12;
  entry.ZF = 6; /* M(03)->ROAR */
  entry.ZN = 0;
  roarZN(state, entry);
  REQUIRE( state.ROAR == ((0x12 << 6) | (0x2 << 2)));

  state.ROAR = 0x480;
  state.M = 0x24ffffff;
  entry.ZP = 0x12;
  entry.ZF = 8; /* M(47)->ROAR */
  entry.ZN = 0;
  roarZN(state, entry);
  REQUIRE( state.ROAR == ((0x12 << 6) | (0x4 << 2)));
}

TEST_CASE( "ab 0 (0)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.AB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
}

TEST_CASE( "ab 1 (1)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.AB = 1;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 2 (S0)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 2;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {1, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 2;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 3 (S1)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 3;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 1, 0, 0, 0, 0, 0, 0});
  entry.AB = 3;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 4 (S2)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 4;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 1, 0, 0, 0, 0, 0});
  entry.AB = 4;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 5 (S3)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 5;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  entry.AB = 5;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}


TEST_CASE( "ab 6 (S4)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 6;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 1, 0, 0, 0});
  entry.AB = 6;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 7 (S5)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 7;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 1, 0, 0});
  entry.AB = 7;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 8 (S6)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 8;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 1, 0});
  entry.AB = 8;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 9 (S7)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 9;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 1});
  entry.AB = 9;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 10 (CSTAT)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.AB = 10;
  state.CSTAT = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.CSTAT = 1;
  entry.AB = 10;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

// 11 unused

TEST_CASE( "ab 12 (SYL1S)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.SYL1 = 0;
  entry.AB = 12;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.SYL1 = 1;
  entry.AB = 12;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 13 (LSGNS)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.LSGNS = 0;
  entry.AB = 13;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.LSGNS = 1;
  entry.AB = 13;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 14 (⩝SGNS)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.LSGNS = 0;
  state.RSGNS = 0;
  entry.AB = 14;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.LSGNS = 1;
  state.RSGNS = 0;
  entry.AB = 14;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
  state.ROAR = 0x49c;
  state.LSGNS = 0;
  state.RSGNS = 1;
  entry.AB = 14;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
  state.ROAR = 0x49c;
  state.LSGNS = 1;
  state.RSGNS = 1;
  entry.AB = 14;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
}

// 15 unused

TEST_CASE( "roar ab 16 CRMD") {
  State state;
  Entry_t entry;
  // Negative cases
  state.ROAR = 0x49c;
  state.CR = 0;
  state.MD = 7;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.CR = 1;
  state.MD = 11;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.CR = 2;
  state.MD = 13;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.CR = 3;
  state.MD = 14;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  // Positive cases
  state.ROAR = 0x49c;
  state.CR = 0;
  state.MD = 8;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.CR = 1;
  state.MD = 4;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.CR = 2;
  state.MD = 2;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.CR = 3;
  state.MD = 1;
  entry.AB = 16;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "roar ab 17 W=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.W = 1;
  entry.AB = 17;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.W = 0;
  entry.AB = 17;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "roar ab 18 WL=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.WL = 1;
  entry.AB = 18;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.WL = 0;
  entry.AB = 18;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "roar ab 19 WR=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.WR = 1;
  entry.AB = 19;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.WR = 0;
  entry.AB = 19;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "roar ab 20 MD=FP") {
  State state;
  Entry_t entry;
  for (int i = 0; i < 16; i++) {
      state.ROAR = 0x49c;
      state.MD = i;
      entry.AB = 20;
      roarAB(state, entry);
      if (i == 0 || i == 2 || i == 4 || i == 6) {
        REQUIRE( state.ROAR == (0x49c | 2));
      } else {
        REQUIRE( state.ROAR == (0x49c | 0));
      }
  }
}

TEST_CASE( "roar ab 21 MB=3") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.MB = 2;
  entry.AB = 21;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.MB = 3;
  entry.AB = 21;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "roar ab 22 G1=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.MD = 0xe;
  entry.AB = 22; /* MD3=0 */
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
  state.ROAR = 0x49c;
  state.MD = 0xf;
  entry.AB = 22; /* MD3=0 */
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
}

TEST_CASE( "roar ab 23 G1=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.G1 = 1;
  entry.AB = 23;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.G1 = 0;
  entry.AB = 23;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 24 (G1NEG)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.G1NEG = 0;
  entry.AB = 24;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.G1NEG = 1;
  entry.AB = 24;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 25 (G<4)") {
  State state;
  Entry_t entry;
  // Negative cases
  state.ROAR = 0x49c;
  state.G1 = 0;
  state.G2 = 4;
  entry.AB = 25;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.G1 = 1;
  state.G2 = 1;
  entry.AB = 25;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  // Positive cases
  state.ROAR = 0x49c;
  state.G1 = 0;
  state.G2 = 3;
  entry.AB = 25;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 26 (G1MBZ)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.G1 = 1;
  state.MB = 1;
  entry.AB = 26;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.G1 = 0;
  entry.AB = 26;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
  state.ROAR = 0x49c;
  state.G1 = 1;
  state.MB = 0;
  entry.AB = 26;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

// 27: I/O

// 28: I/O

TEST_CASE( "ab 29 R(31)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.R = 0xfffffffe;
  entry.AB = 29;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.R = 1;
  entry.AB = 29;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 30 F(2)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.F = 13;
  entry.AB = 30;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.F = 2;
  entry.AB = 30;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 31 L(0)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.L = 0x7fffffff;
  entry.AB = 31;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.L = 0x80000000;
  entry.AB = 31;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 32 F=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.F = 1;
  entry.AB = 32;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.F = 0;
  entry.AB = 32;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 33 (UNORM)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.T = 0xff0fffff;
  entry.AB = 33;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2)); // T8-11 == 0, not stat 0
  state.ROAR = 0x49c;
  setS(state, {1, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 33;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.T = 0xff1fffff;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 33;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
}

TEST_CASE("ab 34 TZ*BS") {
  State state;
  Entry_t entry;
  // Negative cases
  state.ROAR = 0x49c;
  state.T = 0x05000000;
  setBS(state, 1, 0, 0, 0);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.T = 0x00800000;
  setBS(state, 0, 1, 0, 0);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.T = 0x00001000;
  setBS(state, 0, 0, 1, 0);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.T = 0x00000004;
  setBS(state, 0, 0, 0, 1);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  // Positive cases
  state.ROAR = 0x49c;
  state.T = 0x00ffffff;
  setBS(state, 1, 0, 0, 0);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.T = 0xff00ffff;
  setBS(state, 0, 1, 0, 0);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.T = 0xffff00ff;
  setBS(state, 0, 0, 1, 0);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.T = 0xffffff00;
  setBS(state, 0, 0, 0, 1);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.T = 0xffffffff;
  setBS(state, 0, 0, 0, 0);
  entry.AB = 34;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 35 EDITPAT", "[!hide]") {
}

TEST_CASE( "ab 36 PROB") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.AMWP = 0xe;
  entry.AB = 36;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.AMWP = 1;
  entry.AB = 36;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE( "ab 37 TIMUP", "[!hide]") {
}

// 38 unused

TEST_CASE( "ab 39 (GZ/MB3)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.G1 = 0;
  state.G2 = 0;
  state.MB = 1;
  entry.AB = 39;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2)); // G == 0
  state.ROAR = 0x49c;
  state.G1 = 1;
  state.G2 = 1;
  state.MB = 3;
  entry.AB = 39;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2)); // MB = 3
  state.ROAR = 0x49c;
  state.G1 = 0;
  state.G2 = 1;
  state.MB = 2;
  entry.AB = 39;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0)); // G != 0 and MB != 3
  state.ROAR = 0x49c;
  state.G1 = 2;
  state.G2 = 0;
  state.MB = 0;
  entry.AB = 39;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0)); // G != 0 and MB != 3
}


// 40 Unused

TEST_CASE("ab 41 LOG", "[!hide]") {
}

TEST_CASE("ab 42 STC=0", "[!hide]") {
}

TEST_CASE("ab 43 G2<=LB") {
  State state;
  Entry_t entry;
  // Negative cases
  state.ROAR = 0x49c;
  state.G2 = 3;
  state.LB = 2;
  entry.AB = 43;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.G2 = 1;
  state.LB = 0;
  entry.AB = 43;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  // Positive cases
  state.ROAR = 0x49c;
  state.G2 = 3;
  state.LB = 3;
  entry.AB = 43;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.G2 = 0;
  state.LB = 1;
  entry.AB = 43;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.G2 = 1;
  state.LB = 3;
  entry.AB = 43;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.G2 = 0;
  state.LB = 0;
  entry.AB = 43;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

// 44 unused

TEST_CASE("ab 45 D(7)") {
  State state;
  Entry_t entry;
  // Negative case
  state.ROAR = 0x49c;
  state.MS[0x100] = 0xfeffffff;
  state.SAR = 0x100;
  entry.AB = 45;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  // Positive case
  state.ROAR = 0x49c;
  state.MS[0x100] = 0xffffffff;
  state.SAR = 0x100;
  entry.AB = 45;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE("ab 46 SCPS") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.SCPS = 0;
  entry.AB = 46;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.SCPS = 1;
  entry.AB = 46;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE("ab 47 SCFS") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.SCFS = 0;
  entry.AB = 47;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.SCFS = 1;
  entry.AB = 47;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

// 48 unused?

// Note: sets A and B
TEST_CASE("ab 49 W(67)→AB") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.W = 0;
  entry.AB = 49;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.W = 9;
  entry.AB = 49;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1)); // B set

  state.ROAR = 0x49c;
  state.W = 6;
  entry.AB = 49;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2)); // A set

  state.ROAR = 0x49c;
  state.W = 7;
  entry.AB = 49;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 3)); // A,B set
}

// 50-53 unused?

TEST_CASE("ab 54 CANG") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.SAR = 0x100;
  state.T = 0xfffffff8;
  entry.AB = 54;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.SAR = 0x101;
  state.T = 0xfffffff8;
  entry.AB = 54;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.SAR = 0x100;
  state.T = 0xfffffffc;
  entry.AB = 54;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE("ab 55 CHLOG", "[!hide]") {
}

// Sets A and B
TEST_CASE("ab 56 I-FETCH") {
  State state;
  Entry_t entry;
  // off-bounds fetch (i.e. halfword, not word aligned)
  state.ROAR = 0x49c;
  state.IAR = 0x102;
  state.REFETCH = 0;
  entry.AB = 56;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  // off-bounds refetch
  state.ROAR = 0x49c;
  state.IAR = 0x102;
  state.REFETCH = 1;
  entry.AB = 56;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  // on-bounds
  state.ROAR = 0x49c;
  state.IAR = 0x104;
  state.REFETCH = 1;
  entry.AB = 56;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  // Invalid address
  state.ROAR = 0x49c;
  state.IAR = 0x105;
  state.REFETCH = 1;
  entry.AB = 56;
  entry.BB = 0;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 3));
}

TEST_CASE( "ab 57 IA(30)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.IAR = 0x12340000;
  entry.AB = 57;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.IAR = 0x12340002;
  entry.AB = 57;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

TEST_CASE("ab 58 EXT,CHIRPT", "[!hide]") {
}

// 59 not used?

TEST_CASE("ab 60 PSS", "[!hide]") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.PSS = 0;
  entry.AB = 60;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.PSS = 1;
  entry.AB = 60;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));
}

// 61 not used?

// 62 not used

TEST_CASE( "ab 63 RX.S0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.M = 0x30000000;
  entry.AB = 63;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0)); // Not M:01, not S0
  state.ROAR = 0x49c;
  state.M = 0x70000000;
  entry.AB = 63;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0)); // M:01, not S0
  state.ROAR = 0x49c;
  state.M = 0x70000000;
  setS(state, {1, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 63;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2)); // M:01, S0
  state.ROAR = 0x49c;
  state.M = 0x90000000;
  setS(state, {1, 0, 0, 0, 0, 0, 0, 0});
  entry.AB = 63;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0)); // not M:01, S0
}
TEST_CASE("bb 0 0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 0;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
}

TEST_CASE("bb 1 1") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 1;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 2 (S0)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 2;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {1, 0, 0, 0, 0, 0, 0, 0});
  entry.BB = 2;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 3 (S1)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 3;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 1, 0, 0, 0, 0, 0, 0});
  entry.BB = 3;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 4 (S2)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 4;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 1, 0, 0, 0, 0, 0});
  entry.BB = 4;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 5 (S3)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 5;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  entry.BB = 5;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 6 (S4)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 6;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 1, 0, 0, 0});
  entry.BB = 6;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 7 (S5)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 7;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 1, 0, 0});
  entry.BB = 7;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 8 (S6)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 8;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 1, 0});
  entry.BB = 8;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 9 (S7)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  entry.BB = 9;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 1});
  entry.BB = 9;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 10 RSGNS") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.RSGNS = 0;
  entry.BB = 10;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.RSGNS = 1;
  entry.BB = 10;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

// 11: HSCH

TEST_CASE("bb 12 EXC", "[!hide]") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  // state.EXC = 0;
  entry.BB = 12;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  // state.EXC = 1;
  entry.BB = 12;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 13 WR=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.WR = 1;
  entry.BB = 13;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.WR = 0;
  entry.BB = 13;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

// 14 unused

// Inexplicably, T13=0 seems to mean T bits 8 to 31 are 0 (i.e. fraction in a float)
TEST_CASE( "bb 15 (T13=0)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.T = 0x00800000;
  entry.BB = 15;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.T = 0x00000001;
  entry.BB = 15;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.T = 0xff000000;
  entry.BB = 15;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 16 T(0)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.T = 0x80000000;
  entry.BB = 16;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
  state.ROAR = 0x49c;
  state.T = 0x7fffffff;
  entry.BB = 16;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
}

TEST_CASE( "bb 17 T=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.T = 0;
  entry.BB = 17;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
  state.ROAR = 0x49c;
  state.T = 1;
  entry.BB = 17;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
}

TEST_CASE("bb 18 TZ*BS") {
  State state;
  Entry_t entry;
  // Negative cases
  state.ROAR = 0x49c;
  state.T = 0x05000000;
  setBS(state, 1, 0, 0, 0);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.T = 0x00800000;
  setBS(state, 0, 1, 0, 0);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.T = 0x00001000;
  setBS(state, 0, 0, 1, 0);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.T = 0x00000004;
  setBS(state, 0, 0, 0, 1);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  // Positive cases
  state.ROAR = 0x49c;
  state.T = 0x00ffffff;
  setBS(state, 1, 0, 0, 0);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.T = 0xff00ffff;
  setBS(state, 0, 1, 0, 0);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.T = 0xffff00ff;
  setBS(state, 0, 0, 1, 0);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.T = 0xffffff00;
  setBS(state, 0, 0, 0, 1);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.T = 0xffffffff;
  setBS(state, 0, 0, 0, 0);
  entry.BB = 18;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 19 W=1") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.W = 0;
  entry.BB = 19;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.W = 7;
  entry.BB = 19;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.W = 1;
  state.W = 1;
  entry.BB = 19;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 20 LB=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.LB = 1;
  entry.BB = 20;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.LB = 0;
  entry.BB = 20;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 21 LB=3") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.LB = 1;
  entry.BB = 21;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.LB = 0;
  entry.BB = 21;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.LB = 3;
  entry.BB = 21;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 22 MD=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.MD = 1;
  entry.BB = 22;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.MD = 0;
  entry.BB = 22;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 23 G2=0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.ROAR = 0x49c;
  state.G2 = 1;
  entry.BB = 23;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.G2 = 0;
  entry.BB = 23;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 24 G2<0") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.G2NEG = 0;
  entry.BB = 24;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.G2NEG = 1;
  entry.BB = 24;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 25 G2LBZ") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.G2 = 1;
  state.LB = 1;
  entry.BB = 25;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.G2 = 0;
  state.LB = 1;
  entry.BB = 25;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
  state.ROAR = 0x49c;
  state.G2 = 1;
  state.LB = 0;
  entry.BB = 25;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

// 26 I/O

TEST_CASE( "bb 27 (MD/JI)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.MD = 2;
  state.J = 4;
  entry.BB = 27;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.MD = 2;
  state.J = 5;
  entry.BB = 27;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.MD = 2;
  state.J = 8;
  entry.BB = 27;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.MD = 1;
  state.J = 4;
  entry.BB = 27;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.MD = 12;
  state.J = 4;
  entry.BB = 27;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE("bb 28 IVA", "[!hide]") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.SAR = 0x102;
  entry.BB = 28;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.SAR = 0x101;
  entry.BB = 28;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

// 29 I/O

TEST_CASE( "bb 30 (CAR)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.CAR = 0;
  entry.BB = 30;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.CAR = 1;
  entry.BB = 30;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "bb 31 (Z00)") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.T0 = 0x7fffffff;
  entry.BB = 31;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));
  state.ROAR = 0x49c;
  state.T0 = 0x80000000;
  entry.BB = 31;
  roarBB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));
}

TEST_CASE( "roar ZN 1 SMIF") {
  State state;
  Entry_t entry;
  entry.ZP = 0x12;
  entry.ZF = 0x7;
  entry.ZN = 1;
  roar(state, entry);
  REQUIRE( state.ROAR == 0x49c);
}

TEST_CASE( "roar AB 56 I-FETCH") {
  State state;
  Entry_t entry;
  state.ROAR = 0x49c;
  state.IAR = 0x12340000;
  state.REFETCH = 0;
  entry.AB = 56;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.IAR = 0x12340000;
  state.REFETCH = 1;
  entry.AB = 56;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 2));

  state.ROAR = 0x49c;
  state.IAR = 0x12340002;
  state.REFETCH = 0;
  entry.AB = 56;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 0));

  state.ROAR = 0x49c;
  state.IAR = 0x12340002;
  state.REFETCH = 1;
  entry.AB = 56;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 1));

  state.ROAR = 0x49c;
  state.IAR = 0x12340001;
  state.REFETCH = 0;
  entry.AB = 56;
  roarAB(state, entry);
  REQUIRE( state.ROAR == (0x49c | 3));
}

// ----------- SS tests

// SS 1, 2: unused

TEST_CASE( "stat SS 3 D→CR*BS") {
  State state;
  Entry_t entry;
  state.SAR = 0x30;
  setBS(state, 1, 0, 0, 0);
  state.MS[0x30] = 0x81234567; // Leftmost bit of byte 0 set
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 1);

  state.MS[0x30] = 0x71234567; // Leftmost bit of byte 0 clear
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 0);

  state.SAR = 0x30;
  setBS(state, 0, 1, 0, 0);
  state.MS[0x30] = 0x81a34567; // Leftmost bit of byte 1 set
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 1);

  state.MS[0x30] = 0x81234567; // Leftmost bit of byte 1 clear
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 0);

  state.SAR = 0x30;
  setBS(state, 0, 0, 1, 0);
  state.MS[0x30] = 0x8123c567; // Leftmost bit of byte 2 set
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 1);

  state.MS[0x30] = 0x81234567; // Leftmost bit of byte 2 clear
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 0);

  state.SAR = 0x30;
  setBS(state, 0, 0, 0, 1);
  state.MS[0x30] = 0x812345f7; // Leftmost bit of byte 3 set
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 1);

  state.MS[0x30] = 0x81234567; // Leftmost bit of byte 3 clear
  entry.SS = 3;
  stat(state, entry);
  REQUIRE( state.CR == 0);

}

TEST_CASE( "stat SS 4 E→SCANCTL", "[!hide]") {
}

TEST_CASE( "stat SS 5 L,RSGNS") {
  State state;
  Entry_t entry;
  for (int i = 0; i < 16; i++) {
    state.U = 0x40 | i;
      state.LSGNS = 0;
      state.RSGNS = 0;
    if (i < 10) {
#if 0
      entry.SS = 5;
      assert.throws(function() { stat(state, entry);
#endif
    } else if (i == 0xb || i == 0xd) {
      entry.SS = 5;
      stat(state, entry);
      REQUIRE( state.LSGNS == 1); // LSGNS " + i == i); // Negative
      REQUIRE( state.RSGNS == 1); // RSGNS " + i == i); // Flipped
    } else {
      entry.SS = 5;
      stat(state, entry);
      REQUIRE( state.LSGNS == 0); // LSGNS " + i == i); // Positive
      REQUIRE( state.RSGNS == 0); // RSGNS " + i == i); // Unchanged
    }
  }
}

TEST_CASE( "stat SS 6 IVD/RSGNS") {
  State state;
  Entry_t entry;
  for (int i = 0; i < 16; i++) {
  state.RSGNS = 1;
  state.U = 0x40 | i;
    if (i < 10) {
#if 0
      entry.SS = 6;
      assert.throws(function() { stat(state, entry);
#endif
    } else if (i == 0xb || i == 0xd) {
  entry.SS = 6;
      stat(state, entry);
      REQUIRE( state.RSGNS == 0); // Cleared
    } else {
  entry.SS = 6;
      stat(state, entry);
      REQUIRE( state.RSGNS == 1); // Unchanged
    }
  }
}

TEST_CASE( "stat SS 7 EDITSGN", "[!hide]") {
}

void checkArray(bool *b, std::vector<bool> v){
    for (int i = 0; i < v.size(); i++) {
        REQUIRE(b[i] == v[i]);
    }
}
                    
void checkArray(uint8_t *b, std::vector<uint8_t> v){
  for (int i = 0; i < v.size(); i++) {
    REQUIRE(b[i] == v[i]);
  }
}
                    
TEST_CASE( "stat8 E→S03") {
  State state;
  Entry_t entry;
  setS(state, {1, 0, 0, 1, 0, 0, 0, 1});
  entry.CE = 3;
  entry.SS = 8;
  stat(state, entry);
  std::vector<bool> s(state.S, state.S + 8);
  checkArray(state.S, {0, 0, 1, 1, 0, 0, 0, 1});
}

TEST_CASE( "stat9 S03ΩE,1→LSGN") {
  State state;
  Entry_t entry;
  setS(state, {1, 0, 0, 1, 0, 0, 0, 1});
  entry.CE = 3;
  entry.SS = 9;
  stat(state, entry);
  checkArray(state.S, {1, 0, 1, 1, 0, 0, 0, 1});
  REQUIRE( state.LSGNS == 1);
}

TEST_CASE( "stat10 S03ΩE") {
  State state;
  Entry_t entry;
  setS(state, {1, 0, 0, 1, 0, 0, 0, 1});
  entry.CE = 3;
  entry.SS = 10;
  stat(state, entry);
  checkArray(state.S, {1, 0, 1, 1, 0, 0, 0, 1});
}

TEST_CASE( "stat11 S03ΩE,0→BS") {
  State state;
  Entry_t entry;
  setS(state, {1, 0, 0, 1, 0, 0, 0, 1});
  entry.CE = 3;
  entry.SS = 11;
  stat(state, entry);
  checkArray(state.S, {1, 0, 1, 1, 0, 0, 0, 1});
  checkArray(state.pending.BS, {0, 0, 0, 0});
}

// Unclear exactly which half of the word X0 and B0 come from
TEST_CASE( "stat12: X0,B0,SYL1") {
  State state;
  Entry_t entry;
  // X=0, B=0
  state.T = 0x02305678;
  entry.SS = 12;
  stat(state, entry);
  REQUIRE( state.S[0] == 1); // X=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 1); // B=0, i.e. T(0-3)

  // X=4, B=0
  state.T = 0x02340678;
  entry.SS = 12;
  stat(state, entry);
  REQUIRE( state.S[0] == 0); // X!=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 1); // B=0, i.e. T(0-3)

  // X=4, B=5
  state.T = 0x12345678;
  entry.SS = 12;
  stat(state, entry);
  REQUIRE( state.S[0] == 0); // X!=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 0); // B!=0, i.e. T(0-3)

  // X=0, B=5
  state.T = 0x12305678;
  entry.SS = 12;
  stat(state, entry);
  REQUIRE( state.S[0] == 1); // X=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 0); // B=0, i.e. T(0-3)

  // Now test SYL1
  for (int i = 0; i < 16; i++) {
  state.T = i << 28;
  entry.SS = 12;
    stat(state, entry);
    if (i <= 3) {
      REQUIRE( state.SYL1 == 1);
    } else {
      REQUIRE( state.SYL1 == 0);
    }
  }
}

void testFpzero(int ss) {
    State state;
    Entry_t entry;
  state.T = 0x12000000;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 0;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 1);

  state.T = 0x82000000;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 0;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 1);

  state.T = 0x00000000;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 0;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 1);

  state.T = 0x00000001;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 0;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 0);

  state.T = 0x00800000;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 0;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 0);

  state.T = 0xff000001;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 0;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 0);

  state.T = 0x00000001;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 1;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 0);

  state.T = 0x00000001;
  setS(state, {0, 0, 0, 1, 0, 0, 0, 0});
  state.F = 0;
  entry.SS = ss;
  stat(state, entry);
  REQUIRE( state.S[0] == 0);
};

// Tests if value is floating point zero (ignoring sign, exponent)
TEST_CASE( "stat SS 13: FPZERO") {
  testFpzero(13);
}

TEST_CASE( "stat SS 14: FPZERO,E→FN") {
  State state;
  Entry_t entry;
  testFpzero(14);

  state.T = 0x00000001;
  state.F = 0;
  entry.SS = 14;
  entry.CE = 7;
  stat(state, entry);
  REQUIRE( state.FN == 3);
}

TEST_CASE( "stat15: B0,SYL1") {
  State state;
  Entry_t entry;
  // X=0, B=0
  state.T = 0x02305678;
  entry.SS = 15;
  stat(state, entry);
  REQUIRE( state.S[0] == 0); // X=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 1); // B=0, i.e. T(0-3)

  // X=4, B=0
  state.T = 0x02340678;
  entry.SS = 15;
  stat(state, entry);
  REQUIRE( state.S[0] == 0); // X!=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 1); // B=0, i.e. T(0-3)

  // X=4, B=5
  state.T = 0x12345678;
  entry.SS = 15;
  stat(state, entry);
  REQUIRE( state.S[0] == 0); // X=4,B=5:S0"); // X!=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 0); // X=4,B=5:S1"); // B!=0, i.e. T(0-3)

  // X=0, B=5
  state.T = 0x12305678;
  entry.SS = 15;
  stat(state, entry);
  REQUIRE( state.S[0] == 0); // X=0, i.e. T(12-15)
  REQUIRE( state.S[1] == 0); // X=0,B=5:S1"); // B=0, i.e. T(0-3)

  // Now test SYL1
  for (int i = 0; i < 16; i++) {
  state.T = i << 28;
  entry.SS = 15;
    stat(state, entry);
    if (i <= 3) {
      REQUIRE( state.SYL1 == 1);
    } else {
      REQUIRE( state.SYL1 == 0);
    }
  }
}

TEST_CASE( "stat16: S03.¬E") {
  State state;
  Entry_t entry;
  setS(state, {0, 0, 1, 1, 0, 0, 0, 1});
  entry.CE = 6;
  entry.SS = 16;
  stat(state, entry);
  checkArray(state.S, {0, 0, 0, 1, 0, 0, 0, 1});

  setS(state, {1, 1, 1, 1, 1, 1, 1, 1});
  entry.CE = 15;
  entry.SS = 16;
  stat(state, entry);
  checkArray(state.S, {0, 0, 0, 0, 1, 1, 1, 1});
}

TEST_CASE( "stat SS 17: (T=0)→S3") {
  State state;
  Entry_t entry;
  state.T = 0;
  entry.SS = 17;
  stat(state, entry);
  REQUIRE( state.S[3] == 1);
}

TEST_CASE( "stat18: E→BS,T30→S3") {
  State state;
  Entry_t entry;
  setS(state, {0, 0, 1, 1, 0, 0, 0, 1});
  state.T = 0;
  entry.CE = 6;
  entry.SS = 18;
  stat(state, entry);
  checkArray(state.pending.BS, {0, 1, 1, 0});
  checkArray(state.S, {0, 0, 1, 0, 0, 0, 0, 1});

  state.T = 2;
  entry.CE = 15;
  entry.SS = 18;
  stat(state, entry);
  checkArray(state.pending.BS, {1, 1, 1, 1});
  checkArray(state.S, {0, 0, 1, 1, 0, 0, 0, 1});
}

TEST_CASE( "stat SS 19: E→BS") {
  State state;
  Entry_t entry;
  entry.CE = 15;
  entry.SS = 19;
  stat(state, entry);
  checkArray(state.pending.BS, {1, 1, 1, 1});

  entry.CE = 3;
  entry.SS = 19;
  stat(state, entry);
  checkArray(state.pending.BS, {0, 0, 1, 1});
}

TEST_CASE( "stat20: 1→BS*MB") {
  State state;
  Entry_t entry;
  state.MB = 2;
  entry.SS = 20;
  stat(state, entry);
  REQUIRE( state.pending.BS[2] == 1);
}

// SS 21: unused

// SS 22: unused

TEST_CASE( "stat SS 23: MANUAL→STOP", "[!hide]") {
}

TEST_CASE( "stat24: E→S47") {
  State state;
  Entry_t entry;
  setS(state, {0, 0, 1, 1, 0, 0, 0, 1});
  entry.CE = 6;
  entry.SS = 24;
  stat(state, entry);
  checkArray(state.S, {0, 0, 1, 1, 0, 1, 1, 0});
}

TEST_CASE( "stat25: S47ΩE") {
  State state;
  Entry_t entry;
  setS(state, {0, 0, 1, 1, 0, 0, 0, 1});
  entry.CE = 6;
  entry.SS = 25;
  stat(state, entry);
  checkArray(state.S, {0, 0, 1, 1, 0, 1, 1, 1});
}

TEST_CASE( "stat26: S47.¬E") {
  State state;
  Entry_t entry;
  setS(state, {0, 0, 1, 1, 0, 0, 0, 1});
  entry.CE = 6;
  entry.SS = 26;
  stat(state, entry);
  checkArray(state.S, {0, 0, 1, 1, 0, 0, 0, 1});
}

TEST_CASE( "stat SS 27: S47,ED*FP", "[!hide]") {
}

TEST_CASE( "stat SS 28: OPPANEL→S47", "[!hide]") {
}

TEST_CASE( "stat29: CAR,(T≠0)→CR") {
  State state;
  Entry_t entry;
  state.CAR = 0;
  state.T = 0;
  entry.CE = 6;
  entry.SS = 29;
  stat(state, entry);
  REQUIRE(state.CR == 0);
  state.CAR = 0;
  state.T = 0x10000;
  entry.CE = 6;
  entry.SS = 29;
  stat(state, entry);
  REQUIRE(state.CR == 1);
  state.CAR = 1;
  state.T = 0;
  entry.CE = 6;
  entry.SS = 29;
  stat(state, entry);
  REQUIRE(state.CR == 2);
  state.CAR = 1;
  state.T = 0xffffffff;
  entry.CE = 6;
  entry.SS = 29;
  stat(state, entry);
  REQUIRE(state.CR == 3);
}

TEST_CASE( "stat30: KEY→F") {
  State state;
  Entry_t entry;
  state.SAR = 0x00005670;
  state.KEYS[state.SAR >> 11] = 4;
  entry.SS = 30;
  stat(state, entry);
  REQUIRE( state.F == 4);
}
                    
TEST_CASE( "stat31: F→KEY") {
  State state;
  Entry_t entry;
  state.F = 4;
  state.SAR = 0x00005670;
  entry.SS = 31;
  stat(state, entry);
  REQUIRE( state.KEYS[0x5670 >> 11] == 4);
}

TEST_CASE( "stat32: 1→LSGNS") {
  State state;
  Entry_t entry;
  entry.SS = 32;
  stat(state, entry);
  REQUIRE(state.LSGNS == 1);
}

TEST_CASE( "stat33: 0→LSGNS") {
  State state;
  Entry_t entry;
  entry.SS = 33;
  stat(state, entry);
  REQUIRE(state.LSGNS == 0);
}

TEST_CASE( "stat34: 1→RSGNS") {
  State state;
  Entry_t entry;
  entry.SS = 34;
  stat(state, entry);
  REQUIRE(state.RSGNS == 1);
}

TEST_CASE( "stat35: 0→RSGNS") {
  State state;
  Entry_t entry;
  entry.SS = 35;
  stat(state, entry);
  REQUIRE(state.RSGNS == 0);
}

TEST_CASE( "stat36: L(0)→LSGNS") {
  State state;
  Entry_t entry;
  state.L = 0x76543210;
  entry.SS = 36;
  stat(state, entry);
  REQUIRE(state.LSGNS == 0);
  state.L = 0x86543210;
  entry.SS = 36;
  stat(state, entry);
  REQUIRE(state.LSGNS == 1);
}

TEST_CASE( "stat37: R(0)→RSGNS") {
  State state;
  Entry_t entry;
  state.R = 0x76543210;
  entry.SS = 37;
  stat(state, entry);
  REQUIRE(state.RSGNS == 0);
  state.R = 0x86543210;
  entry.SS = 37;
  stat(state, entry);
  REQUIRE(state.RSGNS ==  1);
}

TEST_CASE( "stat38: E(13)→WFN") {
  State state;
  Entry_t entry;
  entry.SS = 38;
  entry.CE = 0xe;
  stat(state, entry);
  REQUIRE( state.WFN == 6);
}

TEST_CASE( "stat SS 39: E(23)→FN") {
  State state;
  Entry_t entry;
  entry.SS = 39;
  entry.CE = 0xe;
  stat(state, entry);
  REQUIRE( state.FN == 2);
}

TEST_CASE( "stat SS 40: E(23)→CR") {
  State state;
  Entry_t entry;
  entry.SS = 40;
  entry.CE = 0xe;
  stat(state, entry);
  REQUIRE( state.CR == 2);
}

TEST_CASE( "stat41: SETCRALG") {
  State state;
  Entry_t entry;
  state.T = 0;
  entry.SS = 41;
  entry.CE = 0xe;
  stat(state, entry);
  REQUIRE( state.CR == 0); // Zero

  state.T = 0x80000001;
  entry.SS = 41;
  entry.CE = 0xe;
  stat(state, entry);
  REQUIRE( state.CR == 1); // Negative

  state.T = 0x7fffffff;
  entry.SS = 41;
  entry.CE = 0xe;
  stat(state, entry);
  REQUIRE( state.CR == 2); // Positive
}

TEST_CASE( "stat SS 42: SETCRLOG") {
  State state;
  Entry_t entry;
  state.T = 0x00110022;
  setBS(state, 1, 0, 1, 0);
  state.C0 = 1;
  entry.SS = 42;
  stat(state, entry);
  REQUIRE( state.CR == 0); // Zero

  state.T = 0x00110022;
  setBS(state, 1, 0, 1, 1);
  state.C0 = 0;
  entry.SS = 42;
  stat(state, entry);
  REQUIRE( state.CR == 1); // First lower

  state.T = 0x00110022;
  setBS(state, 0, 0, 0, 1);
  state.C0 = 1;
  entry.SS = 42;
  stat(state, entry);
  REQUIRE( state.CR == 2); // First higher
}

TEST_CASE( "stat SS 43: ¬S4,S4→CR") {
  State state;
  Entry_t entry;
  entry.SS = 43;
  stat(state, entry);
  REQUIRE( state.CR == 2);

  setS(state, {0, 0, 0, 0, 1, 0, 0, 0});
  entry.SS = 43;
  stat(state, entry);
  REQUIRE( state.CR == 1);
}

TEST_CASE( "stat SS 44: S4,¬S4→CR") {
  State state;
  Entry_t entry;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.SS = 44;
  stat(state, entry);
  REQUIRE( state.CR == 1);

  setS(state, {0, 0, 0, 0, 1, 0, 0, 0});
  entry.SS = 44;
  stat(state, entry);
  REQUIRE( state.CR == 2);
}

TEST_CASE( "stat SS 45: 1→REFETCH") {
  State state;
  Entry_t entry;
  entry.SS = 45;
  stat(state, entry);
  REQUIRE( state.REFETCH == 1);
}

TEST_CASE( "stat SS 46: SYNC→OPPANEL", "[!hide]") {
}

TEST_CASE( "stat SS 47: SCAN*E,10", "[!hide]") {
}

// SS 48, 49: I/O

TEST_CASE( "stat SS 50: E(0)→IBFULL", "[!hide]") {
}

// SS 51: unused

TEST_CASE( "stat SS 52: E→CH", "[!hide]") {
}

// SS 53: unused

TEST_CASE( "stat SS 54: 1→TIMERIRPT", "[!hide]") {
}

// T to AMWP bits
TEST_CASE( "stat55  T→PSW,IPL→T") {
  State state;
  Entry_t entry;
  state.T = 0x12345678;
  entry.SS = 55;
  stat(state, entry);
  REQUIRE( state.AMWP == 4);
  REQUIRE( state.T == 0x0c000000); // Hardwored card reader IPl
}

// T to AMWP bits
TEST_CASE( "stat56 T→PSW") {
  State state;
  Entry_t entry;
  state.T = 0x123f5678;
  entry.SS = 56;
  stat(state, entry);
  REQUIRE( state.AMWP == 0xf);
}

TEST_CASE( "stat57", "[!hide]") {
  State state;
  Entry_t entry;
  // 57: SCAN*E00
  entry.SS = 57;
  entry.CE = 0x3;
  stat(state, entry);
  // REQUIRE( state.SCANCTRL == 0x0c);
}

TEST_CASE( "stat SS 58: 1→IOMODE", "[!hide]") {
}

// SS 59-63: I/O

// ----- AL tests

// test shifter
                    
void checkPair(std::pair<uint32_t, uint8_t> p, std::vector<uint32_t> v) {
    REQUIRE(p.first == v[0]);
    REQUIRE(p.second == v[1]);
}

TEST_CASE("sr1") {
  // Start with right field empty
  checkPair(sr1(0, 0x12345678, 0), {0x091a2b3c, 0});
  checkPair(sr1(0, 0x12345679, 0), {0x091a2b3c, 8});
  checkPair(sr1(1, 0x12345678, 0), {0x891a2b3c, 0});
  checkPair(sr1(1, 0x12345679, 0), {0x891a2b3c, 8});
  // Now with content in right field
  checkPair(sr1(0, 0x82345678, 3), {0x411a2b3c, 1});
  checkPair(sr1(0, 0x82345679, 5), {0x411a2b3c, 0xa});
  checkPair(sr1(1, 0x82345678, 8), {0xc11a2b3c, 4});
  checkPair(sr1(1, 0x82345679, 0xf), {0xc11a2b3c, 0xf});
}

TEST_CASE("sl1") {
  // Start with dest (left) field empty
  checkPair(sl1(0, 0x12345678, 0), {0x2468acf0, 0});
  checkPair(sl1(0, 0x92345678, 0), {0x2468acf0, 1});
  checkPair(sl1(8, 0x12345678, 0), {0x2468acf1, 0});
  checkPair(sl1(8, 0x92345678, 0), {0x2468acf1, 1});
  // Now with contents in dest field
  checkPair(sl1(0, 0x12345678, 0xf), {0x2468acf0, 0xe});
  checkPair(sl1(0, 0x92345678, 0x8), {0x2468acf0, 1});
  checkPair(sl1(8, 0x12345678, 0x5), {0x2468acf1, 0xa});
  checkPair(sl1(8, 0x92345678, 0x2), {0x2468acf1, 5});
}

TEST_CASE("sr4") {
  checkPair(sr4(0, 0x12345678), {0x01234567, 8});
  checkPair(sr4(0xf, 0x12345673), {0xf1234567, 3});
}

TEST_CASE("sl4") {
  checkPair(sl4(0x1, 0x12345678), {0x23456781, 1});
  checkPair(sl4(0xf, 0x12345678), {0x2345678f, 1});
  checkPair(sl4(0, 0xff345678), {0xf3456780, 0xf});
}

TEST_CASE( "al1 Q→SR1→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345679;
  state.Q = 1;
  state.F = 5;
  entry.AL = 1;
  entry.DG = 0;
  adderAL(state, entry);
  REQUIRE( state.T == (0x80000000 | (0x12345678 >> 1)) );
  REQUIRE( state.F == 0xa);
}

TEST_CASE( "al 2 L0,¬S4→") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.L = 0x78901234;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AL = 2;
  adderAL(state, entry);
  REQUIRE( state.T == 0xf8345678);

  state.T0 = 0x12345678;
  state.L = 0x78901234;
  setS(state, {0, 0, 0, 0, 1, 0, 0, 0});
  entry.AL = 2;
  adderAL(state, entry);
  REQUIRE( state.T == 0x78345678);
}

TEST_CASE( "al3 +SGN→") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  entry.AL = 3;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12345678);
}

TEST_CASE( "al4 -SGN→") {
  State state;
  Entry_t entry;
  state.T0 = 0x92345678;
  entry.AL = 4;
  adderAL(state, entry);
  REQUIRE( state.T == 0x92345678);
}

TEST_CASE( "al5 L0,S4→") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.L = 0x78901234;
  setS(state, {0, 0, 0, 0, 0, 0, 0, 0});
  entry.AL = 5;
  adderAL(state, entry);
  REQUIRE( state.T == 0x78345678);

  state.T0 = 0x12345678;
  state.L = 0x78901234;
  setS(state, {0, 0, 0, 0, 1, 0, 0, 0});
  entry.AL = 5;
  adderAL(state, entry);
  REQUIRE( state.T == 0xf8345678);
}

TEST_CASE( "al6 IA→H") {
  State state;
  Entry_t entry;
  state.IAR = 0x12345678;
  entry.AL = 6;
  adderAL(state, entry);
  REQUIRE( state.H == 0x12345678);
}

TEST_CASE( "al7 Q→SL→-F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.Q = 0;
  state.F = 0xf;
  entry.AL = 7;
  adderAL(state, entry);
  REQUIRE( state.T == 0x2468acf0);
  REQUIRE( state.F == 0xf); // 0 inverted, shifted in

  state.T0 = 0x92345678;
  state.Q = 0;
  state.F = 0xf;
  entry.AL = 7;
  adderAL(state, entry);
  REQUIRE( state.T == 0x2468acf0);
  REQUIRE( state.F == 0xe);

  state.T0 = 0x12345678;
  state.Q = 1;
  state.F = 0xf;
  entry.AL = 7;
  adderAL(state, entry);
  REQUIRE( state.T == 0x2468acf1);
  REQUIRE( state.F == 0xf);
}

TEST_CASE( "al8 Q→SL1→F") {
  State state;
  Entry_t entry;
  state.Q = 0;
  state.T0 = 0x72345678;
  state.F = 0xc;
  entry.AL = 8;
  adderAL(state, entry);
  REQUIRE( state.T == (0x72345678 << 1) );
  REQUIRE( state.F == 0x8); // 1100 -> 1000

  state.Q = 1;
  state.T0 = 0x72345678;
  state.F = 0xc;
  entry.AL = 8;
  adderAL(state, entry);
  REQUIRE( state.T == ((0x72345678 << 1) | 1) );
  REQUIRE( state.F == 0x8);

  state.Q = 0;
  state.T0 = 0x92345678;
  state.F = 0xc;
  entry.AL = 8;
  adderAL(state, entry);
  REQUIRE( state.T == (0x92345678 << 1) );
  REQUIRE( state.F == 0x9);

  state.Q = 1;
  state.T0 = 0x92345678;
  state.F = 0xc;
  entry.AL = 8;
  adderAL(state, entry);
  REQUIRE( state.T == ((0x92345678 << 1) | 1) );
  REQUIRE( state.F == 0x9);
}

// Overflow bits from T spill into F, which is shifted into T.
TEST_CASE( "al9 F→SL1→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x92345678;
  state.F = 0xc;
  entry.AL = 9;
  adderAL(state, entry);
  REQUIRE( state.T == (((0x92345678 << 1) | 1) & 0xffffffff));
  REQUIRE( state.F == 0x9);
  state.T0 = state.T;
  entry.AL = 9;
  adderAL(state, entry);
  REQUIRE( state.T == (((0x92345678 << 2) | 3) & 0xffffffff));
  REQUIRE( state.F == 0x2);
  state.T0 = state.T;
  entry.AL = 9;
  adderAL(state, entry);
  REQUIRE( state.T == (((0x92345678 << 3) | 6) & 0xffffffff));
  REQUIRE( state.F == 0x4);
  state.T0 = state.T;
  entry.AL = 9;
  adderAL(state, entry);
  REQUIRE( state.T == (((0x92345678 << 4) | 0xc) & 0xffffffff));
  REQUIRE( state.F == 0x9);
}

TEST_CASE( "al10 SL1→Q") {
  State state;
  Entry_t entry;
  state.T0 = 0x92345678;
  entry.AL = 10;
  adderAL(state, entry);
  REQUIRE( state.T == ((0x92345678 << 1) & 0xffffffff));
  REQUIRE( state.Q == 0x1);
}


TEST_CASE( "al11 Q→SL1") {
  State state;
  Entry_t entry;
  state.T0 = 0x92345678;
  state.Q = 0;
  entry.AL = 11;
  adderAL(state, entry);
  REQUIRE( state.T == 0x2468acf0);

  state.T0 = 0x92345678;
  state.Q = 1;
  entry.AL = 11;
  adderAL(state, entry);
  REQUIRE( state.T == 0x2468acf1);
}

TEST_CASE( "al12 SR1→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345679;
  state.F = 3;
  entry.AL = 12;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12345679 >> 1);
  REQUIRE( state.F == 9);
}

TEST_CASE( "al13 SR1→Q") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345679;
  entry.AL = 13;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12345679 >> 1);
  REQUIRE( state.Q == 0x1);
}

TEST_CASE( "al14 Q→SR1→Q") {
  State state;
  Entry_t entry;
  state.T0 = 0x92345679;
  state.Q = 0;
  entry.AL = 14;
  adderAL(state, entry);
  REQUIRE( state.T == 0x491a2b3c);
  REQUIRE( state.Q == 0x1);

  state.T0 = 0x92345678;
  state.Q = 1;
  entry.AL = 14;
  adderAL(state, entry);
  REQUIRE( state.T == 0xc91a2b3c);
  REQUIRE( state.Q == 0x0);
}

TEST_CASE( "al15 F→SL1→Q") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x9;
  state.Q = 0;
  entry.AL = 15;
  adderAL(state, entry);
  REQUIRE( state.F == 9); // Assuming unchanged
  REQUIRE( state.T == 0x2468acf1);
  REQUIRE( state.Q == 0x0);

  state.T0 = 0x92345678;
  state.F = 0x7;
  state.Q = 0;
  entry.AL = 15;
  adderAL(state, entry);
  REQUIRE( state.F == 0x7); // Assuming unchanged
  REQUIRE( state.T == 0x2468acf0);
  REQUIRE( state.Q == 0x1);
}

TEST_CASE( "al16 SL4→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 16;
  adderAL(state, entry);
  REQUIRE( state.T == 0x23456780);
  REQUIRE( state.F == 0x1);
}

TEST_CASE( "al17 F→SL4→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 17;
  adderAL(state, entry);
  REQUIRE( state.T == 0x23456783);
  REQUIRE( state.F == 0x1);
}

TEST_CASE( "al18 FPSL4") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0xf;
  entry.AL = 18;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12456780); // Preserve sign, exponent top byte
  REQUIRE( state.F == 0xf);
  REQUIRE( state.LB == 1);
}

TEST_CASE( "al18 FPSL4 0") {
  State state;
  Entry_t entry;
  state.T0 = 0x12045678;
  state.F = 0xf;
  entry.AL = 18;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12456780); // Preserve sign, exponent top byte
  REQUIRE( state.F == 0xf);
  REQUIRE( state.LB == 0);
}

TEST_CASE( "al19 F→FPSL4") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 19;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12456783);
  REQUIRE( state.F == 0x3);
  REQUIRE( state.LB == 1);
}

TEST_CASE( "al19 F→FPSL4 0") {
  State state;
  Entry_t entry;
  state.T0 = 0x12045678;
  state.F = 0x3;
  entry.AL = 19;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12456783);
  REQUIRE( state.F == 0x3);
  REQUIRE( state.LB == 0);
}

TEST_CASE( "al20 SR4→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 20;
  adderAL(state, entry);
  REQUIRE( state.T == 0x01234567);
  REQUIRE( state.F == 0x8);
}

TEST_CASE( "al21") {
  State state;
  Entry_t entry;
  // F->SR4->F: guess as to function
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 21;
  adderAL(state, entry);
  REQUIRE( state.T == 0x31234567);
  REQUIRE( state.F == 0x8);
}

TEST_CASE( "al22 FPSR4→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 22;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12034567);
  REQUIRE( state.F == 0x8);
}

TEST_CASE( "al23 1→FPSR4→F") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 23;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12134567);
  REQUIRE( state.F == 0x8);
}

TEST_CASE( "al24 SR4→H", "[!hide]") {
}

TEST_CASE( "al25 F→SR4") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 25;
  adderAL(state, entry);
  REQUIRE( state.T == 0x31234567);
  REQUIRE( state.F == 0x3);
}

TEST_CASE( "al26 E→FPSL4") {
  State state;
  Entry_t entry;
  state.T0 = 0x12345678;
  state.F = 0x3;
  entry.AL = 26;
  entry.CE = 0x4;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12456784);
  REQUIRE( state.F == 0x3);
  REQUIRE( state.LB == 1);
}

TEST_CASE( "al26 E→FPSL4 0") {
  State state;
  Entry_t entry;
  state.T0 = 0x12045678;
  state.F = 0x3;
  entry.AL = 26;
  entry.CE = 0x4;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12456784);
  REQUIRE( state.F == 0x3);
  REQUIRE( state.LB == 0);
}

TEST_CASE( "al27 F→SR1→Q") {
  State state;
  Entry_t entry;
  state.T0 = 0x92345678;
  state.F = 0;
  entry.AL = 27;
  adderAL(state, entry);
  REQUIRE( state.T == 0x491a2b3c);
  REQUIRE( state.Q == 0);

  state.T0 = 0x92345679;
  state.F = 0xe;
  entry.AL = 27;
  adderAL(state, entry);
  REQUIRE( state.T == 0x491a2b3c);
  REQUIRE( state.Q == 1);

  state.T0 = 0x92345678;
  state.F = 3;
  entry.AL = 27;
  adderAL(state, entry);
  REQUIRE( state.T == 0xc91a2b3c);
  REQUIRE( state.Q == 0);
}

TEST_CASE( "al28 DKEY→", "[!hide]") {
}

// al 29 is I/O

TEST_CASE( "al30 D→") {
  State state;
  Entry_t entry;
  state.SAR = 0x30;
  state.MS[0x30] = 0x12345678;
  entry.AL = 30;
  entry.CE = 0x4;
  adderAL(state, entry);
  REQUIRE( state.T == 0x12345678);
}

TEST_CASE( "al31 AKEY→", "[!hide]") {
}
