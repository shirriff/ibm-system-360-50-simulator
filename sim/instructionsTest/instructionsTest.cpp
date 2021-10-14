#include <stdlib.h>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <string>
#include <iostream>
#include <sstream>
#include <utility>
#include <iomanip>
#include <ctgmath>
#include <vector>
#include <algorithm>
#include "catch.hpp"
#include "entry.hpp"
#include "engine.hpp"
#include "disasm.hpp"
#include "utils.hpp"

uint8_t chctl_w;

// *** Number of cycles for randomized tests
int testcycles = 1;

// Read register
uint32_t reg(State& state, uint8_t num) {
    return state.LS[0x30 + num];
}

// Write register
void reg(State& state, uint8_t num, uint32_t data) {
    state.LS[0x30 + num] = data;
}

// Read  half FP register
uint32_t fpreg(State& state, uint8_t num) {
    return state.LS[0x20 + num];
}

// Write half FP register
void fpreg(State& state, uint8_t num, uint32_t data) {
    state.LS[0x20 + num] = data;
}

// Convert a floating point value to a 64-bit FP register.
void floatToFpreg(State& state, uint8_t num, double val) {
  if (val == 0) {
    fpreg(state, num, 0);
    fpreg(state, num + 1, 0);
    return;
  }
  uint32_t s = 0;
  if (val < 0) {
    s = 0x80000000;
    val = -val;
  }
  uint8_t charac = 64;
  while (val >= 1 && charac < 128) {
    charac += 1;
    val /= 16;
  }
  while (val < 1/16. && charac >= 0) {
    charac -= 1;
    val *= 16;
  }
  if (charac < 0 || charac >= 128) {
      std::cerr << "Float over/underflow";
      throw "Float over/underflow";
  }
  val *= 1 << 24;
  uint32_t f0 = uint32_t(val);
  uint32_t w0 = (s | (charac << 24) | f0);
  uint32_t w1 = uint32_t((val - f0) * (uint64_t(1) << 32));
  fpreg(state, num, w0);
  fpreg(state, num + 1, w1);
}

// Convert a float from a 32-bit FP register
double fpreg32ToFloat(State &state, uint8_t num) {
  uint32_t w0 = fpreg(state, num);
  if ((w0 & 0x00ffffff) == 0) {
    return 0;
  }
  uint8_t charac = (((w0 & 0x7f000000) >> 24) - 64) * 4; // power of 2
  uint32_t frac = w0 & 0x00ffffff;
  double val = frac * pow(2., charac - 24);
  if (w0 & 0x80000000) {
    val = -val;
  }
  return val;
}

// Convert a float from a 64-bit FP register
double fpreg64ToFloat(State& state, uint8_t num) {
  uint32_t w0 = fpreg(state, num);
  uint32_t w1 = fpreg(state, num + 1);
  if ((w0 & 0x00ffffff) == 0 && w1 == 0) {
    return 0;
  }
  uint8_t charac = (((w0 & 0x7f000000) >> 24) - 64) * 4; // power of 2
  uint32_t frac = (w0 & 0x00ffffff) + w1 / pow(2., 32.);
  double val = frac * pow(2., (charac - 24.));
  if (w0 & 0x80000000) {
    val = -val;
  }
  return val;
}

// Returns 32-bit as a signed value
int32_t signed32(uint32_t n) {
    return n;
}

// Convert words to halfwords
std::vector<uint16_t> hw(std::vector<uint32_t> words) {
  std::vector<uint16_t> result;
  for (auto i = words.begin(); i != words.end(); ++i) {
    result.push_back(*i >> 16);
    result.push_back(*i & 0xffff);
  }
  return result;
}

// Return a random floating point number scaled roughly to 2**-powRange to 2**powRange
double randfloat(unsigned int &seed, int powRange = 200) {
  double f = rand_r(&seed) + rand_r(&seed) / pow(2, 32);
  int pw = ((rand_r(&seed) * powRange * 2) - powRange);
  f = f * pow(2, pw) * 4;
  if (rand_r(&seed) < .5) {
    f = -f;
  }
  return f;
}

void executeInstr(State& state);

std::string remove_space(std::string &str) {
  str.erase (std::remove (str.begin(), str.end(), ' '), str.end());
    return str;
}

std::string fmtAddress(uint32_t a) {
    std::stringstream stream;
    stream << std::setw(4) << std::setfill('0') << a;
    return stream.str();
}

int running;
// Load instruction(s) into memory at 0x400 and execute.
void execute(State& state, std::vector<uint32_t> instr, std::string desired) {
    std::string command = disasm(hw(instr));
    std::cout << command << "\n";
  REQUIRE(remove_space(command) == remove_space(desired));
    state.TRAP = 0;
  // Load instruction into memory
    for (int i = 0; i < instr.size(); i++) {
    state.MS[0x400 + i * 4] = instr[i];
  }
  state.IAR = 0x400;
  state.ROAR = 0x0197;
  running = 1;
  executeInstr(state);
}

int maxcount = 100;

// Execute one instruction
void executeInstr(State& state) {
  for (int count = 0; count < maxcount; count++) {
    // Log micro-instruction

    // Execute micro-instruction
      uint16_t saddr = state.ROAR;
    cycle(state, microcode_data[saddr]);
    if (!running) { // emulator problem bailout
        std::cerr << "Bailing out" << "/n";
      return;
    }
      if (0) {
      std::cout << state.debug() << "\n";
      }
  
    // Check if done
    if (count > 5 && (state.ROAR == 0x149 || state.ROAR == 0x14a || state.ROAR == 0x14c || state.ROAR == 0x14e || state.ROAR == 0x184 || state.ROAR == 0x185 || state.ROAR == 0x187 || state.ROAR == 0x188 || state.ROAR == 0x189 || state.ROAR == 0x19b)) {
      return;
    }
    if (count > 8 && state.ROAR == 0x148) {
      return;
    }
    if (state.TRAP) {
      std::cout << "********** TRAP **********" << "\n";
      return;
    }
    if (state.ROAR == 0x218 || state.ROAR == 0x195 || state.ROAR == 0x19c || state.ROAR == 0x1b0 || state.ROAR == 0x1b4 || state.ROAR == 0x1b8 || state.ROAR == 0x1b1 || state.ROAR == 0x1b3 || state.ROAR == 0x1b5 || state.ROAR == 0x1b7 || state.ROAR == 0x10e || state.ROAR == 0x10f) {
        std::cout << "********** Exception " << std::hex << state.ROAR << "\n";
      std::cout << "IAR: " << state.IAR << "\n";
        state.TRAP = 1;
      return;
    }
  }
  throw("Count exceeded");
}


  TEST_CASE( "fp conversion") {
    State state;
    floatToFpreg(state, 0, 0.0);
    REQUIRE(fpreg(state, 0) == 0);
    REQUIRE(fpreg(state, 1) == 0);

    // From Princ Ops page 157
    floatToFpreg(state, 0, 1.0);
    REQUIRE(fpreg(state, 0) == 0x41100000);
    REQUIRE(fpreg(state, 1) == 0);

    floatToFpreg(state, 0, 0.5);
    REQUIRE(fpreg(state, 0) == 0x40800000);
    REQUIRE(fpreg(state, 1) == 0);

    floatToFpreg(state, 0, 1/64);
    REQUIRE(fpreg(state, 0) == 0x3f400000);
    REQUIRE(fpreg(state, 1) == 0);

    floatToFpreg(state, 0, -15);
    REQUIRE(fpreg(state, 0) == 0xc1f00000);
    REQUIRE(fpreg(state, 1) == 0);
  }

  TEST_CASE( "fp 32 conversion") {
    State state;
    REQUIRE(fpreg32ToFloat(state, 0) == 0);

    fpreg(state, 0, 0xff000000);
    REQUIRE(fpreg32ToFloat(state, 0) == 0);

    fpreg(state, 0, 0x41100000);
    REQUIRE(fpreg32ToFloat(state, 0) == 1.0);

    fpreg(state, 0, 0x40800000);
    REQUIRE(fpreg32ToFloat(state, 0) == .5);

    fpreg(state, 0, 0x3f400000);
    REQUIRE(fpreg32ToFloat(state, 0) == 1/64);

    fpreg(state, 0, 0xc1f00000);
    REQUIRE(fpreg32ToFloat(state, 0) == -15);

    unsigned int seed = 1;
    for (int i = 0; i < 20; i++) {
      double f = rand_r(&seed) / double(RAND_MAX);
      int p = (rand_r(&seed) / double(RAND_MAX) * 400) - 200;
      f = f * pow(2, p);
      if (rand_r(&seed) & 1) {
        f = -f;
      }
      floatToFpreg(state, 0, f);
      std::cout << f << "\n";
      double fp = fpreg32ToFloat(state, 0);
      // Compare within tolerance
      double ratio = abs((fp - f) / f);
      REQUIRE(ratio < .000001);
    }
  }

  TEST_CASE( "fp 64 conversion") {
    State state;
    fpreg(state, 0, 0);
    fpreg(state, 1, 0);
    REQUIRE(fpreg64ToFloat(state, 0) == 0);

    fpreg(state, 0, 0xff000000);
    fpreg(state, 1, 0);
    REQUIRE(fpreg64ToFloat(state, 0) == 0);

    fpreg(state, 0, 0x41100000);
    fpreg(state, 1, 0);
    REQUIRE(fpreg64ToFloat(state, 0) == 1.0);

    fpreg(state, 0, 0x40800000);
    fpreg(state, 1, 0);
    REQUIRE(fpreg64ToFloat(state, 0) == .5);

    fpreg(state, 0, 0x3f400000);
    fpreg(state, 1, 0);
    REQUIRE(fpreg64ToFloat(state, 0) == 1. / 64);

    fpreg(state, 0, 0xc1f00000);
    fpreg(state, 1, 0);
    REQUIRE(fpreg64ToFloat(state, 0) == -15);

    floatToFpreg(state, 0, M_PI);
    REQUIRE(fpreg64ToFloat(state, 0) == M_PI);

    unsigned int seed = 1;
    for (int i = 0; i < 20; i++) {
      double f = rand_r(&seed) / double(RAND_MAX);
      int p = (rand_r(&seed) / double(RAND_MAX)* 400) - 200;
      f = f * pow(2, p);
      if (rand_r(&seed) & 1) {
        f = -f;
      }
      floatToFpreg(state, 0, f);
      std::cout << f;
      REQUIRE(fpreg64ToFloat(state, 0) == f);
    }
  }

  // Roughly test characteristics of random number generator
  TEST_CASE( "randfloat") {
    State state;
    unsigned int seed = 5;
    int pos = 0, neg = 0;
    int big = 0, small = 0;
    for (int i = 0; i < 100; i++) {
      double f = randfloat(seed);
      if (f < 0) {
        neg ++;
      } else {
        pos ++;
      }
      if (abs(f) > pow(2, 100)) {
        big++;
      } else if (abs(f) < pow(2, -100)) {
        small++;
      } 
    }
      SECTION(std::to_string(pos) + " > 30") {
    REQUIRE(pos > 30);
    }
      SECTION(std::to_string(neg) + " > 30") {
    REQUIRE(neg > 30);
    }
      SECTION(std::to_string(big) + " > 15") {
    REQUIRE(big > 15);
    }
      SECTION(std::to_string(small) + " > 15") {
    REQUIRE(small > 15);
    }

    // Test scaling
    big = 0;
    small = 0;
    for (int i = 0; i < 100; i++) {
      double f = randfloat(seed, 10);
      if (f < 0) {
        neg ++;
      } else {
        pos ++;
      }
      if (abs(f) > pow(2., -10)) {
        big++;
      } else if (abs(f) < pow(2., -10)) {
        small++;
      } 
    }
      SECTION(std::to_string(big) + " < 8") {
    REQUIRE(big < 8);
    }
SECTION(std::to_string(small) + " < 8") {
    REQUIRE(small < 8);
    }
  }

  TEST_CASE( "signed32") {
    State state;
    REQUIRE(signed32(0x12345678) == 0x12345678);
    REQUIRE(signed32(0xffffffff) == -1);
    REQUIRE(signed32(0xfffffff0) == -16);
  }

// Called from CHCTL
void chctl(State& state, Entry_t &entry) {
  chctl_w = state.W;
}

  TEST_CASE( "Load LR") {
    State state;
    reg(state, 1, 0x12345678);
    execute(state, {0x18310000}, "LR 3,1");
    REQUIRE(reg(state, 3) == 0x12345678);
  }

  TEST_CASE( "Load and Test LTR") {
    State state;
    reg(state, 4, 0xcdef1234);
    execute(state, {0x12340000}, "LTR 3,4");
    // LTR 3, 4
    REQUIRE(reg(state, 3) == 0xcdef1234);
    REQUIRE(state.CR == 1); // Negative);

    reg(state, 4, 0);
    execute(state, {0x12340000}, "LTR 3,4");
    // LTR 3, 4
    REQUIRE(reg(state, 3) == 0);
    REQUIRE(state.CR == 0); // Zero);

    reg(state, 4, 0x12345678);
    execute(state, {0x12340000}, "LTR 3,4");
    // LTR 3, 4
    REQUIRE(reg(state, 3) == 0x12345678);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Load Complement LCR negative") {
    State state;
    reg(state, 4, 0x1000);
    execute(state, {0x13340000}, "LCR 3,4");
    // LCR 3, 4
    REQUIRE(reg(state, 3) == 0xfffff000);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE( "Load Complement LCR positive") {
    State state;
    reg(state, 4, 0xffffffff);
    execute(state, {0x13340000}, "LCR 3,4");
    // LCR 3, 4
    REQUIRE(reg(state, 3) == 1);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Load Complement LCR zero") {
    State state;
    reg(state, 4, 0);
    execute(state, {0x13340000}, "LCR 3,4");
    // LCR 3, 4
    REQUIRE(reg(state, 3) == 0);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "Load Complement LCR overflow") {
    State state;
    state.PROGMASK = 0; // Disable overflow interrupt
    reg(state, 4, 0x80000000);
    execute(state, {0x13340000}, "LCR 3,4");
    // LCR 3, 4
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "Load Positive LPR") {
    State state;
    reg(state, 4, 0xffffffff);
    execute(state, {0x10340000}, "LPR 3,4");
    // LPR 3, 4
    REQUIRE(reg(state, 3) == 1);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Load Negative LNR positive") {
    State state;
    reg(state, 4, 0x12345678);
    execute(state, {0x11340000}, "LNR 3,4");
    // LNR 3, 4
    REQUIRE(reg(state, 3) == 0xedcba988);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE( "Load Negative LNR negative") {
    State state;
    reg(state, 4, 0xc2345678);
    execute(state, {0x11340000}, "LNR 3,4");
    // LNR 3, 4
    REQUIRE(reg(state, 3) == 0xc2345678);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE( "Load Negative LNR 0") {
    State state;
    reg(state, 4, 0);
    execute(state, {0x11340000}, "LNR 3,4");
    // LNR 3, 4
    REQUIRE(reg(state, 3) == 0);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "AR add") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x00000005);
    execute(state, {0x1a120000}, "AR 1,2");
    std::cout << "reg 31 has " + fmt4(state.LS[0x31]) << "\n";
    REQUIRE(reg(state, 1) == 0x1234567d);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "AR two adds") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x00000001);
    reg(state, 3, 0x00000010);
      execute(state, {0x1a121a31}, "AR 1,2");
    executeInstr(state); // Run the second instruction
    std::cout << "reg 31 has " + fmt4(state.LS[0x31]) << "\n";
    REQUIRE(reg(state, 1) == 0x12345679);
    REQUIRE(reg(state, 3) == 0x12345689);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "AR add-negative") {
    State state;
    reg(state, 1, 0x81234567);
    reg(state, 2, 0x00000001);
    execute(state, {0x1a120000}, "AR 1,2");
    REQUIRE(reg(state, 1) == 0x81234568);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE( "AR add-zero") {
    State state;
    reg(state, 1, 0x00000002);
    reg(state, 2, 0xfffffffe);
    execute(state, {0x1a120000}, "AR 1,2");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "AR add-overflow-trap-disabled") {
    State state;
    reg(state, 1, 0x7fffffff);
    reg(state, 2, 0x00000001);
    state.PROGMASK = 0; // Disable overflow interrupt
    execute(state, {0x1a120000}, "AR 1,2");
    REQUIRE(reg(state, 1) == 0x80000000);
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "AR add-overflow-trap-enabled") {
    State state;
    reg(state, 1, 0x7fffffff);
    reg(state, 2, 0x00000001);
    state.PROGMASK = 8; // Enable overflow interrupt
    execute(state, {0x1a120000}, "AR 1,2");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "add A") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x34567890;
    execute(state, {0x5a156200}, "A 1,200(5,6)");
    REQUIRE(reg(state, 1) == 0x12345678 + 0x34567890);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Add Halfword AH") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000202);
    state.MS[0x500] = 0x34567890; // Only 7890 used
    execute(state, {0x4a156200}, "AH 1,200(5,6)");
    REQUIRE(reg(state, 1) == 0x12345678 + 0x7890);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Add Halfword AH sign extend") {
    State state;
    reg(state, 1, 1);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0xfffe1234; // only fffe (-2) used
    execute(state, {0x4a156200}, "AH 1,200(5,6)");
    REQUIRE(reg(state, 1) == 0xffffffff); // -1);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE( "Add Logical ALR (i.e. unsigned) - zero no carry ") {
    State state;
    reg(state, 1, 0);
    reg(state, 2, 0);
    execute(state, {0x1e120000}, "ALR 1,2");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 0); // Zero, no carry);
  }

  TEST_CASE( "Add Logical ALR - non-zero no carry ") {
    State state;
    reg(state, 1, 0xffff0000);
    reg(state, 2, 0x00000002);
    execute(state, {0x1e120000}, "ALR 1,2");
    REQUIRE(reg(state, 1) == 0xffff0002);
    REQUIRE(state.CR == 1); // Nonzero, no carry);
  }

  TEST_CASE( "Add Logical ALR - zero, carry  ") {
    State state;
    reg(state, 1, 0xfffffffe);
    reg(state, 2, 0x00000002);
    execute(state, {0x1e120000}, "ALR 1,2");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 2); // Zero and carry);
  }


  TEST_CASE( "Add Logical ALR - not zero, carry  ") {
    State state;
    reg(state, 1, 0xfffffffe);
    reg(state, 2, 0x00000003);
    execute(state, {0x1e120000}, "ALR 1,2");
    REQUIRE(reg(state, 1) == 1);
    REQUIRE(state.CR == 3); // Not zero, carry);
  }

  TEST_CASE( "Add Logical AL") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0xf0000000;
    execute(state, {0x5e156200}, "AL 1,200(5,6)");
    REQUIRE(reg(state, 1) == 0x02345678);
    REQUIRE(state.CR == 3); // Not zero, carry);
  }

  TEST_CASE( "SR subtract") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x00000001);
    execute(state, {0x1b120000}, "SR 1,2");
    REQUIRE(reg(state, 1) == 0x12345677);
  }

  TEST_CASE( "Subtract S") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x12300000;
    execute(state, {0x5b156200}, "S 1,200(5,6)");
    REQUIRE(reg(state, 1) == 0x00045678);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Subtract Halfword SH") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x12300000;
    execute(state, {0x4b156200}, "SH 1,200(5,6)");
    REQUIRE(reg(state, 1) == 0x12345678 - 0x1230);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Subtract Logical SLR") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x12345678);
    execute(state, {0x1f120000}, "SLR 1,2");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 2); // Difference is zero (carry));
  }

  TEST_CASE( "Subtract Logical SL b") {
    State state;
    reg(state, 1, 0xffffffff);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x11111111;
    execute(state, {0x5f156200}, "SL 1,200(5,6)");
    REQUIRE(reg(state, 1) == 0xeeeeeeee);
    REQUIRE(state.CR == 3); // Non-zero, carry (no borrow));
  }

  TEST_CASE( "Subtract Logical SL") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x23456789;
    execute(state, {0x5f156200}, "SL 1,200(5,6)");
    REQUIRE(reg(state, 1) == (0x12345678 - 0x23456789));
    REQUIRE(state.CR == 1); // Non-zero, no carry (borrow));
  }

  TEST_CASE( "Compare CR") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x12345678);
    execute(state, {0x19120000}, "CR 1,2");
    REQUIRE(reg(state, 1) == 0x12345678); // Unchanged);
    REQUIRE(state.CR == 0); // Operands are equal);
  }

  TEST_CASE( "Compare CR b") {
    State state;
    reg(state, 1, 0xfffffffe); // -2
    reg(state, 2, 0xfffffffd); // -3
    execute(state, {0x19120000}, "CR 1,2");
    REQUIRE(reg(state, 1) == 0xfffffffe); // Unchanged);
    REQUIRE(state.CR == 2); // First operand is high);
  }

  TEST_CASE( "Compare CR c") {
    State state;
    reg(state, 1, 2);
    reg(state, 2, 3);
    execute(state, {0x19120000}, "CR 1,2");
    REQUIRE(reg(state, 1) == 2); // Unchanged);
    REQUIRE(state.CR == 1); // First operand is low);
  }

  TEST_CASE( "Compare C") {
    State state;
    reg(state, 1, 0xf0000000);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x12345678;
    execute(state, {0x59156200}, "C 1,200(5,6)");
    REQUIRE(state.CR == 1); // First operand is low);
  }

  TEST_CASE( "multiply MR: 28×19") {
    State state;
    reg(state, 3, 28);
    reg(state, 4, 19);
    execute(state, {0x1c240000}, "MR 2,4");
    REQUIRE(reg(state, 2) == 0);
    REQUIRE(reg(state, 3) == 28 * 19);
  }

  TEST_CASE( "multiply MR: random") {
    State state;
    unsigned int seed = 1;
    for (int i = 0; i < testcycles; i++) {
      int n1 = rand_r(&seed) / double(RAND_MAX) * 1000;
      int n2 = rand_r(&seed) / double(RAND_MAX) * 1000;
      if (n1 * n2 >= 0x10000) continue;
      reg(state, 3, n1);
      reg(state, 4, n2);
      execute(state, {0x1c240000}, "MR 2,4");
        SECTION(std::to_string(n1) + "×" + std::to_string(n2)) {
      REQUIRE(reg(state, 2) == 0);
            REQUIRE(reg(state, 3) == n1 * n2);
        }
    }
  }

  TEST_CASE( "multiply MR: large") {
    State state;
    reg(state, 3, 0x12345678);
    reg(state, 4, 0x34567890);
    execute(state, {0x1c240000}, "MR 2,4");
    REQUIRE(reg(state, 2) == 0x3b8c7b8);
    REQUIRE(reg(state, 3) == 0x3248e380);
  }

  TEST_CASE( "multiply MR: larger") {
    State state;
    reg(state, 3, 0x7fffffff);
    reg(state, 4, 0x7fffffff);
    execute(state, {0x1c240000}, "MR 2,4");
    REQUIRE(reg(state, 2) == 0x3fffffff);
    REQUIRE(reg(state, 3) == 0x00000001);
  }

  TEST_CASE( "multiply MR: negative") {
    State state;
    reg(state, 3, 0xfffffffc); // -4
    reg(state, 4, 0xfffffffb); // -5
    execute(state, {0x1c240000}, "MR 2,4");
    REQUIRE(reg(state, 2) == 0);
    REQUIRE(reg(state, 3) == 20);
  }

  TEST_CASE( "multiply MR: negative, positive") {
    State state;
    reg(state, 3, 0xfffffffc); // -4
    reg(state, 4, 0x0000000a); // 10
    execute(state, {0x1c240000}, "MR 2,4");
    REQUIRE(reg(state, 2) == 0xffffffff);
    REQUIRE(reg(state, 3) == (-40));
  }

  TEST_CASE( "Multiply M") {
    State state;
    reg(state, 3, 0x12345678);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x34567890;
    execute(state, {0x5c256200}, "M 2,200(5,6)");
    REQUIRE(reg(state, 2) == 0x03b8c7b8); // High 32-bits);
    REQUIRE(reg(state, 3) == 0x3248e380); // Low 32-bits);
  }

  TEST_CASE( "Multiply Halfword MH - small") {
    State state;
    reg(state, 3, 4);
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0x00000003; // 3
    execute(state, {0x4c356202}, "MH 3,202(5,6)");
    REQUIRE(reg(state, 3) == 12); // Low 32-bits);
  }

  TEST_CASE( "Multiply Halfword MH") {
    State state;
    reg(state, 3, 0x00000015); // 21
    reg(state, 5, 0x00000100);
    reg(state, 6, 0x00000200);
    state.MS[0x500] = 0xffd91111; // -39
    execute(state, {0x4c356200}, "MH 3,200(5,6)");
    REQUIRE(reg(state, 3) == 0xfffffccd); // Low 32-bits);
  }

  TEST_CASE( "Divide DR big") {
    State state;
    reg(state, 2, 0x00112233);
    reg(state, 3, 0x44556677);
    reg(state, 4, 0x12345678); // 0x1122334455667788 / 0x12345678
    execute(state, {0x1d240000}, "DR 2,4");
    // divide R2/R3 by R4
    std::cout << "Quotient " << std::hex << reg(state, 3) << "\n";
    std::cout << "Remainder " << std::hex << reg(state, 2) << "\n";
    REQUIRE(reg(state, 2) == 0x11b3d5f7); // Remainder);
    REQUIRE(reg(state, 3) == 0x00f0f0f0); // Quotient);
  }

  TEST_CASE( "Divide DR") {
    State state;
    reg(state, 2, 0x1);
    reg(state, 3, 0x12345678);
    reg(state, 4, 0x00000234);
    execute(state, {0x1d240000}, "DR 2,4");
    // divide R2/R3 by R4
    REQUIRE(reg(state, 2) == 0x112345678 % 0x234); // Remainder);
    REQUIRE(reg(state, 3) == 0x112345678 / 0x234); // Quotient);
  }

  TEST_CASE( "Divide DR negative") {
    State state;
    reg(state, 2, 0x1);
    reg(state, 3, 0x12345678);
    reg(state, 4, (-0x00000234));
    execute(state, {0x1d240000}, "DR 2,4");
    // divide R2/R3 by R4
    REQUIRE(reg(state, 2) == 0x112345678 % 0x234); // Remainder);
    REQUIRE(reg(state, 3) == 0x112345678 / 0x234); // Quotient);
  }

  TEST_CASE( "Divide D - overflow") {
    State state;
    reg(state, 2, 0x12345678);
    reg(state, 3, 0x9abcdef0);
    reg(state, 5, 0x100);
    reg(state, 6, 0x200);
    state.MS[0x500] = 0x23456789;
      execute(state, {0x5d256200}, "D 2,200(5,6)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Divide D") {
    State state;
    reg(state, 2, 0x12345678);
    reg(state, 3, 0x9abcdef0);
    reg(state, 5, 0x100);
    reg(state, 6, 0x200);
    state.MS[0x500] = 0x73456789;
    execute(state, {0x5d256200}, "D 2,200(5,6)");
    REQUIRE(reg(state, 2) == 0x50c0186a); // Remainder);
    REQUIRE(reg(state, 3) == 0x286dead6); // Quotient);
  }

  TEST_CASE( "Shift Left Single SLA") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x00000001);
    execute(state, {0x8b1f2001}, "SLA 1,1(2)"); // shift left by 1 + R2, i.e. 2.
    REQUIRE(reg(state, 1) == 0x12345678 << 2);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Shift Left Single SLA extrabits") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x00000001);
    execute(state, {0x8b1f2fc1}, "SLA 1,fc1(2)"); // shift value is 6 bits, fc ignored
    REQUIRE(reg(state, 1) == 0x12345678 << 2);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Shift Left Single SLA 0") {
    State state;
    reg(state, 1, 0x12345678);
    execute(state, {0x8b100000}, "SLA 1,0(0)");
    REQUIRE(reg(state, 1) == 0x12345678);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Shift Left Single SLA 0 negative") {
    State state;
    reg(state, 1, 0x92345678);
    execute(state, {0x8b1f0000}, "SLA 1,0(0)");
    REQUIRE(reg(state, 1) == 0x92345678); // Should be unchanged);
    REQUIRE(state.CR == 1); // Negative);
  }


  TEST_CASE( "Shift Left Single SLA 0 zero") {
    State state;
    reg(state, 1, 0);
    execute(state, {0x8b1f0000}, "SLA 1,0(0)");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "Shift Left Single SLA: positive overflow") {
    State state;
    reg(state, 1, 0x10000000);
    reg(state, 2, 2); // Shift by 2 still fits
    execute(state, {0x8b1f2000}, "SLA 1,0(2)"); // shift left by R2
    REQUIRE(reg(state, 1) == 0x40000000);
    REQUIRE(state.CR == 2); // Positive);

    reg(state, 1, 0x10000000);
    reg(state, 2, 3); // Shift by 3 overflows
    execute(state, {0x8b1f2000}, "SLA 1,0(2)"); // shift left by R2
    REQUIRE(reg(state, 1) == 0x00000000);
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "Shift Left Single SLA: shift out") {
    State state;
    reg(state, 1, 0x7fffffff);
    reg(state, 2, 0x0000001f); // Shift by 31 shifts out entire number
    execute(state, {0x8b1f2000}, "SLA 1,0(2)"); // shift left by R2
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "Shift Left Single SLA: shift out by 32") {
    State state;
    reg(state, 1, 0x7fffffff);
    reg(state, 2, 0x00000020); // Shift by 32 shifts out entire number
    execute(state, {0x8b1f2000}, "SLA 1,0(2)"); // shift left by R2
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "Shift Left Single SLA: shift out negative") {
    State state;
    reg(state, 1, 0x80000000);
    reg(state, 2, 0x0000001f); // Shift by 31 shifts out entire number
    execute(state, {0x8b1f2000}, "SLA 1,0(2)"); // shift left by R2
    REQUIRE(reg(state, 1) == 0x80000000);
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "Shift Left Single SLA: negative overflow") {
    State state;
    reg(state, 1, 0x80000000);
    reg(state, 2, 21); // Shift by 2 should overflow
    execute(state, {0x8b1f2000}, "SLA 1,0(2)"); // shift left by R2
    REQUIRE(reg(state, 1) == 0x80000000);
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "Shift Left Single SLA negative-overflow") {
    State state;
    reg(state, 1, 0x80000001);
    reg(state, 2, 0x00000001);
    execute(state, {0x8b1f2001}, "SLA 1,1(2)"); // shift left by 1 + R2
    REQUIRE(reg(state, 1) == 0x80000004); // Keep the sign);
    REQUIRE(state.CR == 3); // Overflow);
  }

  TEST_CASE( "Shift Left Single SLA negative") {
    State state;
    reg(state, 1, 0xf0000001);
    reg(state, 2, 0x00000001);
    execute(state, {0x8b1f2001}, "SLA 1,1(2)"); // shift left by 1 + R2
    REQUIRE(reg(state, 1) == 0xc0000004); // Keep the sign);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE( "Add Decimal AP - small") {
    State state;
    state.MS[0x100] = 0x0000002c; // 2+
    state.MS[0x200] = 0x00003c00; // 3+
    execute(state, {0xfa000103, 0x02020000}, "AP 103(1,0),202(1,0)");
    REQUIRE(state.MS[0x100] ==  0x0000005c); // 5+);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Add Decimal AP - 1 byte") {
    State state;
    state.MS[0x100] = 0x2888011c; // 2888011+
    state.MS[0x200] = 0x1112292c; // 1112292+
    execute(state, {0xfa330100, 0x02000000}, "AP 100(4,0),200(4,0)");
    REQUIRE(state.MS[0x100] ==  0x4000303c); // 4000303+);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Add Decimal AP - 1 byte - small") {
    State state;
    state.MS[0x100] = 0x0000002c; // 2+
    state.MS[0x200] = 0x0000003c; // 3+
    execute(state, {0xfa330100, 0x02000000}, "AP 100(4,0),200(4,0)");
    REQUIRE(state.MS[0x100] ==  0x0000005c); // 5+);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Add Decimal AP - offset") {
    State state;
    state.MS[0x100] = 0x0043212c; // 2+
    state.MS[0x200] = 0x0023413c; // 3+
    execute(state, {0xfa220101, 0x02010000}, "AP 101(3,0),201(3,0)");
    REQUIRE(state.MS[0x100] ==  0x0066625c); // 5+);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Add Decimal AP - no offset") {
    State state;
    state.MS[0x100] = 0x0043212c; // 2+
    state.MS[0x200] = 0x0023413c; // 3+
    execute(state, {0xfa330100, 0x02000000}, "AP 100(4,0),200(4,0)");
    REQUIRE(state.MS[0x100] ==  0x0066625c); // 5+);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Add Decimal AP") {
    State state;
    // Example from Princ Ops p136.2
    reg(state, 12, 0x00002000);
    reg(state, 13, 0x000004fd);
    state.MS[0x2000] = 0x38460d00; // 38460-
    state.MS[0x500] = 0x0112345c; // 112345+
    execute(state, {0xfa23c000, 0xd0030000}, "AP 0(3,12),3(4,13)");
    REQUIRE(state.MS[0x2000] ==  0x73885c00); // 73885+);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Load Positive (FP long) LPDR") {
    State state;
    fpreg(state, 0, 0x82345678);
    fpreg(state, 1, 0x9abcdef0);
    execute(state, {0x20400000}, "LPDR 4,0");
    REQUIRE(fpreg(state, 4) == 0x02345678);
    REQUIRE(fpreg(state, 5) == 0x9abcdef0);
  }

  TEST_CASE( "Load Negative (FP long) LNDR") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0x9abcdef0);
    execute(state, {0x21400000}, "LNDR 4,0");
    REQUIRE(fpreg(state, 4) == 0x92345678);
    REQUIRE(fpreg(state, 5) == 0x9abcdef0);
  }

  TEST_CASE( "Load and Test (FP) LTDR - positive") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0x9abcdef0);
    execute(state, {0x22400000}, "LTDR 4,0");
    REQUIRE(fpreg(state, 4) == 0x12345678);
    REQUIRE(fpreg(state, 5) == 0x9abcdef0);
    REQUIRE(state.CR == 2); // Greater than zero);
  }

  TEST_CASE( "Load and Test (FP) LTDR - negative") {
    State state;
    fpreg(state, 0, 0x92345678);
    fpreg(state, 1, 0x9abcdef0);
    execute(state, {0x22400000}, "LTDR 4,0");
    REQUIRE(fpreg(state, 4) == 0x92345678);
    REQUIRE(fpreg(state, 5) == 0x9abcdef0);
    REQUIRE(state.CR == 1); // Less than zero);
  }

  TEST_CASE( "Load and Test (FP) LTDR - zero negative") {
    State state;
    fpreg(state, 0, 0xff000000);
    fpreg(state, 1, 0x00000000);
    execute(state, {0x22400000}, "LTDR 4,0");
    REQUIRE(fpreg(state, 4) == 0xff000000);
    REQUIRE(fpreg(state, 5) == 0x00000000);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "Load and Test (FP) LTDR - zero positive") {
    State state;
    fpreg(state, 0, 0x1f000000);
    fpreg(state, 1, 0x00000000);
    execute(state, {0x22400000}, "LTDR 4,0");
    REQUIRE(fpreg(state, 4) == 0x1f000000);
    REQUIRE(fpreg(state, 5) == 0x00000000);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "Load Complement (FP long) LCDR") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0x9abcdef0);
    execute(state, {0x23400000}, "LCDR 4,0");
    REQUIRE(fpreg(state, 4) == 0x92345678);
    REQUIRE(fpreg(state, 5) == 0x9abcdef0);
  }

  TEST_CASE( "Halve (FP) HDR") {
    State state;
    fpreg(state, 2, 0x12123456);
    fpreg(state, 3, 0xabcdef00);
    execute(state, {0x24020000}, "HDR 0,2");
      SECTION(std::to_string(fpreg64ToFloat(state, 0)) + " " + std::to_string(fpreg64ToFloat(state, 2))) {
      REQUIRE(fpreg(state, 0) == 0x1191a2b5);
    REQUIRE(fpreg(state, 1) == 0x5e6f7800);
      }
  }

  TEST_CASE( "Halve (FP) HDR - guard bit used after normalizing") {
    State state;
    fpreg(state, 2, 0x12123456);
    fpreg(state, 3, 0xabcdef01);
    execute(state, {0x24020000}, "HDR 0,2");
    REQUIRE(fpreg(state, 0) == 0x1191a2b5);
    REQUIRE(fpreg(state, 1) == 0x5e6f7808);
  }

  TEST_CASE( "Halve (FP) HDR - simple") {
    State state;
    fpreg(state, 2, 0x12aa8844);
    fpreg(state, 3, 0x22884422);
    execute(state, {0x24020000}, "HDR 0,2");
    REQUIRE(fpreg(state, 0) == 0x12554422);
    REQUIRE(fpreg(state, 1) == 0x11442211);
  }

  TEST_CASE( "Halve (FP) HDR - shift across word") {
    State state;
    fpreg(state, 2, 0x12aa8845);
    fpreg(state, 3, 0x22884422);
    execute(state, {0x24020000}, "HDR 0,2");
    REQUIRE(fpreg(state, 0) == 0x12554422);
    REQUIRE(fpreg(state, 1) == 0x91442211);
  }

  TEST_CASE( "Halve (FP) HDR underflow") {
    State state;
    fpreg(state, 2, 0x00000000);
    fpreg(state, 3, 0x00000001);
    execute(state, {0x24020000}, "HDR 0,2");
    REQUIRE(fpreg(state, 0) == 0x00000000);
    REQUIRE(fpreg(state, 1) == 0x00000000);
  }

  TEST_CASE( "Halve (FP) HDR zero") {
    State state;
    fpreg(state, 2, 0x12000000);
    fpreg(state, 3, 0x00000000);
    execute(state, {0x24020000}, "HDR 0,2");
    REQUIRE(fpreg(state, 0) == 0x00000000);
    REQUIRE(fpreg(state, 1) == 0x00000000);
  }

  TEST_CASE( "Halve (FP) HDR random") {
    State state;
      unsigned int seed = 100;
    for (int i = 0; i < testcycles; i++) {
      double f = randfloat(seed);
      floatToFpreg(state, 2, f);
      execute(state, {0x24020000}, "HDR 0,2");
      int f1 = fpreg64ToFloat(state, 0);
      REQUIRE(f / 2 == f1);
    }
  }

  TEST_CASE( "Load (FP long) LDR - bad register") {
    State state;
      execute(state, {0x28410000}, "LDR 4,1");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Load (FP long) LDR - bad register b") {
    State state;
      execute(state, {0x28140000}, "LDR 1,4");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Compare (FP) CDR") {
    State state;
    fpreg(state, 4, 0x43000000);
    fpreg(state, 5, 0x00000000);
    fpreg(state, 6, 0x34123456);
    fpreg(state, 7, 0x789abcde);
    execute(state, {0x2946ffff}, "CDR 4,6");
    REQUIRE(state.CR == 0); // Equal);
  }

  TEST_CASE( "Add N (FP) ADR") {
    State state;
      unsigned int seed = 200;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x2a020000}, "ADR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      REQUIRE(fres == f1 - f2);
    }
  }

  TEST_CASE( "Subtract N (FP) SDR") {
    State state;
    unsigned int seed = 300;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x2b020000}, "SDR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      REQUIRE(fres == f1 - f2);
    }
  }

  TEST_CASE( "Multiply (FP) MDR") {
    State state;
      unsigned int seed = 400;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed);
      double f2 = randfloat(seed);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x2c020000}, "MDR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      REQUIRE(fres == f1 * f2);
    }
  }

  TEST_CASE( "Divide (FP) DDR") {
    State state;
      unsigned int seed = 500;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x2d020000}, "DDR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      REQUIRE(fres == f1 / f2);
    }
  }

  TEST_CASE( "Add U (FP) AWR") {
    State state;
      unsigned int seed = 600;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x2e020000}, "AWR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      REQUIRE(fres == f1 + f2);
    }
  }

  TEST_CASE( "Subtract U (FP) SWR") {
    State state;
    unsigned int seed = 10;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x2f020000}, "SWR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      REQUIRE(fres == f1 - f2);
    }
  }

  TEST_CASE( "Load Positive (FP short) LPER") {
    State state;
    fpreg(state, 0, 0x82345678);
    fpreg(state, 1, 0x33333333);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0x55555555);
    execute(state, {0x30400000}, "LPER 4,0");
    REQUIRE(fpreg(state, 0) == 0x82345678);
    REQUIRE(fpreg(state, 1) == 0x33333333);
    REQUIRE(fpreg(state, 4) == 0x02345678);
    REQUIRE(fpreg(state, 5) == 0x55555555);
  }

  TEST_CASE( "Load Negative (FP short) LNER -neg") {
    State state;
    fpreg(state, 0, 0x82345678);
    fpreg(state, 1, 0x33333333);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0x55555555);
    execute(state, {0x31400000}, "LNER 4,0");
    REQUIRE(fpreg(state, 0) == 0x82345678);
    REQUIRE(fpreg(state, 1) == 0x33333333);
    REQUIRE(fpreg(state, 4) == 0x82345678);
    REQUIRE(fpreg(state, 5) == 0x55555555);
  }

  TEST_CASE( "Load Negative (FP short) LNER -pos") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0x33333333);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0x55555555);
    execute(state, {0x31400000}, "LNER 4,0");
    REQUIRE(fpreg(state, 0) == 0x12345678);
    REQUIRE(fpreg(state, 1) == 0x33333333);
    REQUIRE(fpreg(state, 4) == 0x92345678);
    REQUIRE(fpreg(state, 5) == 0x55555555);
  }

  TEST_CASE( "Load and Test (FP short) LTER - zero") {
    State state;
    fpreg(state, 0, 0x12000000);
    fpreg(state, 1, 0x33333333);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0x55555555);
    execute(state, {0x32400000}, "LTER 4,0");
    REQUIRE(fpreg(state, 0) == 0x12000000);
    REQUIRE(fpreg(state, 1) == 0x33333333);
    REQUIRE(fpreg(state, 4) == 0x12000000);
    REQUIRE(fpreg(state, 5) == 0x55555555);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "Load and Test (FP short) LTER - negative") {
    State state;
    fpreg(state, 0, 0xc2345678);
    fpreg(state, 1, 0x33333333);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0x55555555);
    execute(state, {0x32400000}, "LTER 4,0");
    REQUIRE(fpreg(state, 0) == 0xc2345678);
    REQUIRE(fpreg(state, 1) == 0x33333333);
    REQUIRE(fpreg(state, 4) == 0xc2345678);
    REQUIRE(fpreg(state, 5) == 0x55555555);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE( "Load and Test (FP short) LTER - positive") {
    State state;
    fpreg(state, 0, 0x00000001);
    fpreg(state, 1, 0x33333333);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0x55555555);
    execute(state, {0x32400000}, "LTER 4,0");
    REQUIRE(fpreg(state, 0) == 0x00000001);
    REQUIRE(fpreg(state, 1) == 0x33333333);
    REQUIRE(fpreg(state, 4) == 0x00000001);
    REQUIRE(fpreg(state, 5) == 0x55555555);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE( "Load Complement (FP short) LCER") {
    State state;
    fpreg(state, 2, 0x12345678);
    fpreg(state, 3, 0x33333333);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0x55555555);
    execute(state, {0x33420000}, "LCER 4,2");
    REQUIRE(fpreg(state, 2) == 0x12345678);
    REQUIRE(fpreg(state, 3) == 0x33333333);
    REQUIRE(fpreg(state, 4) == 0x92345678);
    REQUIRE(fpreg(state, 5) == 0x55555555);
  }

  TEST_CASE( "Halve (FP short) HER") {
    State state;
    fpreg(state, 2, 0x12345678); // Source
    execute(state, {0x34420000}, "HER 4,2");
    REQUIRE(fpreg(state, 4) == 0x121a2b3c);
  }

  TEST_CASE( "Halve (FP short) HER - unnormalized") {
    State state;
    fpreg(state, 2, 0x18000008); // Source: 8 is unnormalized
    execute(state, {0x34420000}, "HER 4,2");
    REQUIRE(fpreg(state, 4) == 0x13400000);
  }

  TEST_CASE( "Halve (FP short) HER - result needs normalizing") {
    State state;
    fpreg(state, 2, 0x18100000); // Result will be 18080000, normalized to 17800000
    execute(state, {0x34420000}, "HER 4,2");
    REQUIRE(fpreg(state, 4) == 0x17800000);
  }

  TEST_CASE( "Halve (FP short) HER - zero") {
    State state;
    fpreg(state, 2, 0x00000000); // standard zero
    execute(state, {0x34420000}, "HER 4,2");
    REQUIRE(fpreg(state, 4) == 0x00000000);
  }

  TEST_CASE( "Halve (FP short) HER - nonstandard zero") {
    State state;
    fpreg(state, 2, 0x95000000); // nonstandard zero
    execute(state, {0x34420000}, "HER 4,2");
    REQUIRE(fpreg(state, 4) == 0x00000000);
  }

  TEST_CASE( "Halve (FP short) HER - underflow") {
    State state;
    fpreg(state, 2, 0x00000001);
    execute(state, {0x34420000}, "HER 4,2");
    REQUIRE(fpreg(state, 4) == 0x00000000);
  }

  TEST_CASE( "Load (FP short) LER") {
    State state;
    fpreg(state, 2, 0x12345678); // Source
    fpreg(state, 3, 0x9abcdef0);
    fpreg(state, 4, 0x22334455); // Destination
    fpreg(state, 5, 0xaabbccdd);
    execute(state, {0x38420000}, "LER 4,2");
    REQUIRE(fpreg(state, 2) == 0x12345678);
    REQUIRE(fpreg(state, 3) == 0x9abcdef0);
    REQUIRE(fpreg(state, 4) == 0x12345678);
    REQUIRE(fpreg(state, 5) == 0xaabbccdd);
  }

  TEST_CASE( "Load (FP short) LER - bad register") {
    State state;
      execute(state, {0x38120000}, "LER 1,2");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Load (FP short) LER - bad register b") {
    State state;
      execute(state, {0x38410000}, "LER 4,1");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE("Compare (FP short) CER equal ") {
    State state;
    fpreg(state, 4, 0x12345678);
    fpreg(state, 2, 0x12345678);
    execute(state, {0x39420000}, "CER 4,2");
    REQUIRE(state.CR == 0);
  }

  TEST_CASE("Compare (FP short) CER greater ") {
    State state;
    fpreg(state, 4, 0x12345679);
    fpreg(state, 2, 0x12345678);
    execute(state, {0x39420000}, "CER 4,2");
    REQUIRE(state.CR == 2);
  }

  TEST_CASE("Compare (FP short) CER less ") {
    State state;
    fpreg(state, 4, 0x92345678);
    fpreg(state, 2, 0x12345678);
    execute(state, {0x39420000}, "CER 4,2");
    REQUIRE(state.CR == 1);
  }

  TEST_CASE("Add N (FP short) AER ") {
    State state;
    unsigned int seed = 11;
    for (int i = 0; i < 1; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      f1 = 1;
      f2 = 2;
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x3a020000}, "AER 0,2");
      int fres = fpreg32ToFloat(state, 0);
      int wanted = f1 + f2;
      int ratio = abs((fres - wanted) / wanted);
        SECTION(std::to_string(fres) + " " + std::to_string(wanted)) {
      REQUIRE(ratio < .000001);
    }
      if (wanted == 0) {
        REQUIRE(state.CR == 1);
      } else if (wanted > 0) {
        REQUIRE(state.CR == 2);
      } else {
        REQUIRE(state.CR == 1);
      }
    }
  }

  TEST_CASE("Subtract N (FP short) SER ") {
    State state;
    unsigned int seed = 12;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x3b020000}, "SER 0,2");
      int fres = fpreg32ToFloat(state, 0);
      int wanted = f1 - f2;
      int ratio = abs((fres - wanted) / wanted);
        SECTION(std::to_string(fres) + " " + std::to_string(wanted)) {
      REQUIRE(ratio < .000001);
    }
    }
  }

  TEST_CASE("Multiply N (FP short) MER ") {
    State state;
    unsigned int seed = 13;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x3c020000}, "MER 0,2");
      int fres = fpreg64ToFloat(state, 0);
      int wanted = f1 * f2;
      int ratio = abs((fres - wanted) / wanted);
        SECTION(std::to_string(fres) + " " + std::to_string(wanted)) {
      REQUIRE(ratio < .000001);
    }
    }
  }

  TEST_CASE("Divide N (FP short) DER ") {
    State state;
    unsigned int seed = 14;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x3d020000}, "DER 0,2");
      int fres = fpreg64ToFloat(state, 0);
      int wanted = f1 / f2;
      int ratio = abs((fres - wanted) / wanted);
        SECTION(std::to_string(fres) + " " + std::to_string(wanted)) {
      REQUIRE(ratio < .000001);
    }
    }
  }

  TEST_CASE("Add U (FP short) AUR ") {
    State state;
    unsigned int seed = 15;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x3e020000}, "AUR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      int wanted = f1 + f2;
      int ratio = abs((fres - wanted) / wanted);
        SECTION(std::to_string(fres) + " " + std::to_string(wanted)) {
      REQUIRE(ratio < .000001);
    }
    }
  }

  TEST_CASE("Subtract U (FP short) SUR ") {
    State state;
    unsigned int seed = 16;
    for (int i = 0; i < testcycles; i++) {
      double f1 = randfloat(seed, 64);
      double f2 = randfloat(seed, 64);
      floatToFpreg(state, 0, f1);
      floatToFpreg(state, 2, f2);
      execute(state, {0x3f020000}, "SUR 0,2");
      int fres = fpreg64ToFloat(state, 0);
      int wanted = f1 - f2;
      int ratio = abs((fres - wanted) / wanted);
        SECTION(std::to_string(fres) + " " + std::to_string(wanted)) {
      REQUIRE(ratio < .000001);
    }
    }
  }

  TEST_CASE("Store halfword STH ") {
    State state;
    reg(state, 3, 0xaabbccdd);
    reg(state, 4, 1);
    reg(state, 5, 1);
    state.MS[0x1000] = 0x12345678;
    execute(state, {0x40345ffe}, "STH 3,ffe(4,5)");
    REQUIRE(state.MS[0x1000] == 0xccdd5678);
  }

  TEST_CASE("Store halfword STH +2") {
    State state;
    reg(state, 3, 0xaabbccdd);
    reg(state, 4, 1);
    reg(state, 5, 3);
    state.MS[0x1000] = 0x12345678;
    execute(state, {0x40345ffe}, "STH 3,ffe(4,5)");
    REQUIRE(state.MS[0x1000] == 0x1234ccdd);
  }

  TEST_CASE("Store halfword STH odd") {
    State state;
    reg(state, 3, 0xaabbccdd);
    reg(state, 4, 1);
    reg(state, 5, 2);
    state.MS[0x1000] = 0x12345678;
      execute(state, {0x40345ffe}, "STH 3,ffe(4,5)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE("Load Address LA") {
    State state;
    // From Princ Ops p147
    execute(state, {0x41100800}, "LA 1,800(0,0)");
    REQUIRE(reg(state, 1) == 2048);
  }

  TEST_CASE("Load Address LA b") {
    State state;
    // From Princ Ops p147
    reg(state, 5, 0x00123456);
    execute(state, {0x4150500a}, "LA 5,a(0,5)");
    REQUIRE(reg(state, 5) == 0x00123460);
  }

  TEST_CASE("Store Character STC") {
    State state;
    for (int i = 0; i < 4; i++) { // Test all 4 offsets
      reg(state, 5, 0xffffff12); // Only 12 used
      reg(state, 1, i);
      state.MS[0x100] = 0xaabbccdd;
      execute(state, {0x42501100}, "STC 5,100(0,1)");
      int shift = (3 - i) * 8;
      int desired = ((0xaabbccdd & ~(0xff << shift)) | (0x12 << shift));
      REQUIRE(state.MS[0x100] == desired);
    }
  }

  TEST_CASE("Insert Character IC") {
    State state;
    for (int i = 0; i < 4; i++) { // Test all 4 offsets
      reg(state, 5, 0xaabbccdd);
      reg(state, 1, i);
      state.MS[0x100] = 0x00112233;
      execute(state, {0x43501100}, "IC 5,100(0,1)");
      int desired = (0xaabbcc00 | (i * 17));
      REQUIRE(reg(state, 5) == desired);
    }
  }

  TEST_CASE("Execute EX") {
    State state;
    state.MS[0x100] = 0x1a000000; // Target instruction AR 0,0
    reg(state, 1, 0x00000045); // Modification: AR 4,5
    reg(state, 4, 0x100);
    reg(state, 5, 0x200);
    execute(state, {0x44100100}, "EX 1,100(0,0)");
    REQUIRE(reg(state, 4) == 0x300);
  }

  TEST_CASE("Execute EX double execute") {
    State state;
    state.MS[0x100] = 0x44100100; // Target instruction EX 1,100(0,0)
    reg(state, 1, 0x00000045); // Modification: EX 4,100(5,0)
      execute(state, {0x44100100}, "EX 1,100(0,0)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Branch and link BAL") {
    State state;
    reg(state, 3, 0x12300000);
    reg(state, 4, 0x00045600);
    state.ILC = 0; // overwritten with 2
    state.CR = 3;
    state.PROGMASK = 0xa;
    execute(state, {0x45134078}, "BAL 1,78(3,4)");
    REQUIRE(reg(state, 1) == 0xba000404); // low-order PSW: ILC, CR, PROGMASK, return IAR);
    REQUIRE(state.IAR == 0x00345678);
  }

  TEST_CASE("Branch on Count BCT taken") {
    State state;
    reg(state, 1, 3); // Counter
    reg(state, 2, 0x00345678); // Branch destination
    reg(state, 3, 0x00000010);
    execute(state, {0x46123100}, "BCT 1,100(2,3)");
    REQUIRE(reg(state, 1) == 2);
    REQUIRE(state.IAR == 0x00345788);
  }

  TEST_CASE("Branch/Condition BC") {
    State state;
    unsigned int seed = 42;
    for (int i = 0; i < 16; i++) {
      state.CR = rand_r(&seed) & 3;
        std::string instr = std::string("BC") + std::to_string(i) + ",100(0,0)";
        uint32_t op = 0x47000100 | (i << 20);
        execute(state, {op}, instr);
      if (((i & 8) && (state.CR == 0)) ||
          ((i & 4) && (state.CR == 1)) ||
          ((i & 2) && (state.CR == 2)) ||
          ((i & 1) && (state.CR == 3))) {
        // Taken
        REQUIRE(state.IAR == 0x100);
      } else {
        REQUIRE(state.IAR == 0x404);
      }
    }
  }

  TEST_CASE( "Load Halfword LH sign-extend") {
    State state;
    reg(state, 3, 0xffffffff);
    reg(state, 4, 0x1000);
    reg(state, 5, 0x200);
    state.MS[0x1b84] = 0x87654321;
    execute(state, {0x48345984}, "LH 3,984(4,5)");
    // LH 3, 984(4, 5): load R3 with mem[984+R4+R45)
    REQUIRE(reg(state, 3) == 0xffff8765); // sign extension);
  }

  TEST_CASE( "Load Halfword LH sign-extend unaligned") {
    State state;
    reg(state, 3, 0xffffffff);
    reg(state, 4, 0x1000);
    reg(state, 5, 0x202);
    state.MS[0x1b84] = 0x07658321;
    execute(state, {0x48345984}, "LH 3,984(4,5)");
    // LH 3, 984(4, 5): load R3 with mem[984+R4+R45)
    REQUIRE(reg(state, 3) == 0xffff8321); // sign extension);
  }

  TEST_CASE( "Load Halfword LH halfword aligned") {
    State state;
    reg(state, 3, 0xffffffff);
    reg(state, 4, 0x1000);
    reg(state, 5, 0x200);
    state.MS[0x1b84] = 0x87654321;
    execute(state, {0x48345986}, "LH 3,986(4,5)");
    // LH 3, 986(4, 5): load R3 with mem[986+R4+R45)
    REQUIRE(reg(state, 3) == 0x00004321);
  }

  TEST_CASE("Compare Halfword CH equal") {
    State state;
    reg(state, 3, 0x00005678);
    state.MS[0x100] = 0x5678abcd;
    execute(state, {0x49300100}, "CH 3,100(0,0)");
    REQUIRE(state.CR == 0); // equal);
  }

  TEST_CASE("Compare Halfword CH equal extend") {
    State state;
    reg(state, 3, 0xffff9678);
    state.MS[0x100] = 0x9678abcd;
    execute(state, {0x49300100}, "CH 3,100(0,0)");
    REQUIRE(state.CR == 0); // equal);
  }

  TEST_CASE("Compare Halfword CH high") {
    State state;
    reg(state, 3, 0x00001235);
    state.MS[0x100] = 0x1234abcd;
    execute(state, {0x49300100}, "CH 3,100(0,0)");
    REQUIRE(state.CR == 2); // First operand high);
  }

  TEST_CASE("Compare Halfword CH high extend") {
    State state;
    reg(state, 3, 0x00001235);
    state.MS[0x100] = 0x8234abcd;
    execute(state, {0x49300100}, "CH 3,100(0,0)");
    REQUIRE(state.CR == 2); // First operand high);
  }

  TEST_CASE("Compare Halfword CH low neg") {
    State state;
    reg(state, 3, 0x80001235);
    state.MS[0x100] = 0x1234abcd;
    execute(state, {0x49300100}, "CH 3,100(0,0)");
    REQUIRE(state.CR == 1); // First operand low);
  }

  TEST_CASE("Compare Halfword CH low neg extend") {
    State state;
    reg(state, 3, 0xfffffffc);
    state.MS[0x100] = 0xfffd0000;
    execute(state, {0x49300100}, "CH 3,100(0,0)");
    REQUIRE(state.CR == 1); // First operand low);
  }

  // Halfword second operand is sign-extended and added to first register.
  TEST_CASE("Add halfword AH") {
    State state;
    reg(state, 3, 0x12345678);
    state.MS[0x200] = 0x1234eeee;
    execute(state, {0x4a300200}, "AH 3,200(0,0)");
    REQUIRE(reg(state, 3) == 0x12345678 + 0x1234);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE("Add halfword AH negative") {
    State state;
    reg(state, 3, 0x12345678);
    state.MS[0x200] = 0xfffe9999; // -2
    execute(state, {0x4a300200}, "AH 3,200(0,0)");
    REQUIRE(reg(state, 3) == 0x12345676);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE("Add halfword AH +2") {
    State state;
    reg(state, 3, 0x12345678);
    reg(state, 1, 2);
    state.MS[0x200] = 0x99991234;
    execute(state, {0x4a310200}, "AH 3,200(1,0)");
    REQUIRE(reg(state, 3) == 0x12345678 + 0x1234);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE("Subtract halfword AH") {
    State state;
    reg(state, 3, 0x12345678);
    state.MS[0x200] = 0x1234eeee;
    execute(state, {0x4b300200}, "SH 3,200(0,0)");
    REQUIRE(reg(state, 3) == 0x12345678 - 0x1234);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE("Multiply halfword MH") {
    State state;
    reg(state, 3, 0x12345678);
    state.MS[0x200] = 0x00059999; // 5
    execute(state, {0x4c300200}, "MH 3,200(0,0)");
    REQUIRE(reg(state, 3) == 0x12345678 * 5);
  }

  TEST_CASE("Multiply halfword MH negatives ") {
    State state;
    reg(state, 3, (-0x12345678));
    state.MS[0x200] = 0xfffb9999; // -5
    execute(state, {0x4c300200}, "MH 3,200(0,0)");
    REQUIRE(reg(state, 3) == 0x12345678 * 5);
  }

  TEST_CASE( "Convert to Binary CVB: princ op") {
    State state;
    // Example from Principles of Operation p122
    reg(state, 5, 50); // Example seems to have addresses in decimal?
    reg(state, 6, 900);
    state.MS[1000] = 0x00000000;
    state.MS[1004] = 0x0025594f;
    execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(reg(state, 7) == 25594); // Note: decimal, not hex);
  }

  TEST_CASE( "Convert to Binary CVB: bad sign") {
    State state;
    reg(state, 5, 50);
    reg(state, 6, 900);
    state.MS[1000] = 0x00000000;
    state.MS[1004] = 0x00255941; // 1 is not a valid sign
      execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(state.TRAP == 1);
  }

  // Needs DC0 to support correction properly
  TEST_CASE( "Convert to Binary CVB: bad digit") {
    State state;
    reg(state, 5, 50);
    reg(state, 6, 900);
    state.MS[1000] = 0x00000000;
    state.MS[1004] = 0x002a594f;
      execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Convert to Binary CVB: doubleword unaligned") {
    State state;
    reg(state, 5, 0);
    reg(state, 6, 0);
    state.MS[1000] = 0x00000000;
    state.MS[1004] = 0x002a594f;
      execute(state, {0x4f756034}, "CVB 7,34(5,6)");
    REQUIRE(state.TRAP == 1);
      execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(state.TRAP == 1);
      execute(state, {0x4f756031}, "CVB 7,31(5,6)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Convert to Binary CVB: overflow") {
    State state;
    reg(state, 5, 50);
    reg(state, 6, 900);
    state.MS[1000] = 0x00000214;
    state.MS[1004] = 0x8000000f;
      execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(state.TRAP == 1);
    REQUIRE(reg(state, 7) == 2148000000); // Note: decimal, not hex);
  }

  TEST_CASE( "Convert to Binary CVB: big overflow") {
    State state;
    reg(state, 5, 50);
    reg(state, 6, 900);
    state.MS[1000] = 0x12345678;
    state.MS[1004] = 0x4800000f;
      execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Convert to Binary CVB: large") {
    State state;
    reg(state, 5, 50);
    reg(state, 6, 900);
    state.MS[1000] = 0x00000021;
    state.MS[1004] = 0x2345678f;
    execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(reg(state, 7) == 212345678); // Note: decimal, not hex);
  }

  TEST_CASE( "Convert to Binary CVB: negative") {
    State state;
    reg(state, 5, 50);
    reg(state, 6, 900);
    state.MS[1000] = 0x00000000;
    state.MS[1004] = 0x0025594d; // d is negative
    execute(state, {0x4f756032}, "CVB 7,32(5,6)");
    REQUIRE(reg(state, 7) == (-25594)); // Note: decimal, not hex);
  }

  // QE900/073C, CLF 112
  TEST_CASE( "Convert to Binary CVB") {
    State state;
    reg(state, 5, 0x100);
    reg(state, 6, 0x200);
    state.MS[0x500] = 0;
    state.MS[0x504] = 0x1234567f; // Decimal 1234567+
    execute(state, {0x4f156200}, "CVB 1,200(5,6)");
    REQUIRE(reg(state, 1) == 1234567); // Note: decimal, not hex);
  }

  TEST_CASE( "Convert to Binary CVB neg") {
    State state;
    reg(state, 5, 0x100);
    reg(state, 6, 0x200);
    state.MS[0x500] = 0;
    state.MS[0x504] = 0x1234567b; // Decimal 1234567-
    execute(state, {0x4f156200}, "CVB 1,200(5,6)");
    REQUIRE(reg(state, 1) == (-1234567)); // Note: decimal, not hex);
  }

  TEST_CASE( "Convert to Decimal CVD") {
    State state;
    // Princ Ops p142
    reg(state, 1, 0x00000f0f); // 3855 dec
    reg(state, 13, 0x00007600);
    state.AMWP = 0; // EBCDIC
    execute(state, {0x4e10d008}, "CVD 1,8(0,13)");
    REQUIRE(state.MS[0x7608] == 0x00000000);
    REQUIRE(state.MS[0x760c] == 0x0003855c);
  }

  TEST_CASE( "Convert to Decimal CVD ASCII") {
    State state;
    reg(state, 1, 0x00000f0f); // 3855 dec
    reg(state, 13, 0x00007600);
    state.AMWP = 8; // ASCII
    execute(state, {0x4e10d008}, "CVD 1,8(0,13)");
    REQUIRE(state.MS[0x7608] == 0x00000000);
    REQUIRE(state.MS[0x760c] == 0x0003855d);
  }

  TEST_CASE( "Store ST") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x100);
    reg(state, 3, 0x100);
    execute(state, {0x50123400}, "ST 1,400(2,3)");
    REQUIRE(state.MS[0x600] == 0x12345678);
  }

  TEST_CASE( "AND N") {
    State state;
    reg(state, 1, 0x11223344);
    reg(state, 2, 0x200);
    reg(state, 3, 0x300);
    state.MS[0x954] = 0x12345678;
    execute(state, {0x54123454}, "N 1,454(2,3)");
    REQUIRE(reg(state, 1) == (0x11223344 & 0x12345678));
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE( "Compare Logical CL") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x200);
    reg(state, 3, 0x300);
    state.MS[0x900] = 0x12345678;
    execute(state, {0x55123400}, "CL 1,400(2,3)");
    REQUIRE(state.CR == 0); // Equal);
  }

  TEST_CASE( "OR O") {
    State state;
    reg(state, 1, 0x11223344);
    reg(state, 2, 0x200);
    reg(state, 3, 0x300);
    state.MS[0x954] = 0x12345678;
    execute(state, {0x56123454}, "O 1,454(2,3)");
    REQUIRE(reg(state, 1) == (0x11223344 | 0x12345678));
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE( "Exclusive OR X") {
    State state;
    reg(state, 1, 0x11223344);
    reg(state, 2, 0x200);
    reg(state, 3, 0x300);
    state.MS[0x954] = 0x12345678;
    execute(state, {0x57123454}, "X 1,454(2,3)");
    REQUIRE(reg(state, 1) == (0x11223344 ^ 0x12345678));
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE( "Exclusive OR X - zero") {
    State state;
    reg(state, 1, 0x11223344);
    reg(state, 2, 0x200);
    reg(state, 3, 0x300);
    state.MS[0x954] = 0x11223344;
    execute(state, {0x57123454}, "X 1,454(2,3)");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "Load L") {
    State state;
    reg(state, 4, 0x1000);
    reg(state, 5, 0x200);
    state.MS[0x1b84] = 0x12345678;
    execute(state, {0x58345984}, "L 3,984(4,5)");
    // L 3, 984(4, 5): load R3 with mem[984+R4+R45)
    REQUIRE(reg(state, 3) == 0x12345678);
  }

  TEST_CASE( "Compare C b") {
    State state;
    reg(state, 3, 0x12345678);
    reg(state, 4, 0x1000);
    reg(state, 5, 0x200);
    state.MS[0x1b84] = 0x12345678;
    execute(state, {0x59345984}, "C 3,984(4,5)");
    REQUIRE(state.CR == 0); // Operands are equal);
  }

  TEST_CASE("Add A random") {
    State state;
      unsigned int seed = 42;
    for (int i = 0; i < testcycles; i++) {
      int n1 = rand_r(&seed);
      int n2 = rand_r(&seed);
      reg(state, 1, n1);
      state.MS[0x100] = n2;
      execute(state, {0x5a100100}, "A 1,100(0,0)");
      int sum = signed32(n1) + signed32(n2);
      if (sum >= 0x80000000 || sum < -0x80000000) {
        REQUIRE(state.CR == 3); // Overflow);
        continue;
      } else if (sum == 0) {
        REQUIRE(state.CR == 0); // Zero);
      } else if (sum > 0) {
        REQUIRE(state.CR == 2); // Positive);
      } else {
        REQUIRE(state.CR == 1); // Negative);
      }
      REQUIRE(signed32(reg(state, 1)) == sum);
    }
  }

  TEST_CASE("Subtract C random") {
    State state;
    unsigned int seed = 123;
    for (int i = 0; i < testcycles; i++) {
      int n1 = rand_r(&seed);
      int n2 = rand_r(&seed);
      reg(state, 1, n1);
      state.MS[0x100] = n2;
      execute(state, {0x5b100100}, "S 1,100(0,0)");
      int result = signed32(n1) - signed32(n2);
      if (result >= 0x80000000 || result < -0x80000000) {
        REQUIRE(state.CR == 3); // Overflow);
        continue;
      } else if (result == 0) {
        REQUIRE(state.CR == 0); // Zero);
      } else if (result > 0) {
        REQUIRE(state.CR == 2); // Positive);
      } else {
        REQUIRE(state.CR == 1); // Negative);
      }
      REQUIRE(signed32(reg(state, 1)) == result);
    }
  }

  TEST_CASE("Multiply M random") {
    State state;
      unsigned int seed = 42;
    for (int i = 0; i < testcycles; i++) {
      int n1 = rand_r(&seed);
      int n2 = rand_r(&seed);
      reg(state, 3, n1); // Note: multiplicand in reg 3 but reg 2 specified.
      state.MS[0x100] = n2;
      execute(state, {0x5c200100}, "M 2,100(0,0)");
      int desired = signed32(n1) * signed32(n2);
      int result = reg(state, 2) * pow(2., 32) + reg(state, 3);
      if (reg(state, 2) & 0x80000000) {
        // Convert 64-bit 2"s complement
        result = -((~reg(state, 2)) * pow(2., 32) + ((~reg(state, 3))) + 1);
      }
        std::ostringstream info;
        info << signed32(n1) << "*" << signed32(n2) << "=" << desired << " vs " << result << "  " << reg(state, 2) << " " << reg(state, 3);
      SECTION(info.str()) {
          REQUIRE(result == desired);
      }
      if (result != desired) break;
      // No condition code
    }
  }

  TEST_CASE("Divide D random") {
    State state;
    unsigned int seed = 124;
    for (int i = 0; i < testcycles; i++) {
      int quotient = rand_r(&seed);
      int remainder = rand_r(&seed);
      int divisor = rand_r(&seed);
      if (quotient * divisor * remainder < 0) {
        remainder = -remainder;
      }
      //int dividend = quotient * divisor + remainder;
        uint32_t n1 = 0; // XXX implement this
        uint32_t n2 = 0; // XXX
      reg(state, 2, n1);
      state.MS[0x100] = n2;
      execute(state, {0x5d200100}, "D 2,100(0,0)");
      int result = signed32(n1) * signed32(n2);
      if (result == 0) {
        REQUIRE(state.CR == 0); // Zero);
      } else if (result > 0) {
        REQUIRE(state.CR == 2); // Positive);
      } else {
        REQUIRE(state.CR == 1); // Negative);
      }
      int result0 = result / pow(2., 32);
      REQUIRE(reg(state, 2) == result0);
      int result1 = result - result0 * pow(2., 32);
      REQUIRE(reg(state, 3) == result1);
    }
  }

  TEST_CASE("Add Logical AL random") {
    State state;
    unsigned int seed = 125;
    for (int i = 0; i < testcycles; i++) {
      uint32_t n1 = rand_r(&seed);
      uint32_t n2 = rand_r(&seed);
      reg(state, 2, n1);
      state.MS[0x100] = n2;
      execute(state, {0x5e200100}, "AL 2,100(0,0)");
      uint64_t result = n1 + n2;
      int carry = 0;
      if (result >= 0x100000000) {
        carry = 1;
        result -= 0x100000000;
      }
      if (carry == 0) {
        if (result == 0) {
          REQUIRE(state.CR == 0); // Zero, no carry);
        } else {
          REQUIRE(state.CR == 1); // Nonzero, no carry);
        }
      } else {
        if (result == 0) {
          REQUIRE(state.CR == 2); // Zero, carry);
        } else {
          REQUIRE(state.CR == 3); // Nonzero, carry);
        }
      }
      REQUIRE(reg(state, 2) == result);
    }
  }

  TEST_CASE("Subtract Logical SL random") {
    State state;
    unsigned int seed = 44;
    for (int i = 0; i < testcycles; i++) {
      uint32_t n1 = rand_r(&seed);
      uint32_t n2 = rand_r(&seed);
      reg(state, 2, n1);
      state.MS[0x100] = n2;
      execute(state, {0x5f200100}, "SL 2,100(0,0)");
      uint64_t result = n1 + ((n2 ^ 0xffffffff)) + 1;
      int carry = 0;
      if (result >= 0x100000000) {
        carry = 1;
        result -= 0x100000000;
      }
      if (carry == 0) {
        if (result == 0) {
          REQUIRE(state.CR == 0); // Zero, no carry);
        } else {
          REQUIRE(state.CR == 1); // Nonzero, no carry);
        }
      } else {
        if (result == 0) {
          REQUIRE(state.CR == 2); // Zero, carry);
        } else {
          REQUIRE(state.CR == 3); // Nonzero, carry);
        }
      }
      REQUIRE(reg(state, 2) == result);
    }
  }

  TEST_CASE("Store (FP long) STD") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    execute(state, {0x60012100}, "STD 0,100(1,2)");
    REQUIRE(state.MS[0x500] == 0x12345678);
    REQUIRE(state.MS[0x504] == 0xaabbccdd);
  }

  TEST_CASE("Load (FP long) LD") {
    State state;
    state.MS[0x100] = 0x12345678;
    state.MS[0x104] = 0xaabbccdd;
    execute(state, {0x68000100}, "LD 0,100(0,0)");
    REQUIRE(fpreg(state, 0) == 0x12345678);
    REQUIRE(fpreg(state, 1) == 0xaabbccdd);
  }

  TEST_CASE("Load (FP long) LD unnormalized") {
    State state;
    state.MS[0x100] = 0x44000000;
    state.MS[0x104] = 0xaabbccdd;
    execute(state, {0x68000100}, "LD 0,100(0,0)");
    REQUIRE(fpreg(state, 0) == 0x44000000); // Stays unnormalized);
    REQUIRE(fpreg(state, 1) == 0xaabbccdd);
  }

  TEST_CASE("Compare (FP long) CD") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    state.MS[0x100] = 0x44000000;
    state.MS[0x104] = 0xaabbccdd;
    execute(state, {0x69000100}, "CD 0,100(0,0)");
    REQUIRE(state.CR == 0); // Equal);
  }

  TEST_CASE("Add N (FP long) AD") {
    State state;
    // Princ Ops 153
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x6a60d000}, "AD 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x42833345);
    REQUIRE(fpreg(state, 7) == 0x60000000);
  }

  TEST_CASE("Subtract N (FP long) SD") {
    State state;
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x6b60d000}, "SD 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x42833345);
    REQUIRE(fpreg(state, 7) == 0x60000000);
  }

  TEST_CASE("Multiply (FP long) MD") {
    State state;
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x6c60d000}, "MD 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x42833345);
  }

  TEST_CASE("Divide (FP long) DD") {
    State state;
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x6d60d000}, "DD 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x42833345);
  }

  TEST_CASE("Add U (FP long) AW") {
    State state;
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x7e60d000}, "AU 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x42833345);
  }

  TEST_CASE("Subtract U (FP long) SW") {
    State state;
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x7f60d000}, "SU 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x42833345);
  }

  TEST_CASE("Store (FP short) STE") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    state.MS[0x404] = 0x11223344;
    execute(state, {0x70012100}, "STE 0,100(1,2)");
    REQUIRE(state.MS[0x500] == 0x12345678);
    REQUIRE(state.MS[0x504] == 0x11223344);
  }

  TEST_CASE("Load (FP short) LE") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    state.MS[0x500] = 0x11223344;
    execute(state, {0x78012100}, "LE 0,100(1,2)");
    REQUIRE(fpreg(state, 0) == 0x11223344);
    REQUIRE(fpreg(state, 1) == 0xaabbccdd);
  }

  TEST_CASE("Compare (FP short) CE") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    state.MS[0x500] = 0x11223344;
    execute(state, {0x79012100}, "CE 0,100(1,2)");
    REQUIRE(fpreg(state, 0) == 0x11223344);
  }

  TEST_CASE("Add N (FP short) AE") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    state.MS[0x500] = 0x11223344;
    execute(state, {0x7a012100}, "AE 0,100(1,2)");
    REQUIRE(fpreg(state, 0) == 0x11223344);
  }

  TEST_CASE("Subtract N (FP short) SE") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    state.MS[0x500] = 0x11223344;
    execute(state, {0x7b012100}, "SE 0,100(1,2)");
    REQUIRE(fpreg(state, 0) == 0x11223344);
  }

  TEST_CASE("Multiply (FP short) ME") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    state.MS[0x500] = 0x11223344;
    execute(state, {0x7c012100}, "ME 0,100(1,2)");
    REQUIRE(fpreg(state, 0) == 0x11223344);
  }

  TEST_CASE("Divide (FP short) DE") {
    State state;
    fpreg(state, 0, 0x12345678);
    fpreg(state, 1, 0xaabbccdd);
    reg(state, 1, 0x100);
    reg(state, 2, 0x300);
    state.MS[0x500] = 0x11223344;
    execute(state, {0x7d012100}, "DE 0,100(1,2)");
    REQUIRE(fpreg(state, 0) == 0x11223344);
  }

  TEST_CASE("Add U (FP short) AU") {
    State state;
    // Princ Ops 153
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x7e60d000}, "AU 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x43083334);
  }

  TEST_CASE("Subtract U (FP short) SU") {
    State state;
    fpreg(state, 6, 0x43082100);
    fpreg(state, 7, 0x00000000);
    state.MS[0x2000] = 0x41123456;
    state.MS[0x2004] = 0x00000000;
    reg(state, 13, 0x00002000);
    execute(state, {0x7f60d000}, "SU 6,0(0, 13)");
    REQUIRE(fpreg(state, 6) == 0x43083334);
  }

  TEST_CASE("Set System Mask SSM") {
    State state;
    state.SYSMASK = 0xff;
    state.KEY = 3;
    state.AMWP = 0xe; // Privileged
    state.CR = 1;
    state.PROGMASK = 0xa;
    reg(state, 3, 0x11);
    state.MS[0x110] = 0xaabbccdd; // Access byte 1
    execute(state, {0x80ee3100}, "SSM 100(3)");
    REQUIRE(state.SYSMASK == 0xbb);
    REQUIRE(state.KEY == 0x3);
    REQUIRE(state.AMWP == 0xe);
    REQUIRE(state.CR == 0x1);
    REQUIRE(state.PROGMASK == 0xa);
    REQUIRE(state.IAR == 0x404);
  }

  TEST_CASE("Set System Mask SSM unprivileged") {
    State state;
    state.SYSMASK = 0xff;
    state.KEY = 3;
    state.AMWP = 0xf; // Unrivileged
    state.CR = 1;
    state.PROGMASK = 0xa;
      execute(state, {0x80ee3100}, "SSM 100(3)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE("Load PSW LPSW") {
    State state;
    state.AMWP = 0; // Privileged
    reg(state, 3, 0x10);
    state.MS[0x110] = 0x12345678;
    state.MS[0x114] = 0x9a123450; // Branch to 123450
    execute(state, {0x82003100}, "LPSW 100(3)");
    REQUIRE(state.SYSMASK == 0x12);
    REQUIRE(state.KEY == 0x3);
    REQUIRE(state.AMWP == 0x4);
    REQUIRE(state.CR == 0x1);
    REQUIRE(state.PROGMASK == 0xa);
    REQUIRE(state.IAR == 0x123450);
  }

  TEST_CASE( "Diagnose") {
    State state;
    reg(state, 2, 3); // Counter
    execute(state, {0x83123456}, "diagnose");
  }

  TEST_CASE("Write Direct WRD") {
    State state;
    state.AMWP = 1; // Privileged
    // Direct control not supported in this microcode
      execute(state, {0x84123456}, "WRD 456(3), 12");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE("Read Direct RDD") {
    State state;
    state.AMWP = 1; // Privileged
    // Direct control not supported in this microcode
      execute(state, {0x85123456}, "RDD 456(3), 12");
    REQUIRE(state.TRAP == 1);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index High BXH") {
    State state;
    reg(state, 1, 0x12345678); // Value
    reg(state, 4, 1); // Increment
    reg(state, 5, 0x12345678); // Comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x86142200}, "BXH 1, 4, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345679);
    REQUIRE(state.IAR == 0x1200); // Branch taken);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index High BXH decrement") {
    State state;
    reg(state, 1, 0x12345678); // Value
    reg(state, 4, 0xffffffff); // Increment -1
    reg(state, 5, 0x12345678); // Comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x86142200}, "BXH 1, 4, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345677);
    REQUIRE(state.IAR == 0x404); // Branch not taken);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index High BXH shared reg") {
    State state;
    reg(state, 1, 1); // Value
    reg(state, 3, 0x12345678); // Increment and comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x86132200}, "BXH 1, 3, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345679);
    REQUIRE(state.IAR == 0x1200); // Branch taken);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index High BXH shared reg not taken") {
    State state;
    reg(state, 1, 0xffffffff); // Value
    reg(state, 3, 0x12345678); // Increment and comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x86132200}, "BXH 1, 3, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345677);
    REQUIRE(state.IAR == 0x404); // Branch not taken);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index Low or Equal BXLE") {
    State state;
    reg(state, 1, 0x12345678); // Value
    reg(state, 4, 1); // Increment
    reg(state, 5, 0x12345678); // Comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x87142200}, "BXLE 1, 4, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345679);
    REQUIRE(state.IAR == 0x404); // Branch not taken);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index Low or Equal BXLE decrement") {
    State state;
    reg(state, 1, 0x12345678); // Value
    reg(state, 4, 0xffffffff); // Increment -1
    reg(state, 5, 0x12345678); // Comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x87142200}, "BXLE 1, 4, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345677);
    REQUIRE(state.IAR == 0x1200); // Branch taken);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index Low or Equal BXLE shared reg") {
    State state;
    reg(state, 1, 1); // Value
    reg(state, 3, 0x12345678); // Increment and comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x87132200}, "BXLE 1, 3, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345679);
    REQUIRE(state.IAR == 0x404); // Branch not taken);
  }

  // Add increment to first operand, compare with odd register after R3
  TEST_CASE("Branch on index Low or Equal BXLE shared reg taken") {
    State state;
    reg(state, 1, 0xffffffff); // Value
    reg(state, 3, 0x12345678); // Increment and comparand
    reg(state, 2, 0x1000); // Branch target
    execute(state, {0x87132200}, "BXLE 1, 3, 200(2)");
    REQUIRE(reg(state, 1) == 0x12345677);
    REQUIRE(state.IAR == 0x1200); // Branch taken);
  }

  TEST_CASE( "Shift Left Single SLL") {
    State state;
    reg(state, 1, 0x82345678);
    reg(state, 2, 0x12340003); // Shift 3 bits
    execute(state, {0x891f2100}, "SLL 1,100(2)");
    REQUIRE(reg(state, 1) == 0x11a2b3c0);
  }

  TEST_CASE( "Shift Right Single SRL") {
    State state;
    reg(state, 1, 0x82345678);
    reg(state, 2, 0x12340003); // Shift 3 bits
    execute(state, {0x881f2100}, "SRL 1,100(2)");
    REQUIRE(reg(state, 1) == 0x82345678 >> 3);
  }

  TEST_CASE("Shift Right Single SRA") {
    State state;
    reg(state, 2, 0x11223344);
    execute(state, {0x8a2f0105}, "SRA 2,105(0)"); // Shift right 5
    REQUIRE(reg(state, 2) == 0x0089119a);
  }

  TEST_CASE("Shift Left S SLA") {
    State state;
    // From Princ Ops p143
    reg(state, 2, 0x007f0a72);
    execute(state, {0x8b2f0008}, "SLA 2,8(0)"); // Shift left 8
    REQUIRE(reg(state, 2) == 0x7f0a7200);
  }

  TEST_CASE("Shift Right Double SRDL") {
    State state;
    reg(state, 4, 0x12345678);
    reg(state, 5, 0xaabbccdd);
    execute(state, {0x8c4f0118}, "SRDL 4,118(0)"); // Shift right 24 (x18)
    REQUIRE(reg(state, 4) == 0x00000012);
    REQUIRE(reg(state, 5) == 0x345678aa);
  }

  TEST_CASE("Shift Left Double SLDL") {
    State state;
    reg(state, 4, 0x12345678);
    reg(state, 5, 0xaabbccdd);
    reg(state, 6, 8);
    execute(state, {0x8d4f6100}, "SLDL 4,100(6)"); // Shift left 8
    REQUIRE(reg(state, 4) == 0x345678aa);
    REQUIRE(reg(state, 5) == 0xbbccdd00);
  }

  TEST_CASE("Shift Left Double SLDL large") {
    State state;
    reg(state, 4, 0x12345678);
    reg(state, 5, 0x00010001);
    execute(state, {0x8d4f051b}, "SLDL 4,51b(0)"); // Shift left 27
    REQUIRE(reg(state, 4) == 0xc0000800);
    REQUIRE(reg(state, 5) == 0x08000000);
  }

  TEST_CASE("Shift Left Double SLDL odd") {
    State state;
      execute(state, {0x8d1f2100}, "SLDL 1,100(2)");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE("Shift Right D SRDA positive") {
    State state;
    reg(state, 4, 0x12345678);
    reg(state, 5, 0xaabbccdd);
    execute(state, {0x8e4f0118}, "SRDA 4,118(0)"); // Shift right 24 (x18)
    REQUIRE(reg(state, 4) == 0x00000012);
    REQUIRE(reg(state, 5) == 0x345678aa);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE("Shift Right D SRDA zero") {
    State state;
    reg(state, 4, 0x02345678);
    reg(state, 5, 0xaabbccdd);
    execute(state, {0x8e4f013c}, "SRDA 4,13c(0)"); // Shift right 60 (x3c)
    REQUIRE(reg(state, 4) == 0x00000000);
    REQUIRE(reg(state, 5) == 0x00000000);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE("Shift Right D SRDA negative") {
    State state;
    reg(state, 4, 0x92345678);
    reg(state, 5, 0xaabbccdd);
    execute(state, {0x8e4f0118}, "SRDA 4,118(0)"); // Shift right 24 (x18)
    REQUIRE(reg(state, 4) == 0xffffff92);
    REQUIRE(reg(state, 5) == 0x345678aa);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE("Shift Left D SLDA") {
    State state;
    // From Princ Ops p143
    reg(state, 2, 0x007f0a72);
    reg(state, 3, 0xfedcba98);
    execute(state, {0x8f2f001f}, "SLDA 2,1f(0)");
    REQUIRE(reg(state, 2) == 0x7f6e5d4c);
    REQUIRE(reg(state, 3) == 0x00000000);
  }

  TEST_CASE("Store Multiple STM") {
    State state;
    // From Princ Ops p143
    reg(state, 14, 0x00002563);
    reg(state, 15, 0x00012736);
    reg(state, 0, 0x12430062);
    reg(state, 1, 0x73261257);
    reg(state, 6, 0x00004000);
    execute(state, {0x90e16050}, "STM 14,1,50(6)");
    REQUIRE(state.MS[0x4050] == 0x00002563);
    REQUIRE(state.MS[0x4054] == 0x00012736);
    REQUIRE(state.MS[0x4058] == 0x12430062);
    REQUIRE(state.MS[0x405c] == 0x73261257);
  }

  TEST_CASE("Test Under Mask TM") {
    State state;
    // From Princ Ops p147
    state.MS[0x9998] = 0xaafbaaaa;
    reg(state, 9, 0x00009990);
    execute(state, {0x91c39009}, "TM 9(9),c3");
    REQUIRE(state.CR == 3);
  }

  TEST_CASE("Test Under Mask TM b") {
    State state;
    // From Princ Ops p147
    state.MS[0x9998] = 0xaa3caaaa;
    reg(state, 9, 0x00009990);
    execute(state, {0x91c39009}, "TM 9(9),c3");
    REQUIRE(state.CR == 0);
  }

  TEST_CASE("Move immediate MVI") {
    State state;
    reg(state, 1, 0x3456);
    state.CR = 2;
    state.MS[0x3464] = 0x12345678;
    execute(state, {0x92421010}, "MVI 10(1),42");
    REQUIRE(state.MS[0x3464] == 0x12344278);
    REQUIRE(state.CR == 2); // Unchanged);
  }

  TEST_CASE("AND immediate NI") {
    State state;
    reg(state, 1, 0x3456);
    state.MS[0x3464] = 0x12345678;
    execute(state, {0x94f01010}, "NI 10(1),f0");
    REQUIRE(state.MS[0x3464] == 0x12345078);
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE("AND immediate NI - zero") {
    State state;
    reg(state, 1, 0x3456);
    state.MS[0x3464] = 0x12345678;
    execute(state, {0x94001010}, "NI 10(1),0");
    REQUIRE(state.MS[0x3464] == 0x12340078);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE("Compare Logical immediate CLI - equal") {
    State state;
    reg(state, 1, 0x3456);
    state.MS[0x3464] = 0x12345678;
    execute(state, {0x95561010}, "CLI 10(1),56");
    REQUIRE(state.CR == 0); // Equal);
  }

  TEST_CASE("Compare Logical immediate CLI - low") {
    State state;
    reg(state, 1, 0x3456);
    state.MS[0x3464] = 0x12345678;
    execute(state, {0x95ff1010}, "CLI 10(1),ff");
    REQUIRE(state.CR == 1); // First operand is low);
  }

  TEST_CASE("Compare Logical immediate CLI - all") {
    State state;
    for (int i = 0; i < 256 && i < testcycles * 3; i++) {
      reg(state, 1, 0x3456);
      state.MS[0x3464] = 0x12345678;
      std::ostringstream instr;
      instr << "CLI 10(1)," << std::hex << i;
      execute(state, {0x95001010 | (i << 16)}, instr.str());
      if (i == 0x56) {
        REQUIRE(state.CR == 0); // Equal);
      } else if (i < 0x56) {
        REQUIRE(state.CR == 2); // First operand is high);
      } else {
        REQUIRE(state.CR == 1); // First operand is low);
      }
    }
  }

  TEST_CASE("OR immediate OI") {
    State state;
    reg(state, 1, 2);
    state.MS[0x1000] = 0x12345678;
    execute(state, {0x96421fff}, "OI fff(1),42");
    REQUIRE(state.MS[0x1000] == 0x12765678);
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE("Exclusive OR immediate XI") {
    State state;
    reg(state, 0, 0x100); // Not used
    state.MS[0x120] = 0x12345678;
    execute(state, {0x970f0123}, "XI 123(0),f");
    REQUIRE(state.MS[0x120] == 0x12345677);
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE("Start I/O SIO") {
    State state;
    execute(state, {0x9cff0234}, "SIO 234(0)");
  }

  TEST_CASE("Test I/O TIO") {
    State state;
    execute(state, {0x9dff0234}, "TIO 234(0)");
    REQUIRE(chctl_w == 42);
  }

  TEST_CASE("Halt I/O HIO") {
    State state;
    execute(state, {0x9eff0234}, "HIO 234(0)");
    REQUIRE(chctl_w == 42);
  }

  TEST_CASE("Test Channel TCH") {
    State state;
    execute(state, {0x9fff0234}, "TCH 234(0)");
    REQUIRE(chctl_w == 42);
  }

  TEST_CASE("Move Numeric MVN") {
    State state;
    // From Princ Ops p144
    state.MS[0x7090] = 0xc1c2c3c4;
    state.MS[0x7094] = 0xc5c6c7c8;
    state.MS[0x7040] = 0xaaf0f1f2;
    state.MS[0x7044] = 0xf3f4f5f6;
    state.MS[0x7048] = 0xf7f8aaaa;
    reg(state, 14, 0x00007090);
    reg(state, 15, 0x00007040);
    execute(state, {0xd103f001, 0xe000aaaa}, "MVN 1(4,15),0(14)");
    REQUIRE(state.MS[0x7090] == 0xc1c2c3c4);
    REQUIRE(state.MS[0x7040] == 0xaaf1f2f3);
    REQUIRE(state.MS[0x7044] == 0xf4f4f5f6);
    REQUIRE(state.MS[0x7048] == 0xf7f8aaaa);
  }

  TEST_CASE( "Move MVC") {
    State state;
    state.MS[0x100] = 0x12345678;
    state.MS[0x200] = 0x11223344;
    execute(state, {0xd2030100, 0x02000000}, "MVC 100(4,0),200(0)"); // Move 4 bytes from 200 to 100
    REQUIRE(state.MS[0x100] == 0x11223344);
    REQUIRE(state.MS[0x200] == 0x11223344); // Unchanged);
  }

  TEST_CASE( "Move MVC 2") {
    State state;
    state.MS[0x100] = 0x12345678;
    state.MS[0x104] = 0xabcdef01;
    reg(state, 1, 2);
    reg(state, 2, 0);
    execute(state, {0xd2011100, 0x01050000}, "MVC 100(2,1),105(0)"); // Move 2 bytes from 105 to 102
    REQUIRE(state.MS[0x100] == 0x1234cdef);
    REQUIRE(state.MS[0x104] == 0xabcdef01); // Unchanged);
  }

  TEST_CASE("Move Zone MVZ") {
    State state;
    // From Princ Ops page 144
    state.MS[0x800] = 0xf1c2f3c4;
    state.MS[0x804] = 0xf5c6aabb;
    reg(state, 15, 0x00000800);
    execute(state, {0xd304f001, 0xf000aabb}, "MVZ 1(5,15),0(15)");
    REQUIRE(state.MS[0x800] == 0xf1f2f3f4);
    REQUIRE(state.MS[0x804] == 0xf5f6aabb);
  }

  TEST_CASE("AND NC") {
    State state;
    state.MS[0x358] = 0x00001790;
    state.MS[0x360] = 0x00001401;
    reg(state, 7, 0x00000358);
    execute(state, {0xd4037000, 0x7008aaaa}, "NC 0(4,7),8(7)");
    REQUIRE(state.MS[0x358] == 0x00001400);
  }

  TEST_CASE( "Compare Logical CLC - equal") {
    State state;
    reg(state, 1, 0x100);
    reg(state, 2, 0x100);
    state.MS[0x200] = 0x12345633;
    state.MS[0x300] = 0x12345644;
    execute(state, {0xd5021100, 0x22000000}, "CLC 100(3,1),200(2)");
    REQUIRE(state.CR == 0); // equal);
  }

  TEST_CASE( "Compare Logical CLC") {
    State state;
    reg(state, 1, 0x100);
    reg(state, 2, 0x100);
    state.MS[0x200] = 0x12345678;
    state.MS[0x300] = 0x12345678;
    // 123456 vs 345678 because of offset
    execute(state, {0xd5021100, 0x22010000}, "CLC 100(3,1),201(2)");
    REQUIRE(state.CR == 1); // first operand is low);
  }

  TEST_CASE("OR OC") {
    State state;
    state.MS[0x358] = 0x00001790;
    state.MS[0x360] = 0x00001401;
    reg(state, 7, 0x00000358);
    execute(state, {0xd6037000, 0x7008aaaa}, "OC 0(4,7),8(7)");
    REQUIRE(state.MS[0x358] == 0x00001791);
  }

  TEST_CASE("Exclusive OR XC") {
    State state;
    // From Princ Ops p146
    state.MS[0x358] = 0x00001790;
    state.MS[0x360] = 0x00001401;
    reg(state, 7, 0x00000358);
    execute(state, {0xd7037000, 0x7008aaaa}, "XC 0(4,7),8(7)");
    REQUIRE(state.MS[0x358] == 0x00000391);
    execute(state, {0xd7037008, 0x7000aaaa}, "XC 8(4,7),0(7)");
    REQUIRE(state.MS[0x360] == 0x00001790);
    execute(state, {0xd7037000, 0x7008aaaa}, "XC 0(4,7),8(7)");
    REQUIRE(state.MS[0x358] == 0x00001401);
  }

  TEST_CASE("Translate TR") {
    State state;
    // Based on Princ Ops p147
    for (int i = 0; i < 256; i += 4) {
      // Table increments each char by 3. Don"t worry about wrapping.
      state.MS[0x1000 + i] = (((i + 3) << 24) | ((i + 4) << 16) | ((i + 5) << 8) | (i + 6));
    }
    state.MS[0x2100] = 0x12345678;
    state.MS[0x2104] = 0xabcdef01;
    state.MS[0x2108] = 0x11223344;
    state.MS[0x210c] = 0x55667788;
    state.MS[0x2110] = 0x99aabbcc;
    reg(state, 12, 0x00002100);
    reg(state, 15, 0x00001000);
    execute(state, {0xdc13c000, 0xf000aaaa}, "TR 0(20,12),0(15)");
    REQUIRE(state.MS[0x2100] == 0x1537597b);
    REQUIRE(state.MS[0x2104] == 0xaed0f204);
    REQUIRE(state.MS[0x2108] == 0x14253647);
    REQUIRE(state.MS[0x210c] == 0x58697a8b);
    REQUIRE(state.MS[0x2110] == 0x9cadbecf);
  }

  TEST_CASE("Translate and Test TRT") {
    State state;
    // Based on Princ Ops p147
    for (int i = 0; i < 256; i += 4) {
      state.MS[0x1000 + i] = 0;
    }
    state.MS[0x2020] = 0x10203040;

    state.MS[0x3000] = 0x12345621; // 21 will match table entry 20
    state.MS[0x3004] = 0x11223344;
    state.MS[0x3008] = 0x55667788;
    state.MS[0x300c] = 0x99aabbcc;
    execute(state, {0xdd0f1000, 0xf000aaaa}, "TRT 0(16,1),0(15)");
    reg(state, 1, 0x00003003); // Match at 3003
    reg(state, 2, 0x00000020); // Function value from table
    REQUIRE(state.CR == 1); // not completed);
  }

  TEST_CASE("Edit ED") {
    State state;
    // Princ Ops page 149
    state.MS[0x1200] = 0x0257426c;
    state.MS[0x1000] = 0x4020206b;
    state.MS[0x1004] = 0x2020214b;
    state.MS[0x1008] = 0x202040c3;
    state.MS[0x100c] = 0xd9ffffff;
    execute(state, {0xde0cc000, 0xc200aaaa}, "ED 0(13,12),200(12)");
    REQUIRE(state.MS[0x1000] == 0x4040f26b);
    REQUIRE(state.MS[0x1004] == 0xf5f7f44b);
    REQUIRE(state.MS[0x1008] == 0xf2f64040);
    REQUIRE(state.MS[0x1008] == 0x40ffffff);
    REQUIRE(state.CR == 2); // Result greater than zero);
  }

  TEST_CASE("Edit ED 2") {
    State state;
    // Princ Ops page 149
    state.MS[0x1200] = 0x0000026d;
    state.MS[0x1000] = 0x4020206b;
    state.MS[0x1004] = 0x2020214b;
    state.MS[0x1008] = 0x202040c3;
    state.MS[0x100c] = 0xd9ffffff;
    execute(state, {0xde0cc000, 0xc200aaaa}, "ED 0(13,12),200(12)");
    REQUIRE(state.MS[0x1000] == 0x40404040);
    REQUIRE(state.MS[0x1004] == 0x4040404b);
    REQUIRE(state.MS[0x1008] == 0xf2f640c3);
    REQUIRE(state.MS[0x1008] == 0xd9ffffff);
    REQUIRE(state.CR == 1); // Result less than zero);
  }

  TEST_CASE("Edit and Mark EDMK") {
    State state;
    reg(state, 1, 0xaabbccdd);
    state.MS[0x1200] = 0x0000026d;
    state.MS[0x1000] = 0x4020206b;
    state.MS[0x1004] = 0x2020214b;
    state.MS[0x1008] = 0x202040c3;
    state.MS[0x100c] = 0xd9ffffff;
    execute(state, {0xde0cc000, 0xc200aaaa}, "ED 0(13,12),200(12)");
    REQUIRE(state.MS[0x1000] == 0x40404040);
    REQUIRE(state.MS[0x1004] == 0x4040404b);
    REQUIRE(state.MS[0x1008] == 0xf2f640c3);
    REQUIRE(state.MS[0x1008] == 0xd9ffffff);
    REQUIRE(state.CR == 1); // Result less than zero);
    REQUIRE(reg(state, 1) == 0xaa001000); // Need to adjust this address);
  }

  TEST_CASE("Move with Offset MVO") {
    State state;
    // Princ Ops 152
    reg(state, 12, 0x00005600);
    reg(state, 15, 0x00004500);
    state.MS[0x5600] = 0x7788990c;
    state.MS[0x4500] = 0x123456ff;
    execute(state, {0xf132c000, 0xf0000000}, "MVO 0(4, 12), 0(3, 15)");
    REQUIRE(state.MS[0x5600] ==  0x0123456c);
  }

  TEST_CASE("Pack PACK") {
    State state;
    // Princ Ops p151
    reg(state, 12, 0x00001000);
    state.MS[0x1000] = 0xf1f2f3f4;
    state.MS[0x1004] = 0xc5000000;
    execute(state, {0xf244c000, 0xc0000000}, "PACK 0(5, 12), 0(5, 12)");
    REQUIRE(state.MS[0x1000] ==  0x00001234);
    REQUIRE(state.MS[0x1004] ==  0x5c000000);
  }

  TEST_CASE("Unpack UNPK") {
    State state;
    // Princ Ops p151
    reg(state, 12, 0x00001000);
    reg(state, 13, 0x00002500);
    state.MS[0x2500] = 0xaa12345d;
    execute(state, {0xf342c000, 0xd0010000}, "UNPK 0(5, 12), 1(3, 13)");
    REQUIRE(state.MS[0x1000] ==  0xf1f2f3f4);
    REQUIRE(state.MS[0x1004] ==  0xd5000000);
  }

  TEST_CASE( "Zero and Add ZAP") {
    State state;
    // Princ Ops p150
    reg(state, 9, 0x00004000);
    state.MS[0x4000] = 0x12345678;
    state.MS[0x4004] = 0x90aaaaaa;
    state.MS[0x4500] = 0x38460dff;
    execute(state, {0xf8429000, 0x95000000}, "ZAP 0(5, 9), 500(3, 9)");
    REQUIRE(state.MS[0x4000] ==  0x00003846);
    REQUIRE(state.MS[0x4004] ==  0x0daaaaaa);
    REQUIRE(state.CR == 1); // Result less than zero);
  }

  TEST_CASE( "Zero and Add ZAP -short ") {
    State state;
    state.AMWP = 8; // ASCII
    state.MS[0x100] = 0x2a000000; // 2+
    state.MS[0x200] = 0x3a000000; // 3+
    execute(state, {0xf8000100, 0x02000000}, "ZAP 100(1, 0), 200(1, 0)");
    REQUIRE(state.MS[0x100] ==  0x3a000000); // 3+);
  }

  TEST_CASE( "Zero and Add ZAP offset") {
    State state;
    state.AMWP = 8; // ASCII
    state.MS[0x100] = 0x002a0000; // 2+
    state.MS[0x200] = 0x00003a00; // 3+
    execute(state, {0xf8000101, 0x02020000}, "ZAP 101(1, 0), 202(1, 0)");
    REQUIRE(state.MS[0x100] ==  0x003a0000); // 3+);
  }

  TEST_CASE("Compare decimal CP") {
    State state;
    // Princ Op page 150
    reg(state, 12, 0x00000600);
    reg(state, 13, 0x00000400);
    state.MS[0x700] = 0x1725356d;
    state.MS[0x500] = 0x0672142d;;
    execute(state, {0xf933c100, 0xd1000000}, "CP 100(4, 12), 100(4, 13)");
    REQUIRE(state.CR == 1); // First lower);
  }

  TEST_CASE("Compare decimal CP 0") {
    State state;
    reg(state, 12, 0x00000600);
    reg(state, 13, 0x00000400);
    state.MS[0x700] = 0x1725356d;
    state.MS[0x500] = 0x00172535;
    state.MS[0x504] = 0x6d000000;
    execute(state, {0xf933c100, 0xd1010000}, "CP 100(4, 12), 101(4, 13)");
    REQUIRE(state.CR == 0); // Equal);
  }

  TEST_CASE("Compare decimal CP 3") {
    State state;
    reg(state, 12, 0x00000600);
    reg(state, 13, 0x00000400);
    state.MS[0x700] = 0x1725346d;
    state.MS[0x500] = 0x00172535;
    state.MS[0x504] = 0x6d000000;
    execute(state, {0xf933c100, 0xd1010000}, "CP 100(4, 12), 101(4, 13)");
    REQUIRE(state.CR == 2); // First higher);
  }

  TEST_CASE("Add AP") {
    State state;
    // PrincOps p 150
    reg(state, 12, 0x00002000);
    reg(state, 13, 0x000004fd);
    state.MS[0x2000] = 0x38460d00;
    state.MS[0x500] = 0x0112345c;
    execute(state, {0xfa23c000, 0xd0030000}, "AP 0(3, 12), 3(4, 13)");
    REQUIRE(state.MS[0x2000] ==  0x73885c00);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE("Subtract decimal SP") {
    State state;
    reg(state, 12, 0x00002000);
    reg(state, 13, 0x000004fd);
    state.MS[0x2000] = 0x38460c00; // arg1
    state.MS[0x500] = 0x0112345c; // arg2
    execute(state, {0xfb23c000, 0xd0030000}, "SP 0(3, 12), 3(4, 13)");
    REQUIRE(state.MS[0x2000] ==  0x73885d00);
    REQUIRE(state.CR == 1); // Negative);
  }

  TEST_CASE("Multiply MP") {
    State state;
    // PrincOps p 151
    reg(state, 4, 0x00001200);
    reg(state, 6, 0x00000500);
    state.MS[0x1200] = 0xffff3846;
    state.MS[0x1204] = 0x0dffffff;
    state.MS[0x500] = 0x321dffff;
    execute(state, {0xfc414100, 0x60000000}, "MP 100(5, 4), 0(2, 6)");
    REQUIRE(state.MS[0x1300] ==  0x01234566);
    REQUIRE(state.MS[0x1304] ==  0x0c000000);
    REQUIRE(state.CR == 2); // Positive);
  }

  TEST_CASE("Divide DP") {
    State state;
    // PrincOps p 151
    reg(state, 12, 0x00002000);
    reg(state, 13, 0x00003000);
    state.MS[0x2000] = 0x01234567;
    state.MS[0x2004] = 0x8cffffff;
    state.MS[0x3000] = 0x321dffff;
    execute(state, {0xfd41c000, 0xd0000000}, "DP 0(5, 12), 0(2, 13)");
    REQUIRE(state.MS[0x2000] ==  0x38460d01);
    REQUIRE(state.MS[0x2004] ==  0x8cffffff);
  }

  TEST_CASE( "Load Multiple LM") {
    State state;
    reg(state, 3, 0x10);
    state.MS[0x110] = 0x12345678;
    state.MS[0x114] = 0x11223344;
    state.MS[0x118] = 0x55667788;
    state.MS[0x11c] = 0x99aabbcc;
    execute(state, {0x98253100}, "LM 2,5,100(3)");
    // Load registers 2 through 5 starting at 0x110
    REQUIRE(reg(state, 2) == 0x12345678);
    REQUIRE(reg(state, 3) == 0x11223344);
    REQUIRE(reg(state, 4) == 0x55667788);
    REQUIRE(reg(state, 5) == 0x99aabbcc);
  }

  TEST_CASE( "Move MVI") {
    State state;
    state.MS[0x100] = 0x11223344;
    reg(state, 1, 1);
    execute(state, {0x92551100}, "MVI 100(1),55"); // Move byte 55 to location 101
    REQUIRE(state.MS[0x100] == 0x11553344);
  }

  TEST_CASE( "Compare Logical CLR") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x12345678);
    execute(state, {0x15120000}, "CLR 1,2");
    REQUIRE(state.CR == 0); // equal);

    reg(state, 1, 0x12345678);
    reg(state, 2, 0x12345679);
    execute(state, {0x15120000}, "CLR 1,2");
    REQUIRE(state.CR == 1); // first operand is low);

    reg(state, 1, 0x12345679);
    reg(state, 2, 0x12345678);
    execute(state, {0x15120000}, "CLR 1,2");
    REQUIRE(state.CR == 2); // first operand is high);

    reg(state, 1, 0x7fffffff);
    reg(state, 2, 0x8fffffff);
    execute(state, {0x15120000}, "CLR 1,2");
    REQUIRE(state.CR == 1); // first operand is low);
  }

  TEST_CASE( "Compare Logical CL b") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0x100);
    reg(state, 3, 0x100);
    state.MS[0x300] = 0x12345678;
    execute(state, {0x55123100}, "CL 1,100(2,3)");
    REQUIRE(state.CR == 0); // equal);
  }

  TEST_CASE( "And NR") {
    State state;
    reg(state, 1, 0xff00ff00);
    reg(state, 2, 0x12345678);
    execute(state, {0x14120000}, "NR 1,2");
    REQUIRE(reg(state, 1) == 0x12005600);
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE( "And NR 0") {
    State state;
    reg(state, 1, 0x12345678);
    reg(state, 2, 0xedcba987);
    execute(state, {0x14120000}, "NR 1,2");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.CR == 0); // Zero);
  }

  TEST_CASE( "Or OR") {
    State state;
    reg(state, 1, 0xff00ff00);
    reg(state, 2, 0x12345678);
    execute(state, {0x16120000}, "OR 1,2");
    REQUIRE(reg(state, 1) == 0xff34ff78);
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE( "Exclusive or XR") {
    State state;
    reg(state, 1, 0xff00ff00);
    reg(state, 2, 0x12345678);
    execute(state, {0x17120000}, "XR 1,2");
    REQUIRE(reg(state, 1) == 0xed34a978);
    REQUIRE(state.CR == 1); // Not zero);
  }

  TEST_CASE( "Shift Left Single SLL intious") {
    State state;
    for (int i = 0; i < testcycles; i++) {
      reg(state, 1, 1);
      reg(state, 2, 0x12340000 + i); // Shift i bits
      execute(state, {0x891f2100}, "SLL 1,100(2)");
      SECTION("Shift by " + std::to_string(i)) {
          REQUIRE(reg(state, 1) == (uint32_t)(1 << i));
      }
    }
  }

  TEST_CASE( "Branch on condition BCR") {
    State state;
    reg(state, 1, 0x12345678); // Branch destination
    state.CR = 0;
    execute(state, {0x07810000}, "BCR 8,1");
    REQUIRE(state.IAR == 0x00345678);
  }

  TEST_CASE( "Branch on condition BCR, always taken") {
    State state;
    reg(state, 1, 0x12345678); // Branch destination
    state.CR = 0;
    execute(state, {0x07f10000}, "BCR 15,1"); // always
    REQUIRE(state.IAR == 0x00345678);
  }

  TEST_CASE( "Branch on condition BCR, not taken") {
    State state;
    reg(state, 1, 0x12345678); // Branch destination
    state.CR = 1;
    execute(state, {0x07810000}, "BCR 8,1");
    REQUIRE(state.IAR == 0x402);
  }

  TEST_CASE( "Branch and link BALR") {
    State state;
    state.ILC = 2; // overwritten with 1
    state.CR = 3;
    state.PROGMASK = 0xa;
    reg(state, 2, 0x12345678); // Branch destination
    execute(state, {0x05120000}, "BALR 1,2");
    REQUIRE(reg(state, 1) == 0x7a000402); // low-order PSW: ILC, CR, PROGMASK, return IAR);
    REQUIRE(state.IAR == 0x00345678);
  }

  TEST_CASE( "Branch and link BALR -not taken") {
    State state;
    state.ILC = 2; // overwritten with 1
    state.CR = 3;
    state.PROGMASK = 0xa;
    execute(state, {0x05100000}, "BALR 1,0");
    REQUIRE(reg(state, 1) == 0x7a000402); // low-order PSW: ILC, CR, PROGMASK, return IAR);
    REQUIRE(state.IAR == 0x402);
  }

  TEST_CASE( "Branch on Count BCTR - taken") {
    State state;
    reg(state, 1, 3); // Counter
    reg(state, 2, 0x12345678); // Branch destination
    execute(state, {0x06120000}, "BCTR 1,2");
    REQUIRE(reg(state, 1) == 2);
    REQUIRE(state.IAR == 0x00345678);
  }

  TEST_CASE( "Branch on Count BCTR - taken, negative") {
    State state;
    reg(state, 1, 0); // Counter
    reg(state, 2, 0x12345678); // Branch destination
    execute(state, {0x06120000}, "BCTR 1,2");
    REQUIRE(reg(state, 1) == 0xffffffff);
    REQUIRE(state.IAR == 0x00345678);
  }

  TEST_CASE( "Branch on Count BCTR - not taken") {
    State state;
    reg(state, 1, 1); // Counter
    reg(state, 2, 0x12345678); // Branch destination
    execute(state, {0x06120000}, "BCTR 1,2");
    REQUIRE(reg(state, 1) == 0);
    REQUIRE(state.IAR == 0x402);
  }

  TEST_CASE( "Set Program Mask SPM") {
    State state;
    reg(state, 1, 0x12345678); // Mask 2
    execute(state, {0x041f0000}, "SPM 1");
    REQUIRE(state.CR == 0x1);
    REQUIRE(state.PROGMASK == 0x2);
  }

  TEST_CASE( "Supervisor Call SVC") {
    State state;
    // Need more testing here
      execute(state, {0x0a120000}, "SVC 12");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Set Storage Key SSK - no priv") {
    State state;
    state.AMWP = 0; // Privileged
      execute(state, {0x08120000}, "SSK 1,2");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Set Storage Key SSK - priv") {
    State state;
    state.AMWP = 0; // Privileged
    reg(state, 1, 0x11223344); // Key
    reg(state, 2, 0x00005670); // Address: last 4 bits must be 0
    execute(state, {0x08120000}, "SSK 1,2");
    REQUIRE(state.KEYS[(0x00005678 & 0x00fff800) >> 11] == 4);
  }

  TEST_CASE( "Set Storage Key SSK - unaligned") {
    State state;
    state.AMWP = 0; // Privileged
    reg(state, 1, 0x11223344); // Key
    reg(state, 2, 0x12345674); // Unaligned: last 4 bits not 0
      execute(state, {0x08120000}, "SSK 1,2");
    REQUIRE(state.TRAP == 1);
  }

  // ISK reads the storage key
  TEST_CASE( "Insert Storage Key ISK -priv") {
    State state;
    state.AMWP = 0; // Privileged
    state.KEYS[(0x00005670 & 0x00fff800) >> 11] = 2;
    reg(state, 1, 0x89abcdef);
    reg(state, 2, 0x00005670); // Aligned: last 4 bits 0
    execute(state, {0x09120000}, "ISK 1,2");
    REQUIRE(reg(state, 1) == 0x89abcd20);
  }

  TEST_CASE( "Insert Storage Key ISK -no priv") {
    State state;
    state.AMWP = 1; // Unprivileged
    state.KEYS[(0x12345670 & 0x00fff800) >> 11] = 2;
    reg(state, 1, 0xaabbccdd);
    reg(state, 2, 0x12345674); // Unaligned: last 4 bits not 0
      execute(state, {0x09120000}, "ISK 1,2");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Insert Storage Key ISK -unaligned") {
    State state;
    state.AMWP = 0; // Privileged
    state.KEYS[(0x12345670 & 0x00fff800) >> 11] = 2;
    reg(state, 1, 0xaabbccdd);
    reg(state, 2, 0x12345674); // Unaligned: last 4 bits not 0
      execute(state, {0x09120000}, "ISK 1,2");
    REQUIRE(state.TRAP == 1);
  }

  TEST_CASE( "Test and Set - not set TS") {
    State state;
    reg(state, 2, 2); // Index
    state.MS[0x100] = 0x83857789; // 102 top bit not set
    execute(state, {0x93002100}, "TS 100(2)");
    REQUIRE(state.CR == 0); // Not set);
    REQUIRE(state.MS[0x100] == 0x8385ff89);
  }

  TEST_CASE( "Test and Set - set TS") {
    State state;
    reg(state, 2, 2); // Index
    state.MS[0x100] = 0x8385c789; // 102 top bit set
    execute(state, {0x93002100}, "TS 100(2)");
    REQUIRE(state.CR == 1); // Set);
    REQUIRE(state.MS[0x100] == 0x8385ff89);
  }
