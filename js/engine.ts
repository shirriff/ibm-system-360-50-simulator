// The 360 microcode simulator engine

// state is the current processor state
// entry is the ROS entry
// Returns message if any
function cycle(state: {[key: number]: any}, entry: {[key: string]: number}) : string {
  try {
    lsHilitePos = -1; // Reset the LS highlight
    state['ROS'] = entry['ROS'] // The raw ROS bits
    adderLX(state, entry);
    adderRY(state, entry);
    adderDG(state, entry);
    adderT(state, entry);

    state['PREV2ROAR'] = state['PREVROAR']
    state['PREVROAR'] = state['ROAR']
    roar(state, entry); // Need roar before mover to get old W, see 2B7. Need before localStorage read
    roarAB(state, entry);
    roarBB(state, entry);
    roarZN(state, entry);

    moverU(state, entry);
    moverV(state, entry);
    moverWL(state, entry);
    moverWR(state, entry);
    var msg = adderAL(state, entry); // Finalizes T
    stat(state, entry);
    storeMover(state, entry);
    iar(state, entry);
    iar2(state, entry); // iar operations after mover
    counters(state, entry); // Need counters after mover, see QK801:0992
    localStorageLSAR(state, entry); // Need to do mover before reading localStorage 0126
    var msg2 = adderLatch(state, entry);
    localStore(state, entry); // Need to do mover before reading localStorage 0126. Need to do this after R is written. See QB730:0220
    if (msg) {
      console.log(msg);
    }
    if (msg2) {
      console.log(msg2);
    }
    return msg || msg2;
  } catch (e) {
    if (e.message == 'TRAP') {
      state['TRAP'] = 1; // For testing
      return 'Trap to ' + state['ROAR'];
    } else {
      console.log('Unexpected exception ' + e);
      throw e; // Unexpected exception
    }
  }
}

// PSW = SYSMASK(8), KEY(4), AMWP(4), IRUPT(16);   ILC(2), CR(2), PROGMASK(4), IAR(24)

// Sets state['XG'] based on entry['LX'] and TC
function adderLX(state: {[key: string]: any}, entry: {[key: string]: number}): void {
  var xg = 0;
  switch (entry['LX']) { // left input to adder [XG]
    case 0: // No adder input
      xg = 0;
      break;
    case 1: // L
      xg = state['L'];
      break;
    case 2: // SGN
      xg = 0x80000000; // Sign bit
      break;
    case 3: // E  // E is shifted left one bit
      xg = entry['CE'] << 1;
      break;
    case 4: // LRL // L23→XG01 QT115/0189, QC301/003F
      // and L(16-13) to M(16-31) via BUS (0-15) LRL→MHL QE580/070b
      xg = ((state['L'] & 0xffff) << 16) >>> 0;
      break;
    case 5: // LWA  For address subtraction
      xg = (state['L'] | 3) >>> 0;
      break;
    case 6: // 4
      xg = 4;
      break;
    case 7: // 64C
      // Gate ones to XG bits 0-1. Gate zeros to other bits.
      xg = 0xc0000000;
      break;
    default:
      alert('Unexpected LX ' + entry['LX'] + " " + labels['LX'][entry['LX']]);
      break;
  }
  if (entry['TC'] == 0) {
    // Subtract
    xg = (~xg) >>> 0; // 1's complement
  }
  state['XG'] = xg;
}

// Sets state['Y'] based on entry['RY']
function adderRY(state, entry) {
  // Right input to adder Y
  var y = 0;
  switch (entry['RY']) {
    case 0: '0' // No input
      y = 0;
      break;
    case 1: // R
      y = state['R'];
      break;
    case 2: // M
      y = state['M'];
      break;
    case 3: // M23
      y = state['M'] & 0xffff;
      break;
    case 4: // H
      y = state['H'];
      break;
    case 5: // SEMT // handled by B. OR SDR parity with emit QY310.
      alert('Unimplemented RY ' + entry['RY'] + " " + labels['RY'][entry['RY']]);
      break;
    case 6: // unused
      alert('Unexpected RY ' + entry['RY'] + " " + labels['RY'][entry['RY']]);
      break;
    case 7: // unused
      alert('Unexpected RY ' + entry['RY'] + " " + labels['RY'][entry['RY']]);
      break;
  }
  if (entry['LX'] == 5) { // LWA  For address subtraction
    y = (y | 3) >>> 0;
  }
  state['Y'] = y;
}

// Sets carry-in state['CIN'] based on entry['DG']
// Does other DG functions such as G1, G2
function adderDG(state, entry) {
  state['pending'] = state['pending'] || {}; // Initialize if necessary
  var carry = 0;

  // Length counter and carry insert ctrl
  // Inconveniently, we need to do some of the DG operations early, to set up the adder. But
  // we also need to do some of the DG operations late in the cycle, to update registers.
  // The roar checks need to happen in the middle.
  switch (entry['DG']) {
    case 0: // default
      break;
    case 1: // CSTAT→ADDER
      carry = state['CSTAT'];
      break;
    case 2: // HOT1→ADDER        // Add 1 bit
      carry = 1;
      break;
    case 3: // G1-1
      if (state['G1'] == 0) {
        state['G1NEG'] = 1; // Update underflow
        // Hold at 0. Seems from QP100 that wrapping doesn't work.
      } else {
        state['G1NEG'] = 0;
        state['pending']['G1'] = state['G1'] - 1;
      }
      break;
    case 4: // HOT1,G-1
      carry = 1;
      // Unclear how negative works
      if (state['G1'] == 0 && state['G2'] == 0) {
        state['G1NEG'] = 1; // Update underflow, hoild at 0
      } else {
        if (state['G2'] == 0) {
          state['pending']['G1'] = state['G1'] - 1;
        }
        state['pending']['G2'] = (state['G2'] - 1) & 0xf;
      }
      break;
    case 5: // G2-1
      if (state['G2'] == 0) {
        state['G2NEG'] = 1; // Update underflow, hold at 0.
      } else {
        state['G2NEG'] = 0;
        state['pending']['G2'] = state['G2'] - 1;
      }
      break;
    case 6: // G-1
      // Unclear how negative works
      if (state['G1'] == 0 && state['G2'] == 0) {
        state['G1NEG'] = 1; // Update underflow
      } else {
        state['G1NEG'] = 0;
        if (state['G2'] == 0) {
          state['pending']['G1'] = state['G1'] - 1;
        }
        state['pending']['G2'] = (state['G2'] - 1) & 0xf;
      }
      break;
    case 7: // G1,2-1
      if (state['G1'] == 0) {
        state['G1NEG'] = 1; // Update underflow, hold at 0
      } else {
        state['G1NEG'] = 0;
        state['pending']['G1'] = state['G1'] - 1;
      }
      if (state['G2'] == 0) {
        state['G2NEG'] = 1; // Update underflow, hold at 0.
      } else {
        state['G2NEG'] = 0;
        state['pending']['G2'] = state['G2'] - 1;
      }
      break;
    default:
      alert('Unexpected DG ' + entry['DG'] + " " + labels['DG'][entry['DG']]);
      break;
  }


  state['CIN'] = carry; // CIN isn't "really" state; this is just to pass it to adderT
}

// Does the actual addition using XG, Y and CIN. Sets state['T']
// Adder AD functions, mostly setting carry flag
function adderT(state, entry) {
  var t;
  state['pending'] = state['pending'] || []; // Initialize if not present

  var xg = state['XG'];
  if (entry['SS'] == 42) {
    // Hack for SETCRLOG
    xg = (xg & bsmask(state)) >>> 0;
  }
  var y = state['Y'];

  var carry = state['CIN']
  if (entry['AD'] == 2) {
    // BCF0: If F reg equals zero, insert carry into position 31.
    carry = (state['F'] == 0) ? 1 : 0;
  } else if (entry['AD'] == 9 || entry['AD'] == 10 || entry['AD'] == 12) { // DC0, DDC0, or DCBS
    carry = state['S'][1]; // Insert previous value of stat 1 as carry into position 31.
  }

  t = xg + y + carry;

  var carries = t ^ (xg ^ y ^ carry); // A bit difference between sum and xor must be due to carry-in.
  var c0 = (t >= 0x100000000) ? 1 : 0;
  var c1 = (carries & 0x80000000) ? 1 : 0;
  var c8 = (carries & 0x01000000) ? 1 : 0;

  t = t >>> 0; // Force Javascript to give an unsigned result
 
  // See CROS page 33 for carry info
  switch (entry['AD']) {
    case 0:
      alert('Instruction with AD=0 should never be accessed.')
      break;
    case 1:
      // 1 is default
      break;
    case 2: // BCF0
      // BCF0: No carry saved. If F reg equals zero, insert carry into position 31. (Carry implemented above.)
      break;
    case 3:
      alert('Unexpected AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break;
    case 4: // BC0
      // Add. Set carry stat to carry out of position 0.
      state['CAR'] = c0;
      break;
    case 5: // BC⩝C
      // Add. Set carry stat to exclusive or of carries out of positions 0 and 1.
      // I.e. signed overflow.
      state['CAR'] = (c0 != c1) ? 1 : 0;
      break;
    case 6: // BC1B
      // Add. Set carry stat to carry out of position 1. Block carry from position 8 to position 7.
      if (c8) {
        t = (t - 0x01000000) >>> 0; // Undo the carry from position 8
      }
      state['CAR'] = c1;
      break;
    case 7: // BC8
      // Add. Set carry stat to carry out of position 8.
      state['CAR'] = c8;
      break;
    case 8: // DHL
      // Decimal halve (low order). Bit 2 of each digit of the sum is tested. If the bit is one,
      // the next digit position to the right in the L reg is set to 0110. If the bit is zero, the
      // digit in L reg is set to 0000. The leftmost digit in the L reg is set in the same way from the auxiliary trigger.
      var corr = state['AUX'] ? 0x60000000 : 0; // Top correction digit based on AUX
      for (var i = 1; i < 8; i++) {
        if (t & (1 << (i * 4 + 1))) {
          corr |= 6 << ((i - 1) * 4);
        }
      }
      state['pending']['L'] = corr;
      break;
    case 9: // DC0
      // Decimal add. Set stat 1 to carry out of position 0. Insert
      // previous value of stat 1 as carry into position 31. Test
      // carry out of each digit position. If carry, set corresponding
      // digit position in L reg to 0000. If no carry, set digit in L reg to 0110.
      state['S'][1] = c0;
      // Correction digit is 6 unless there was a carry out of the position.
      // The idea is to add numbers excess-6. A carry out indicates the decimal sum was 10 (i.e. 16 with excess-6), so we
      // want to keep that carry for BCD. Otherwise, subtract 6 to get back to the right value.
      // e.g. 8 + 5 + excess 6 = 0x13 which is BCD for 8 + 5 = 13
      // But 3 + 5 + excess 6 = 0x0e. No carry, so subtract 6 to get back to 0x08, the right BCD value for 3+5.
      // As a special case, if there are no carries, the value is 0x66666666.
      state['pending']['L'] =
        ((carries & 0x00000010) ? 0 : 0x00000006) |
        ((carries & 0x00000100) ? 0 : 0x00000060) |
        ((carries & 0x00001000) ? 0 : 0x00000600) |
        ((carries & 0x00010000) ? 0 : 0x00006000) |
        ((carries & 0x00100000) ? 0 : 0x00060000) |
        ((carries & 0x01000000) ? 0 : 0x00600000) |
        ((carries & 0x10000000) ? 0 : 0x06000000) |
        (c0 ? 0 : 0x60000000);
      break;
    case 10: // DDC0
      // Decimal double. Set stat 1 to carry out of position 0. Insert previous value of stat 1
      // as carry into position 1. Test each digit of sum. If 5 or greater, set corresponding digit
      // position in L reg to 0110. If less than 5, set digit in L reg to 0000.
      state['S'][1] = c0;
      var corr = 0;
      for (let i = 0; i < 8; i++) {
        const digit = (t >> (i * 4)) & 0xf;
        if (digit >= 5) {
          corr |= 6 << (i * 4);
        }
      }
      state['pending']['L'] = corr;
      break;
    case 11: // DHH
      // Decimal halve (high order). Bit 2 of each digit of the sum is tested. If the bit is one, the next
      // digit position to the right in the L reg is set to 0110. If the bit is zero, the digit in L reg is set to 0000.
      // The leftmost digit in L reg is set to 0000. The auxiliary trigger is set to bit 2 of the rightmost sum digit
      // (sum bit 30).

      // The idea is if a BCD number is divided by 2, subtract 6 first if you have from 0x10, so it will represent 10 not 0x10.
      // Specifically, if the 1's bit is set in a BCD digit, subtract 6 from the lower digit.
      // However, this test is done one shift earlier, so the 2's bit is tested.
      // This correction value is put into L.
      // DHH/DHL are used for two-word corrections. DHH stores the 1's digit in "Aux" so DHL can use it for the top correction digit.
      // Note: bit 2 has the value 2 because bits are counted from the left: 0 1 2 3
      state['pending']['L'] =
        ((t & 0x00000020) ? 0x00000006 : 0) |
        ((t & 0x00000200) ? 0x00000060 : 0) |
        ((t & 0x00002000) ? 0x00000600 : 0) |
        ((t & 0x00020000) ? 0x00006000 : 0) |
        ((t & 0x00200000) ? 0x00060000 : 0) |
        ((t & 0x02000000) ? 0x00600000 : 0) |
        ((t & 0x20000000) ? 0x06000000 : 0);
      state['AUX'] = (t & 0x00000002) ? 1 : 0;
      break;
    case 12: // DCBS
      // Decimal add. Set stat 1 to carry out of leftmost byte position for which a byte stat is on.
      // Insert previous value of stat 1 as carry into position 1[?]. Test carry out of each digit position.
      // If carry, set corresponding digit position in L reg to 0000. If no carry, set digit in L reg to 0110.
      // Note: The text says carry into position 1, but that doesn't make any sense so I'm assuming position 31.
      // Carry is set at the top of the function.
      var c16 = (carries & 0x00010000) ? 1 : 0;
      var c24 = (carries & 0x00000100) ? 1 : 0;
      if (state['BS'][0]) {
        state['S'][1] = c0;
      } else if (state['BS'][1]) {
        state['S'][1] = c8;
      } else if (state['BS'][2]) {
        state['S'][1] = c16;
      } else if (state['BS'][3]) {
        state['S'][1] = c24;
      } else {
        state['S'][1] = 0;
      }
      state['pending']['L'] =
        ((carries & 0x00000010) ? 0 : 0x00000006) |
        ((carries & 0x00000100) ? 0 : 0x00000060) |
        ((carries & 0x00001000) ? 0 : 0x00000600) |
        ((carries & 0x00010000) ? 0 : 0x00006000) |
        ((carries & 0x00100000) ? 0 : 0x00060000) |
        ((carries & 0x01000000) ? 0 : 0x00600000) |
        ((carries & 0x10000000) ? 0 : 0x06000000) |
        (c0 ? 0 : 0x60000000);
      break;
    case 13:
    case 14:
    case 15:
    default:
      alert('Unexpected AD ' + entry['AD'] + " " + labels['AD'][entry['AD']]);
      break
  } // AD
  state['T0'] = t; // Internal T before shifting
  state['c0'] = c0; // Used by SETCRLOG
}

// Force n to unsigned 32-bit
function u32(n) {
  return n >>> 0;
}

// Force n to unsigned 4-bit
function u4(n) {
  return n & 0xf;
}

// Shifts 32-bit reg right 1 bit, shifting one bit from 4-bit src in at top.
// Bit from reg is shifted into 4-bit dst
// Returns [new reg, new dst]
function sr1(src, reg, dst) {
  var reg1 = ((src & 1) << 31) | (reg >>> 1);
  var dst1 = ((reg & 1) << 3) | (dst >> 1);
  return [u32(reg1), u4(dst1)];
}

// Shifts 32-bit reg left 1 bit, shifting one bit from 4-bit src in at bottom.
// Bit from reg is shifted into 4-bit dst
// Returns [new reg, new dst]
function sl1(src, reg, dst) {
  var reg1 = (reg << 1) | ((src >>> 3) & 1);
  var dst1 = (dst << 1) | (reg >>> 31);
  return [u32(reg1), u4(dst1)];
}

// Shifts 32-bit reg right 4 bits, shifting 4-bit src in at top.
// 4 bottom bits from reg are returned in dst
// Returns [new reg, dst]
function sr4(src, reg) {
  var reg1 = ((src & 0xf) << 28) | (reg >>> 4);
  var dst1 = reg & 0xf;
  return [u32(reg1), u4(dst1)];
}

// Shifts 32-bit reg left 4 bits, shifting 4-bit src in at bottom.
// 4 top bits from reg are returned in dst
// Returns [new reg, dst]
function sl4(src, reg) {
  var reg1 = (reg << 4) | (src & 0xf);
  var dst1 = reg >>> 28;
  return [u32(reg1), u4(dst1)];
}

function adderAL(state, entry) {
  var msg = '';
  // Shift gate and adder latch control
  state['T'] = state['T0']; // may be overwritten below
  switch (entry['AL']) {
    case 0: // Normal
      break;
    case 1: // Q→SR1→F
      var s = sr1(state['Q'], state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 2: // L0,¬S4→
      // QG406: insert inv sign
      var sign = state['S'][4] == 0 ? 0x80000000 : 0;
      state['T'] = (sign | (state['L'] & 0xff000000) | (state['T'] & 0x00ffffff)) >>> 0;
      break;
    case 3: // +SGN→
      state['T'] = state['T'] & 0x7fffffff;
      break;
    case 4: // -SGN→
      state['T'] = (state['T'] | 0x80000000) >>> 0;
      break;
    case 5: // L0,S4→
      var sign = state['S'][4] == 1 ? 0x80000000 : 0;
      state['T'] = (sign | (state['L'] & 0xff000000) | (state['T'] & 0x00ffffff)) >>> 0;
      break;
    case 6: // IA→H // Handled by D
      if (state['IAR'] == undefined) {alert('undefined iar');}
      state['H'] = state['IAR'];
      break;
    case 7: // Q→SL→-F
      var s = sl1(state['Q'] << 3, state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1] ^ 0x1; // Negate new (bottom) bit
      break;
    case 8: // Q→SL1→F
      var s = sl1(state['Q'] << 3, state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 9: // F→SL1→F
      var s = sl1(state['F'], state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 10: // SL1→Q
      var s = sl1(0, state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1];
      break;
    case 11: // Q→SL1
      var s = sl1(state['Q'] << 3, state['T'], 0);
      state['T'] = s[0];
      break;
    case 12: // SR1→F
      var s = sr1(0, state['T'], state['F']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 13: // SR1→Q
      var s = sr1(0, state['T'], state['Q']);
      state['T'] = s[0];
      state['Q'] = s[1] >> 3; // Convert 4-bit result to 1-bit Q
      break;
    case 14: // Q→SR1→Q
      var s = sr1(state['Q'], state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1] >> 3; // Convert 4-bit result to 1-bit Q
      break;
    case 15: // F→SL1→Q
      var s = sl1(state['F'], state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1];
      break;
    case 16: // SL4→F    // Shift adder output left by 4, also put in F.
      var s = sl4(0, state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 17: // F→SL4→F
      var s = sl4(state['F'], state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 18: // FPSL4 Floating point shift left 4, preserving top byte (sign, exponent)
      state['LB'] = (state['T'] & 0x00f00000) ? 1 : 0; // LB indicates if data shifted out
      var s = sl4(0, state['T']);
      state['T'] = ((state['T'] & 0xff000000) | (s[0] & 0x00ffffff)) >>> 0;
      break;
    case 19: // F→FPSL4
      state['LB'] = (state['T'] & 0x00f00000) ? 1 : 0; // LB indicates if data shifted out
      var s = sl4(state['F'], state['T']);
      state['T'] = ((state['T'] & 0xff000000) | (s[0] & 0x00ffffff)) >>> 0;
      break;
    case 20: // SR4→F
      var s = sr4(0, state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 21: // F→SR4→F
      var s = sr4(state['F'], state['T']);
      state['T'] = s[0];
      state['F'] = s[1];
      break;
    case 22: // FPSR4→F  Floating point shift right 4, preserving top byte (sign, exponent)
      state['F'] = state['T'] & 0xf;
      state['T'] = ((state['T'] & 0xff000000) | ((state['T'] & 0x00fffff0) >>> 4)) >>> 0;
      break;
    case 23: // 1→FPSR4→F  Floating point shift right 4, shifting 1 in at top
      state['F'] = state['T'] & 0xf;
      state['T'] = ((state['T'] & 0xff000000) | 0x00100000 | ((state['T'] & 0x00fffff0) >>> 4)) >>> 0;
      break;
    case 24: // SR4→H
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    case 25: // F→SR4
      var s = sr4(state['F'], state['T']);
      state['T'] = s[0];
      break;
    case 26: // E→FPSL4  Floating point shift left 4, preserving top byte
      state['LB'] = (state['T'] & 0x00f00000) ? 1 : 0; // LB indicates if data shifted out
      var s = sl4(entry['CE'], state['T']);
      state['T'] = ((state['T'] & 0xff000000) | (s[0] & 0x00ffffff)) >>> 0;
      break;
    case 27: // F→SR1→Q
      var s = sr1(state['F'], state['T'], 0);
      state['T'] = s[0];
      state['Q'] = s[1] >> 3;
      break;
    case 28: // DKEY→ // Handled by D, data keys
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    case 29:
      alert('Unimplemented I/O AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
    case 30: // D→ // Handled by D
      msg = read(state);
      state['T'] = state['SDR'];
      break;
    case 31: // AKEY→ // Handled by D, address keys
      alert('Unimplemented AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
    default:
      alert('Unexpected AL ' + entry['AL'] + " " + labels['AL'][entry['AL']]);
      break;
  } // AL
  return msg;
}

// Perform a ROS-level trap. See CLF 122 / QT300
function rosTrap(state, addr, trap) {
  state['ROAR'] = addr;
  console.log('Trap ' + trap + ' at ' + fmtAddress(addr));
  throw(Error('TRAP'));
}

function trapStorProt(state) {
  rosTrap(state, 0x0142, 'storage protect');
}

function trapInvalidOpndAddr(state) {
  rosTrap(state, 0x01c0, 'invalid operand addr');
}

function trapAddrSpecViolation(state, text: string) {
  rosTrap(state, 0x01c2, 'addr spec violation ' + text);
}

// Invalid decimal data or sign
function trapInvalidDecimal(state) {
  rosTrap(state, 0x0140, 'invalid decimal');
}

// Write memory: call after setting SDR
// Assume SAR and SDR set up
function store(state) {
  state['MS'][state['SAR'] & ~3] = state['SDR'];
  coreHiliteAddr = state['SAR'];
  coreHiliteColor = "#ffcccc";
  return 'Storing ' + fmt4(state['SDR']) + ' in ' + fmt3(state['SAR']);
}

// Read memory: call before using SDR
// Assume SAR
function read(state) {
  // Add some bounds to memory? Or just implement the whole 16 MB?
  state['SDR'] = state['MS'][state['SAR'] & ~3] >>> 0;
  if (state['SDR'] == undefined) {
    state['SDR'] = 0xdeadbeef; // Random value in uninitialized memory.
  }
  coreHiliteAddr = state['SAR'];
  coreHiliteColor = "#ccccff";
  return 'Read ' + fmt4(state['SDR']) + ' from ' + fmt3(state['SAR']);
}

function checkaddr(state, alignment: number) {
  if (state['SAR'] & (alignment-1)) {
   trapAddrSpecViolation(state, 'address ' + fmt3(state['SAR']) + ', alignment ' + alignment);
  }
}

// Helper functions
function x0(state) {
  // (X=0)→S0, where X = T(12-15)
  state['S'][0] = (state['T'] & 0x000f0000) == 0 ? 1 : 0;
}

function b0(state) {
  // B0 is usually in T(0-3), which equals MD, e.g. QT115:14c, 
  // Unclear if T(0-3) is the right source, or MD is better
  state['S'][1] = (state['T'] & 0xf0000000) == 0 ? 1 : 0;
  if (state['T'] >>> 28 != state['MD']) {
    console.log('**** b0 mismatch T:' + (state['T'] >>> 28) + ' vs MD:' + state['MD'] + ', using T');
  }
}

function syl1(state) {
  // Set 1SYL
  var op0 = state['T'] >>> 28;
  if (op0 <= 3) {
    state['1SYL'] = 1; // RR
  } else {
    state['1SYL'] = 0;
  }
}

function adderLatch(state, entry) {

  // Store carry CAR to CSTAT
  state['CSTAT'] = state['CAR']

  // Latch registers from T
  var msg = '';
  var t = state['T'];
  switch (entry['TR']) {
    case 0: // T
      break;
    case 1: // R
      state['R'] = t;
      break;
    case 2: // R0
      state['R'] = ((t & 0xff000000) | (state['R'] & 0x00ffffff)) >>> 0;
      break;
    case 3: // M
      state['M'] = t;
      if (entry['WM'] == 1 || entry['WM'] == 12) {
        // Inconveniently, W→MMB can merge together T and W on the bus, so this hack here.  QS010:C22: W→MMB must override 0→M
        storeMover(state, entry);
      }
      break;
    case 4: // D
      state['SDR'] = t;
      msg = store(state);
      break;
    case 5: // L0
      state['L'] = ((t & 0xff000000) | (state['L'] & 0x00ffffff)) >>> 0;
      break;
    case 6: // R,A       // stores to R and address reg.
      state['R'] = t;
      state['SAR'] = t & 0x00ffffff;
      checkaddr(state, 1);
      break;
    case 7: // L
      state['L'] = t;
      break;
    case 8: // HA→A   Complicated hardware address implementation.
      // See Figure 16, 50Maint
      // Emit:
      // xx00: turn on byte stats (write select)
      // xxx0: Block SDR Reset (OR select)
      // xxx1: Read Select
      // x0xx or seq ctr mode,ctr=0,log tgr: HA1
      // x1xx or seq ctr mod,log tgr,ctr=4: HA2
      // HA1 or HA2: block SAR address, SAR 80
      // HA2: SAR 84
      // HA2: IAR 84
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 9: // R,AN // QT220/20d
      // AN means No IV addr trap 
      state['R'] = t;
      state['SAR'] = t & 0x00ffffff;
      checkaddr(state, 1);
      break;
    case 10: // R,AW
      // QA111: check word adr
      state['R'] = t;
      state['SAR'] = t & 0x00ffffff;
      checkaddr(state, 4);
      break;
    case 11: // R,AD
      // QG010: check double word adr
      state['R'] = t;
      state['SAR'] = t & 0x00ffffff;
      checkaddr(state, 8);
      break;
    case 12: // D→IAR // under D
      msg = read(state);
      state['IAR'] = state['SDR'] & 0x000fffff; // IAR is 20-bit
      break;
    case 13: // SCAN→D // under D        Scan bits 0-27 (extended with parity) to D. QY410
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 14: // R13
      state['R'] = ((state['R'] & 0xff000000) | (state['T'] & 0x00ffffff)) >>> 0;
      break;
    case 15: // A // QP100/614
      state['SAR'] = t & 0x00ffffff;
      checkaddr(state, 1);
      break;
    case 16: // L,A
      state['L'] = t;
      state['SAR'] = t & 0x00ffffff;
      checkaddr(state, 1);
      break;
    case 17:
      alert('Unimplemented I/O TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 18:
      alert('Unexpected TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 19:
      alert('Unimplemented I/O TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 20: // H
      state['H'] = t;
      break;
    case 21: // IA
      state['IAR'] = t & 0x00ffffff; // 24-bit IAR
      break;
    case 22: // FOLD→D // under D // 50Maint p32. FLT reg bit 0 specifies fold; maps 36 bit registers (i.e. with 4 parity) onto two 32 bit storage. Accesses folded part of SCAN QY410
      alert('Unimplemented TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 23:
      alert('Unexpected TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
    case 24: // L,M
      state['L'] = t;
      state['M'] = t;
      break;
    case 25: // MLJK     // store to L, M, 12-15 to J, 16-19 to MD  QY310, QT110. 
    // CLF 001: L16-31 (i.e. LRL) → M 0-15, L28-31 (X) → J, ILC = length, 
    // S1 on, S0 on if X=0.
    // QT115:14e: T → L, M. 0→Refetch, T(12-15)→J, T(16-19)→MD, (X=0)→ S0,
    // 16-19(B) → MD, 12-15 (X) → J, set ILC, 1SYL. (B=0)→S1
      state['L'] = state['T'];
      state['M'] = state['T'];
      state['REFETCH'] = 0;
      state['J'] = (state['T'] >>> 16) & 0xf;
      state['MD'] = (state['T'] >>> 12) & 0xf;
      state['S'][1] = (state['T'] & 0x0000f000) == 0 ? 1 : 0; // Equivalent to b0, but with bits 16-19
      x0(state);
      syl1(state);
      var op0 = state['T'] >>> 28;
      // See PrincOpsDec67 page 89 for information on ILC
      if (op0 <= 3) { // Instruction starts with 00
        state['ILC'] = 1;
      } else if (op0 <= 0xb) { // Instruction starts with 01 or 10
        state['ILC'] = 2;
      } else { // Instruction starts with 11
        state['ILC'] = 3;
      }
      break;
    case 26: // MHL  Gate adder latch to L reg. Gate adder latch bits 0-15 to M reg bits 16-31. Gate adder latch bits 0-3 to MD counter.
      state['L'] = state['T'];
      state['MD'] = (state['T'] >> 28) & 0xf;
      state['M'] = ((state['M'] & 0xffff0000) | ((state['T'] >>> 16) & 0xfffff)) >>> 0;
      break;
    case 27: // MD
      // From CLF 001: bits 8-11 (R1) moved to MD
      state['MD'] = (t >>> 20) & 0xf;
      break;
    case 28: // M,SP // QT200/0193
      state['M'] = t;
      state['KEY'] = (t & 0x00f00000) >>> 20; // Set bits 8-11 (SP) QJ200:0735
      break;
    case 29: // D*BS     // SDR bytes stats. Store bytes to D (i.e. main memory) where BS bit is high QK801:09b7
      read(state);
      var mask = bsmask(state);
      state['SDR'] = ((state['SDR'] & ~mask) | (state['T'] & mask)) >>> 0;
      msg = store(state);
      break;
    case 30: // L13 // QP206/0D95
      state['L'] = ((state['L'] & 0xff000000) | (state['T'] & 0x00ffffff)) >>> 0;
      break;
    case 31: // J   Use bits 12-15
      state['J'] = (state['T'] >>> 16) & 0xf;
      break;
    default:
      alert('Unexpected TR ' + entry['TR'] + " " + labels['TR'][entry['TR']]);
      break;
  } // TR

  // Store any pending entries
  var pending = state['pending'];
  if (pending) {
    var keys = Object.keys(pending);
    for (var i = 0; i < keys.length; i++) {
      state[keys[i]] = state['pending'][keys[i]];
    }
    delete state['pending'];
  }
  return msg;
}

  // Mask for byte 0, 1, 2, 3
var bytemask = [0xff000000, 0x00ff0000, 0x0000ff00, 0x000000ff];
var byteshift = [24, 16, 8, 0];

function moverU(state, entry) {
  // Mover input left side → U
  var u;
  // See CROS manual page 25 for left mover bit patterns
  switch (entry['LU']) {
    case 0: // no value
      u = 0;
      break;
    case 1: // MD,F      // MD and F registers (4 bits each)
      u = (state['MD'] << 4) | state['F'];
      break;
    case 2: // R3        // R3 = low byte (byte 3, right) of register R
      u = state['R'] & 0xff;
      break;
    case 3: // I/O
      alert('Unimplemented LU ' + entry['LU'] + " " + labels['LU'][entry['LU']]);
      break;
    case 4: // XTR       // Parity error (extra bit)? Reset by reading. QU100
      u = 0;
      break;
    case 5: // PSW4      // PSW byte 4.
      // PSW = SYSMASK(8), KEY(4), AMWP(4), IRUPT(16);   ILC(2), CR(2), PROGMASK(4), IAR(24)
      u = (state['ILC'] << 6) | (state['CR'] << 4) | state['PROGMASK'];
      break;
    case 6: // LMB       // L indexed by MB
      u = (state['L'] & bytemask[state['MB']]) >> byteshift[state['MB']];
      break;
    case 7: // LLB
      u = (state['L'] & bytemask[state['LB']]) >> byteshift[state['LB']];
      break;
    default:
      alert('Unexpected LU ' + entry['LU'] + " " + labels['LU'][entry['LU']]);
      break;
  }
  state['U'] = u & 0xff;
}

  // Mover input right side → V
function moverV(state, entry) {
  var v = undefined;
  switch (entry['MV']) {
    case 0: // no value
      v = 0;
      break;
    case 1: // MLB
      v = (state['M'] & bytemask[state['LB']]) >> byteshift[state['LB']];
      break;
    case 2: // MMB
      v = (state['M'] & bytemask[state['MB']]) >> byteshift[state['MB']];
      break;
    case 3:
    default:
      alert('Unexpected MV ' + entry['MV'] + " " + labels['MV'][entry['MV']]);
      break;
  }
  state['V'] = v & 0xff;
}

// Apply mover operation to both halves to generate an 8-bit value.
// That way this code can be shared for WL and WR.
// The appropriate half will need to be used.
// Returns value
function moverOp(state, entry, op) {
  var u = state['U'];
  var v = state['V'];
  var w = 0; // 8-bit value
  switch (op) {
    case 0: // E // E→WL in d29
      var emit = entry['CE'];
      if (entry['WM'] == 12) { // W→MMB(E?)
        // Inconvenient operation to do here: W→MMB(E?) modifies the emit value if the ASCII bit is on.
        // Emit is 1100 (BCD +), 1101 (BCD -), 1111 (zone) for EBCDIC.
        // ASCII mods: 1010 (+), 1011 (-), 0101 (zone).
        // It's unclear why these values are used.
        // See PrincOps page 36
        if (state['AMWP'] & 8) {
          if (emit == 0xc) {
            emit = 0xa;
          } else if (emit == 0xd) {
            emit = 0xb;
          } else if (emit == 0xf) {
            emit = 0x5;
          } else {
            alert('Unexpected emit for W→MMB(E?): ' + emit);
          }
        }
      }
      w = (emit << 4) | emit;
      break;
    case 1: // U   default: pass undefined through
      w = u;
      break;
    case 2: // V
      w = v;
      break;
    case 3: // ? Use mover function
      switch (state['WFN']) {
        case 0: // cross
          w = ((u & 0xf) << 4) | (u >> 4);
          break;
        case 1: // or
          w = (u | v);
          break;
        case 2: // and
          w = (u & v);
          break;
        case 3: // xor
          w = (u ^ v);
          break;
        case 4: // character
          w = u;
          break;
        case 5: // zone
          w = (u & 0xf0) | (v & 0x0f) // move upper nibble
          break;
        case 6: // numeric
          w = (u & 0x0f) | (v & 0xf0) // move lower nibble
          break;
        case 7: //unused
        default:
          alert('Unexpected mover function ' + state['WFN']);
          break;
      }

      break;
    default:
      alert('Unexpected UL ' + entry['UL'] + " " + labels['UL'][entry['UL']]);
  }
  return w >>> 0;
}

// This is almost the same as moverWL, but uses right nibble instead of left, so not close enough to merge
function moverWL(state, entry) {
  state['WL'] = moverOp(state, entry, entry['UL']) >>> 4;
}

// Also sets W
// This is almost the same as moverWL, but uses right nibble instead of left, so not close enough to merge
function moverWR(state, entry) {
  state['WR'] = (moverOp(state, entry, entry['UR']) & 0xf) >>> 0;
  state['W'] = ((state['WL'] << 4) | state['WR']) >>> 0;
}

function storeMover(state, entry) {
  // Mover output destination W →
  switch (entry['WM']) {
    case 0: // no action
      break;
    case 1: // W→MMB     // W to M indexed by MB
    case 12: // W→MMB(E?) // d29
      state['M'] = ((state['M'] & ~bytemask[state['MB']]) | (state['W'] << byteshift[state['MB']])) >>> 0;
      break;
    case 2: // W67→MB    // W bits 6-7 to MB
      state['MB'] = state['WR'] & 3;
      break;
    case 3: // W67→LB   // W bits 6-7 to LB
      state['LB'] = state['WR'] & 3;
      break;
    case 4: // W27→PSW4 // W bits 2-7 to PSW bits 34-39 QJ200. Turns off load light too.
      // i.e. CR and program mask
      state['CR'] = (state['W'] & 0x30) >>> 4;
      state['PROGMASK'] = state['W'] & 0xf;
      break;
    case 5: // W→PSW0    // PSW bits 0-7, system mask
      state['SYSMASK'] = state['W'];
      break;
    case 6: // WL→J
      state['J'] = state['WL'];
      break;
    case 7: // W→CHCTL           // Channel control: 0001 is start I/O, 0100 is test I/O. Updates R, M, DA, L (see QK800). M0 = unit status. L1 is channel end status
      // 0010 is halt: QK70093a
      // 1000 is test chan: QK700:93e
      // 1101 is test I/O: QK700:936
      // 00010000 is foul on start; QK700:9Be
      chctl(state, entry); // in io.js
      break;
    case 8: // W,E→A(BUMP) // W,E(23) selects bump sector address. Bits shuffled, see 5- Maint p81.
      // Fake the bump address for now
      state['SAR'] = 0x1000000 | (state['W'] << 4) | ((entry['CE'] & 3) << 2);
      break;
    case 9: // WL→G1
      state['G1'] = state['WL'];
      break;
    case 10: // WR→G2
      state['G2'] = state['WR'];
      break;
    case 11: // W→G
      state['G1'] = state['WL'];
      state['G2'] = state['WR'];
      break;
    case 13: // WL→MD
      state['MD'] = state['WL'];
      break;
    case 14: // WR→F
      state['F'] = state['WR'];
      break;
    case 15: // W→MD,F
      state['MD'] = state['WL'];
      state['F'] = state['WR'];
      break;
    default:
      alert('Unexpected WM ' + entry['WM'] + " " + labels['WM'][entry['WM']]);
      break;
  }
}

// Instruction address reg control
  // These need to happen after the mover so are implemented here.
function iar2(state, entry) {
  switch (entry['IV']) {
    case 1: // WL→IVD  trap on invalid digit
      if (state['WL'] > 9) {
        trapInvalidDecimal(state);
      }
      break;
    case 2: // WR→IVD
      // QS304: 0e25: check for invalid digit
      if (state['WR'] > 9) {
        trapInvalidDecimal(state);
      }
      break;
    case 3: // W→IVD
      if (state['WL'] > 9 || state['WR'] > 9) {
        trapInvalidDecimal(state);
      }
      break;
  }
}

// Update LB, MB, MD
function counters(state, entry) {
  // Counter function control
  switch (entry['UP']) {
    case 0: // 0→
      if (entry['LB']) {
        state['LB'] = 0;
      }
      if (entry['MB']) {
        state['MB'] = 0;
      }
      if (entry['MD']) {
        state['MD'] = 0;
      }
      break;
    case 1: // 3→
      if (entry['LB']) {
        state['LB'] = 3;
      }
      if (entry['MB']) {
        state['MB'] = 3;
      }
      if (entry['MD']) {
        state['MD'] = 3;
      }
      break;
    case 2: // -   Should negative numbers wrap or be a flag?
      if (entry['LB']) {
        state['LB'] = (state['LB'] - 1) & 3;
      }
      if (entry['MB']) {
        state['MB'] = (state['MB'] - 1) & 3;
      }
      if (entry['MD']) {
        state['MD'] = (state['MD'] - 1) & 0xf;
      }
      break;
    case 3: // + // QT120/01CE
      if (entry['LB']) {
        state['LB'] = (state['LB'] + 1) & 3;
      }
      if (entry['MB']) {
        state['MB'] = (state['MB'] + 1) & 3;
      }
      if (entry['MD']) {
        state['MD'] = (state['MD'] + 1) & 0xf;
      }
      break;
    default:
      alert('Unexpected UP ' + entry['UP'] + " " + labels['UP'][entry['UP']]);
      break;
  }
}

function localStorageLSAR(state, entry) {
  // Local storage addressing
  switch (entry['WS']) {
    case 0:
      alert('Instruction with WS=0 should never be accessed.')
      break;
    case 1: // WS1→LSA // Select WS1 address from local storage. WS7 is PSW0 backup
      state['LSAR'] = 0x11; // From dataflow diagram: LS is 00 I/O, 01: working, 02: FP reg, 03: fixed reg
      break;
    case 2: // WS2→LSA // Select WS2 address from local storage
      state['LSAR'] = 0x12;
      break;
    case 3: // WS,E→LSA // QP206/D94
      state['LSAR'] = 0x10 | entry['CE'];
      break;
    case 4: // FN,J→LSA
      // SF=7 is only used with WS=4, and disables it
      if (entry['SF'] != 7) {
        state['LSAR'] = (state['FN'] << 4) | state['J'];
      }
      break;
    case 5: // FN,JΩ1→LSA
      state['LSAR'] = (state['FN'] << 4) | state['J'] | 1;
      break;
    case 6: // FN,MD→LSA
      state['LSAR'] = (state['FN'] << 4) | state['MD'];
      break;
    case 7: // FN,MDΩ1→LSA
      state['LSAR'] = (state['FN'] << 4) | state['MD'] | 1;
      break;
    default:
      alert('Unexpected WS ' + entry['WS'] + " " + labels['WS'][entry['WS']]);
      break;
  }
}

/*
 * Helper to write value to local store (at address LSAR)
 */
function writeLS(state, value: number) {
  state['LS'][state['LSAR']] = value;
  lsHilitePos = state['LSAR']; // Highlight this entry in the GUI
  lsHiliteColor = "#ffcccc";
}

/*
 * Helper to read value from local store (at address LSAR)
 */
function readLS(state): number {
  lsHilitePos = state['LSAR']; // Highlight this entry in the GUI
  lsHiliteColor = "#ccccff";
  return state['LS'][state['LSAR']];
}

function localStore(state, entry) {
  // Local storage function
  switch (entry['SF']) {
    case 0: // R→LS // QT210/1A3
      writeLS(state, state['R']);
      break;
    case 1: // LS→L,R→LS
      state['L'] = state['LS'][state['LSAR']];
      writeLS(state, state['R']);
      break;
    case 2: // LS→R→LS 
      state['R'] = readLS(state);
      break;
    case 3:
      alert('Unexpected SF ' + entry['SF'] + " " + labels['SF'][entry['SF']]);
      break;
    case 4: // L→LS // QP206/D95
      writeLS(state, state['L']);
      break;
    case 5: // LS→R,L→LS
      state['R'] = state['LS'][state['LSAR']];
      writeLS(state, state['L']);
      break;
    case 6: // LS→L→LS // QP206/D94
      state['L'] = readLS(state);
      break;
    case 7: // No storage function
      if (entry['WS'] != 4) {
        alert('Unexpected SF ' + entry['SF'] + ' with SF ' + entry['SF'] + " " + labels['SF'][entry['SF']]);
      }
      break;
    default:
      alert('Unexpected SF ' + entry['SF'] + " " + labels['SF'][entry['SF']]);
      break;
  }
}

// Instruction address reg control
function iar(state: {[key: string]: any}, entry: {[key: string]: number}) : void {
  switch (entry['IV']) {
    case 0: // default
      break;
    case 1: // WL→IVD
      // implemented in mover
      break;
    case 2: // WR→IVD
      // implemented in mover
      break;
    case 3: // W→IVD
      // implemented in mover
      break;
    case 4: // IA/4→A,IA
      // Increment IAR by 4. Gate result to IAR and SAR. Initiate storage request.
      // Inhibit invalid address trap. Set invalid address stat instead.
      state['IAR'] += 4;
      state['SAR'] = state['IAR'];
      state['IAS'] = (state['IAR'] & 3) ? 1 : 0;
      break;
    case 5 : // IA+2/4 // QT115/019B
      // If instruction length code value is 0 or 1, increment IAR by 2. If ILC value is 2 or 3, increment
      // IAR by 4. Gate result back to IAR.
      if (state['ILC'] == 0 || state['ILC'] == 1) {
        state['IAR'] += 2;
      } else if (state['ILC'] == 2 || state['ILC'] == 3) {
        state['IAR'] += 4;
      }
      break;
    case 6 : // IA+2
      // Increment IAR by 2. Gate result back to IAR.
      state['IAR'] += 2;
      break;
    case 7: // IA+0/2→A
      // Gate IAR to SAR, incremented by 2 if refetch stat is off, not incremented if refetch stat is on.
      // Initiate storage request. Inhibit invalid address trap. Set invalid address stat instead. IAR is not altered.
      if (entry['ZN'] == 1) { // SMIF: Suppress Memory Instruction Fetch if refetch stat is off and IAR bit 30 is 1
        if (!state['REFETCH'] && (state['IAR'] & 2)) {
          // Half-word alignment, no refetch. Skip fetch because using op buffer.
          break;
        }
      }
      if (state['REFETCH'] == 0) {
        state['SAR'] = state['IAR'] + 2;
      } else {
        state['SAR'] = state['IAR'];
      }
      // TODO(implement storage requests)
      state['IAS'] = (state['SAR'] & 3) ? 1 : 0; // Invalid address stat
      break;
    default:
      alert('Unimplemented IV ' + entry['IV'] + " " + labels['IV'][entry['IV']]);
      break;
  }
}

function stat(state, entry) {
  state['pending'] = state['pending'] || []; // Initialize if needed
  // C: Stat setting and misc control
  switch (entry['SS']) {
    case 0: // default;
      break;
    case 1:
    case 2:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 3: // D→CR*BS  Set Cond Reg for Test and Set Instruction  QK300:905
      // Unclear what to do if multiple BS set.
      read(state);
      var d = state['SDR'];
      var bs = state['BS'];
      if ((bs[0] && (d & 0x80000000)) || (bs[1] && (d & 0x00800000)) || (bs[2] && (d & 0x00008000)) || (bs[3] && (d & 0x00000080))) {
        state['CR'] = 1;
      } else {
        state['CR'] = 0;
      }
      break;
    case 4: // E→SCANCTL // Performs scan operation controlled by E. See 50Maint p32. 0101 clears SCPS,SCFS QU100. 0011 ignore IO error. 0000 test for all ones, step bin trigger. 0001 sets SCPS,SCFS.
      // 1000 moves SDR(0-2) to CTR (clock advance counter) STR(5) to PSS (progressive scan stat), SDR(6) to SST (supervisory stat) QY110
      switch (entry['CE']) {
        case 1:
          state['SCPS'] = 1;
          state['SCFS'] = 1;
          break
        case 3:
          // Ignore I/O error QJ200:0731
          break
        case 5:
          state['SCPS'] = 0;
          state['SCFS'] = 0;
          break;
        case 8: // QY110:F8B, CLF213
          // SDR(0-2) to clock advance counters
          // SDR 5 to the progressive scan stat (PSS)
          // SDR 6 to the supervisory stat (SS)
          alert('Unimplemented SCANTRL ' + entry['CE'] + " " + labels['SS'][entry['SS']]);
        case 12:
          // Turn off log trig (for machine check traps)
          // QT310:010e
          break;
        default:
          alert('Unimplemented SCANTRL ' + entry['CE'] + " " + labels['SS'][entry['SS']]);
          break;
      }
      break;
    case 5: // L,RSGNS: QE900
      // Trap if invalid sign. Valid sign is 0xa to 0xf; 0xa, 0xc, 0xe, 0xf positive, 0xb, 0xd negative.
      // See Principles of Operation page 36.
      // QS400 0d05: if -, 1→LSGN, ¬RSGN
      // if +, 0→LSGN
      // Value tested is in U apparently.
      if ([0xa, 0xc, 0xe, 0xf].includes(state['U'] & 0xf)) { // Positive
        state['LSGNS'] = 0;
      } else if ([0xb, 0xd].includes(state['U'] & 0xf)) { // Negative
        state['LSGNS'] = 1;
        state['RSGNS'] = state['RSGNS'] ^ 1;
      } else {
        trapInvalidDecimal(state);
      }
      break;
    case 6: // IVD/RSGNS
      // QS200:E26: if -, clear RSGN. If not sign, trap.
      // QS110:C2E Invert R sign stat if sign is minus.
      if ([0xa, 0xc, 0xe, 0xf].includes(state['U'] & 0xf)) { // Positive
        // No action
      } else if ([0xb, 0xd].includes(state['U'] & 0xf)) { // Negative
        state['RSGNS'] ^= 1; // Invert
      } else {
        trapInvalidDecimal(state);
      }
      break;
    case 7: // EDITSGN
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 8: // E→S03             // S03 = stats 0-3 50Maint p183, QU100
      var e = entry['CE'];
      state['S'][0] = (e >> 3) & 1;
      state['S'][1] = (e >> 2) & 1;
      state['S'][2] = (e >> 1) & 1;
      state['S'][3] = (e >> 0) & 1;
      break;
    case 9: // S03ΩE,1→LSGN
      state['LSGNS'] = 1;
      var e = entry['CE'];
      state['S'][0] |= (e >> 3) & 1;
      state['S'][1] |= (e >> 2) & 1;
      state['S'][2] |= (e >> 1) & 1;
      state['S'][3] |= (e >> 0) & 1;
      break;
    case 10: // S03ΩE            // Set S03 bits from E
      var e = entry['CE'];
      state['S'][0] |= (e >> 3) & 1;
      state['S'][1] |= (e >> 2) & 1;
      state['S'][2] |= (e >> 1) & 1;
      state['S'][3] |= (e >> 0) & 1;
      break;
    case 11: // S03ΩE,0→BS
      state['pending']['BS'] = [0, 0, 0, 0];
      var e = entry['CE'];
      state['S'][0] |= (e >> 3) & 1;
      state['S'][1] |= (e >> 2) & 1;
      state['S'][2] |= (e >> 1) & 1;
      state['S'][3] |= (e >> 0) & 1;
      break;
    case 12: // X0,B0,1SYL      (B=0)→S1, set 1 SYL. QC031/003F
      x0(state);
      b0(state);
      syl1(state);
      break;
    case 13: // FPZERO  Set S0 if value is floating point 0, i.e. bytes 1-3 are zero (ignore sign, exponent)
    // But QG406 says (T(8-31)=0).(F=0).S3→S0 -- what is F? Does S3 really matter here?
      if ((state['T'] & 0x00ffffff) == 0 && state['F'] == 0 && state['S'][3]) {
        state['S'][0] = 1;
      }
      break;
    case 14: // FPZERO,E→FN
      if ((state['T'] & 0x00ffffff) == 0 && state['F'] == 0 && state['S'][3]) {
        state['S'][0] = 1;
      }
      state['FN'] = entry['CE'] & 3; // A guess as to which bits
      break;
    case 15: // B0,1SYL // (B=0)→S1, set 1SYL QT115/0189
      b0(state);
      syl1(state);
      break;
    case 16: // S03.¬E           // Clear S03 bits from E
      for (var i = 0; i < 4; i++) {
        state['S'][i] &= ~(entry['CE']>>(3-i));
      }
      break;
    case 17: // (T=0)→S3
      state['S']['3'] = (state['T'] == 0) ? 1 : 0;
      break;
    case 18: // E→BS,T30→S3
      // 01C6
      state['pending']['BS'] = [];
      for (var i = 0; i < 4; i++) {
        state['pending']['BS'][i] = (entry['CE'] & (1<<(3-i))) ? 1 : 0;
      }
      state['S'][3] = (state['T'] >> 1) & 1; // T(30)→S3, branch address halfword indicator
      break;
    case 19: // E→BS             // Store E to byte stats (i.e. byte mask)
      state['pending']['BS'] = [];
      for (var i = 0; i < 4; i++) {
        state['pending']['BS'][i] = (entry['CE'] & (1<<(3-i))) ? 1 : 0;
      }
      break;
    case 20: // 1→BS*MB
      state['pending']['BS'] = state['BS'].slice(); // Copy
      state['pending']['BS'][state['MB']] = 1;
      break;
    case 21:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 22:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 23: // MANUAL→STOP      // M trig to S (Halt status) QU100
      // Ignore.
      break;
    case 24: // E→S47            // Write E to channel S bits 4-7
      state['S'][4] = (entry['CE'] >>> 3) & 1;
      state['S'][5] = (entry['CE'] >>> 2) & 1;
      state['S'][6] = (entry['CE'] >>> 1) & 1;
      state['S'][7] = (entry['CE'] >>> 0) & 1;
      break;
    case 25: // S47ΩE            // S bits 4-7 |= E. Set bits indicated by E
      state['S'][4] |= (entry['CE'] >>> 3) & 1;
      state['S'][5] |= (entry['CE'] >>> 2) & 1;
      state['S'][6] |= (entry['CE'] >>> 1) & 1;
      state['S'][7] |= (entry['CE'] >>> 0) & 1;
      break;
    case 26: // S47.¬E           // S bits 4-7 &= ~E. I.e. clear bits indicated by E
      state['S'][4] &= ~((entry['CE'] >>> 3) & 1);
      state['S'][5] &= ~((entry['CE'] >>> 2) & 1);
      state['S'][6] &= ~((entry['CE'] >>> 1) & 1);
      state['S'][7] &= ~((entry['CE'] >>> 0) & 1);
      break;
    case 27: // S47,ED*FP  QG700:0503, QG401:0440
      // Norm sign → S4
      // Compl add → S5
      // (ED<16) → S6
      // (ED=0) → S7
      // Set exp dif reg. It is a 4-bit register, but value could overflow.
      state['ED'] = (state['T'] >>> 24) & 0xf;
      state['S'][4] = (state['R'] & 0x80000000) ? 1 : 0; // Normal sign. Sign of R???
      state['S'][5] = (state['T'] & 0x80000000) ? 0 : 1; // If signs are same, true add (i.e. not subtract)
      state['S'][6] = ((state['ED'] & 0xf0000000) == 0) ? 1 : 0;
      state['S'][7] = ((state['ED'] & 0xff000000) == 0) ? 1 : 0;
      break;
    case 28: // OPPANEL→S47      // Write operator panel to S bits 4-7
      // See QT200 for mapping from console switches to S47
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 29: // CAR,(T≠0)→CR
      state['CR'] = (state['CAR'] ? 2 : 0) | (state['T'] != 0 ? 1 : 0);
      break;
    case 30: // KEY→F // QT115/020E
      state['F'] = state['KEYS'][state['SAR'] & 0x00fff100] | 0; // 0 if undefined
      break;
    case 31: // F→KEY // QT220/02BF  QA800: write storage key
      state['KEYS'][state['SAR'] & 0x00fff100] = state['F'];
      break;
    case 32: // 1→LSGNS
      state['LSGNS'] = 1;
      break;
    case 33: // 0→LSGNS
      state['LSGNS'] = 0;
      break;
    case 34: // 1→RSGNS
      state['RSGNS'] = 1;
      break;
    case 35: // 0→RSGNS
      state['RSGNS'] = 0;
      break;
    case 36: // L(0)→LSGNS
      state['LSGNS'] = (state['L'] & 0x80000000) ? 1 : 0;
      break;
    case 37: // R(0)→RSGNS       // R sign stat QY310
      state['RSGNS'] = (state['R'] & 0x80000000) ? 1 : 0;
      break;
    case 38: // E(13)→WFN
      // Seems to also do something with I/O? Maybe I/O mover?
      // .000 = CROSS QA800:01A2
      // .001 = O (OR) QB400:0298
      // .010 = N (AND) QB400:0290
      // .011 = X XOR QC030:0138
      // .100: set mover fn reg to move (8 bit) characters QP800:0608 default???
      // .101: set mover fn reg to move zones (upper 4 bits) QP800:060c
      // .110: set mover fn reg to move numerics (lower 4 bits) QP800:0604
      state['WFN'] = entry['CE'] & 7;
      break;
    case 39: // E(23)→FN // QT120/0102
      state['FN'] = entry['CE'] & 3;
      break;
    case 40: // E(23)→CR
      state['CR'] = entry['CE'] & 3;
      break;
    case 41: // SETCRALG   Set condition register from algebraic comparison
      // If T=0 00→CR, if T<0, 01→CR, QE580/222. Part may be BCVC
      if (state['T'] == 0) {
        state['CR'] = 0;
      } else if (state['T'] & 0x80000000) {
        state['CR'] = 1; // Negative
      } else {
        state['CR'] = 2; // Positive
      }
      break;
    case 42: // SETCRLOG   Set condition register from logical comparison
      // QB500:246: If T*BS=0, 00→CR.  If T*BS≠0, and CAR(0)=0, 01→CR.
      // If T*BS≠0, and CAR(0)=1, 10→CR.
      if (tzbs(state)) {
        state['CR'] = 0; // Equal
      } else if (state['c0'] == 0) {
        state['CR'] = 1; // First lower
      } else {
        state['CR'] = 2; // First higher
      }
      break;
    case 43: // ¬S4,S4→CR
      state['CR'] = ((state['S'][4] ^ 1) << 1) | state['S'][4];
      break;
    case 44: // S4,¬S4→CR
      state['CR'] = (state['S'][4] << 1) | (state['S'][4] ^ 1);
      break;
    case 45: // 1→REFETCH
      state['REFETCH'] = 1;
      break;
    case 46: // SYNC→OPPANEL // QT200/0107
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 47: // SCAN*E,10        // sets FLT register. See 50Maint p28. Channel address, Unit address to L.
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 48:
      alert('Unexpected I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 49:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 50: // E(0)→IBFULL      // Reset MPX Input Buffer Full stat QU100
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      state['IBFULL'] = (entry['CE'] >> 3) & 1;
      break;
    case 51:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 52: // E→CH             // QY430 E=0110 resets common and mpx channel
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 53:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 54: // 1→TIMERIRPT
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 55: // T→PSW,IPL→T,      // QU100, 50Maint
      // IPL UA → 0-7, IPL CA → 21-23
      // T 12-15 to PSW AMWP control bits
      state['AMWP'] = (state['T'] & 0x000f0000) >>> 16;
      // Hardwire card reader = 00C: channel 0, device 0C
      var ca = 0
      var ua = 0x0c;
      state['T'] = ((ua << 24) | (ca << 8)) >>> 0;
      break;
    case 56: // T→PSW            // T(12-15) to PSW control bits QJ200:751
      state['AMWP'] = (state['T'] & 0x000f0000) >>> 16;
      break;
    case 57: // SCAN*E,00        // E → SCANCTRL(2-5), 0→SCANCTRL(1), (FOLD)→SCANCTRL(0) // U100
      var fold = 0;
      state['SCANCTRL'] = (fold << 7) | entry['CE'] << 2;
      break;
    case 58: // 1→IOMODE // 50Maint p39. Sets I/O mode stat
      alert('Unimplemented SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 59:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 60:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 61:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 62:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    case 63:
      alert('Unimplemented I/O SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
    default:
      alert('Unexpected SS ' + entry['SS'] + " " + labels['SS'][entry['SS']]);
      break;
  }
}

// Compute ROAR address
// See special bits in CROS manual page 29
function roar(state, entry) {
  var roar;
  roar = entry['ZP'] << 6;
  if (entry['ZN'] != 0) {
    roar |= entry['ZF'] << 2;
  }
  // otherwise ZF function generates roar bits at bottom of routine
  state['ROAR'] = roar;
}

function bsmask(state) {
  return ((state['BS'][0] ? 0xff000000 : 0) | (state['BS'][1] ? 0x00ff0000 : 0) |
      (state['BS'][2] ? 0x0000ff00 : 0) | (state['BS'][3] ? 0x000000ff : 0)) >>> 0;
}

// Evaluate TZ*BS, i.e. T zero, masked by BS
function tzbs(state) {
  if ((state['T'] & bsmask(state)) == 0) {
    return 1;
  } else {
    return 0;
  }
}
  
function roarAB(state, entry) {
  // Condition test (left side)
  var roar = state['ROAR'];
  switch (entry['AB']) {
    case 0: // 0
      // roar |= 0;
      break;
    case 1: // 1 // ?QP100/614
      roar |= 2;
      break;
    case 2: // S0
      roar |= state['S'][0] << 1;
      break;
    case 3: // S1
      roar |= state['S'][1] << 1;
      break;
    case 4: // S2
      roar |= state['S'][2] << 1;
      break;
    case 5: // S3
      roar |= state['S'][3] << 1;
      break;
    case 6: // S4
      roar |= state['S'][4] << 1;
      break;
    case 7: // S5
      roar |= state['S'][5] << 1;
      break;
    case 8: // S6
      roar |= state['S'][6] << 1;
      break;
    case 9: // S7
      roar |= state['S'][7] << 1;
      break;
    case 10: // CSTAT carry stat
      roar |= state['CSTAT'] << 1;
      break;
    case 11:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 12: // 1SYLS
      roar |= state['1SYLS'] << 1;
      break;
    case 13: // LSGNS L Sign Stat
      roar |= state['LSGNS'] << 1;
      break;
    case 14: // ⩝SGNS: LSS xor RSS
      if (state['LSGNS'] != state['RSGNS']) {
        roar |= 2;
      }
      break;
    case 15:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 16: // CRMD     // masked CR → A
      // CROS manual: MD bit 0 & CR23 = 00 or MD1 & CR23 = 10 or MD bit 2 & CR23=01 or MD bit 3 & CR23 = 11
      if (state['MD'] & (1<<(3-state['CR']))) {
        roar |= 2;
      }
      break;
    case 17: // W=0
      if (state['W'] == 0) {
        roar |= 2;
      }
      break;
    case 18: // WL=0
      if (state['WL'] == 0) {
        roar |= 2;
      }
      break;
    case 19: // WR=0
      if (state['WR'] == 0) {
        roar |= 2;
      }
      break;
    case 20: // MD=FP  i.e. MD = 0xx0, floating point register 0, 2, 4, 6
      if (state['MD'] == 0 || state['MD'] == 2 || state['MD'] == 4 || state['MD'] == 6) {
        roar |= 2;
      }
      break;
    case 21: // MB=3   BAM bit 0 and 1
      if (state['MB'] == 3) {
        roar |= 2;
      }
      break;
    case 22: // MD3=0
      if ((state['MD'] & 1) == 0) {
        roar |= 2;
      }
      break;
    case 23: // G1=0
      if (state['G1'] == 0) {
        roar |= 2;
      }
      break;
    case 24: // G1<0
      if (state['G1NEG'] == 1) {
        roar |= 2;
      }
      break;
    case 25: // G<4
      if (state['G1'] == 0 && state['G2'] < 4) {
        roar |= 2;
      }
      break;
    case 26: // G1MBZ
      // G1 == 0 or MB == 0 QS400:0D04
      if (state['G1'] == 0 || state['MB'] == 0) {
        roar |= 2;
      }
      break;
    case 27: // IO Stat 0 to CPU
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 28: // IO Stat 2
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 29: // R(31)
      if (state['R'] & 1) {
        roar |= 2;
      }
      break;
    case 30: // F(2)
      if (state['F'] & 2) {
        roar |= 2;
      }
      break;
    case 31: // L(0)
      if (state['L'] & 0x80000000) {
        roar |= 2;
      }
      break;
    case 32: // F=0
      if (state['F'] == 0) {
        roar |= 2;
      }
      break;
    case 33: // UNORM   T8-11 zero and not stat 0.
      if (((state['T'] & 0x00f00000) == 0) && state['S'][0] == 0) {
        roar |= 2;
      }
      break;
    case 34: // TZ*BS  T zero per byte stat
      if (tzbs(state)) {
        roar |= 2;
      }
      break;
    case 35: // EDITPAT
      // CROS manual page 31: sets A with edit stat 1, B with edit stat 2.
      // d1c:
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 36: // PROB     // Check problelm state (i.e. user vs supervisor)? QY110, QA800  Monitor stat
      if (state['AMWP'] & 1) {
        roar |= 2;
      }
      break;
    case 37: // TIMUP   Timer update signal and not manual trigger
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 38:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 39: // GZ/MB3    CCROS: G1 == 0 & G2 == 0   or  BAM0 == 1 & BAM1 == 1
      if ((state['G1'] == 0 && state['G2'] == 0) || state['MB'] == 3) {
        roar |= 2;
      }
      break;
    case 40:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 41: // LOG      // Branch on log scan stat. QY430 0 for FLT log, 1 for error log QY410
      // Log trigger discussed in 50Maint
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 42: // STC=0    // Check Scan Test Counter
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 43: // G2<=LB
      if (state['G2'] <= state['LB']) {
        roar |= 2;
      }
      break;
    case 44:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 45: // D(7) // test D bit 7 (SDR) QY510
      read(state);
      if (state['SDR'] & (1 << (31-7))) {
        roar |= 2;
      }
      break;
    case 46: // SCPS // test and branch on pass trigger: 50Maint p32
      if (state['SCPS']) {
        roar |= 2;
      }
      break;
    case 47: // SCFS // test and branch on fail trigger: 50Maint p32
      if (state['SCFS']) {
        roar |= 2;
      }
      break;
    case 48: // CROS: Storage protect violation
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 49: // W(67)→AB
      if (entry['BB'] != 0) {
        alert('Unexpected AB 49, BB ' + entry['BB'] + " " + labels['AB'][entry['AB']]);
      }
      roar |= state['W'] & 3;
      break;
    case 50: // CROS T16-31 != 0
    case 51: // CROS T5-7 == 0 && T16-31 != 0
    case 52: // CROS bus in bit 0
    case 53: // CROS IB full
      alert('Unimplemented I/O AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 54: // CANG
      // If adder output bits 29-31 are non-zero or invalid address trigger is on, set A bit to one.
      // Otherwise set A bit to 0.
      if ((state['T'] & 0x00000007) || state['IAS']) {
        roar |= 2;
      }
      break;
    case 55: // CHLOG   Channel log
      // Don't log for now. Unclear what triggers this? A channel fault? Or a switch?
      // Log trigger discussed in 50Maint. Is this a separate log?
      break;
    case 56:
      // I-FETCH does a 4-way branch:
      // 00: off-bounds fetch (i.e. odd halfword)
      // 01: off-bounds, refetch (i.e. can't use instruction in op buffer WS14)
      // 10: on-bounds fetch (i.e. fetching a normal even halfword.)
      // 11: exception for on-bit in instruction counter position 30 (CROS page 31)
      // See e.g. QT105
      if (state['IAR'] & 1) {
        // Alignment exception. Other address exceptions?
        roar |= 3; 
      } else if (state['IAR'] & 2) {
        if (state['REFETCH'] == 0) {
          // roar |= 0;
        } else {
          roar |= 1;
        }
      } else {
        roar |= 2;
      }
      break;
    case 57: // IA(30)
      if (state['IAR'] & 2) { // Bit 30
        roar |= 2;
      }
      break;
    case 58: // EXT,CHIRPT
      // CROS page 31: A set with either timer or external channel, B with channel interrupt
      // timer update and not manual trigger    or external chan intr
      alert('Unimplemented AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 59: // CROS: direct date hold sense br
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 60: // PSS      // Test and reset Progressive Scan Stat QU100
      if (state['PSS']) {
        roar |= 2;
        state['PSS'] = 0;
      }
      break;
    case 61: // CROS: IO Stat 4
    case 62:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 63: // RX.S0   CROS: S0 & M01==01
      // QT115:0188 RX instruction type
      if (((state['M'] >>> 30) == 1) && state['S'][0]) {
        roar |= 2;
      }
      break;
    default:
      alert('Unexpected AB ' + entry['AB'] + " " + labels['AB'][entry['AB']]);
      break;
  }
  state['ROAR'] = roar;
}

function roarBB(state, entry) {
  var roar = state['ROAR'];
  // B bit can be set later in the cycle, see CROS manual page 31
  switch (entry['BB']) {
    case 0: // 0
      roar |= 0;
      break;
    case 1: // 1
      roar |= 1;
      break;
    case 2: // S0
      roar |= state['S'][0];
      break;
    case 3: // S1
      roar |= state['S'][1];
      break;
    case 4: // S2
      roar |= state['S'][2];
      break;
    case 5: // S3
      roar |= state['S'][3];
      break;
    case 6: // S4
      roar |= state['S'][4];
      break;
    case 7: // S5
      roar |= state['S'][5];
      break;
    case 8: // S6
      roar |= state['S'][6];
      break;
    case 9: // S7
      roar |= state['S'][7];
      break;
    case 10: // RSGNS R Sign Stat
      roar |= state['RSGNS'];
      break;
    case 11: // HSCH HS Channel Special Branch
      alert('Unexpected BB ' + entry['BB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 12: // EXC      // Exception Branch
      roar |= state['EXC'];
      break;
    case 13: // WR=0 MVR LTH 4-7 eq zero
      if (state['WR'] == 0) {
        roar |= 1;
      }
      break;
    case 14:
      alert('Unexpected BB ' + entry['BB'] + " " + labels['AB'][entry['AB']]);
      break;
    case 15: // T13=0
      // Inexplicably, T13=0 seems to mean T bits 8 to 31 are 0 (i.e. fraction in a float)
      // See CROS manual Figure 27 and floating point code.
      if ((state['T'] & 0x00ffffff) == 0) {
        roar |= 1;
      }
      break;
    case 16: // T(0)
      if (state['T'] & (1<<31)) {
        roar |= 1;
      }
      break;
    case 17: // T=0
      if (state['T'] == 0) {
        roar |= 1;
      }
      break;
    case 18: // TZ*BS    // Latch zero test per byte stats. QA700
      if (tzbs(state)) {
        roar |= 1;
      }
      break;
    case 19: // W=1
      if (state['W'] == 1) {
        roar |= 1;
      }
      break;
    case 20: // LB=0
      if (state['LB'] == 0) {
        roar |= 1;
      }
      break;
    case 21: // LB=3     // Test LB value
      if (state['LB'] == 3) {
        roar |= 1;
      }
      break;
    case 22: // MD=0
      if (state['MD'] == 0) {
        roar |= 1;
      }
      break;
    case 23: // G2=0
      if (state['G2'] == 0) {
        roar |= 1;
      }
      break;
    case 24: // G2<0
      if (state['G2NEG'] == 1) {
        roar |= 1;
      }
      break;
    case 25: // G2LBZ
      // G2 == 0 or LB == 0 QS400:0D04
      if (state['G2'] == 0 || state['LB'] == 0) {
        roar |= 1;
      }
      break;
    case 26: // I/O  CROS manual: IO Stat 1 to CPU
      alert('Unimplemented I/O BB ' + entry['BB'] + " " + labels['BB'][entry['BB']]);
      break;
    case 27: // MD/JI   CROS manual: MD Odd Gt 8 or J odd gt 8.  From FP register defs, apparently that means odd or >= 8.
      if ((state['MD'] & 1) || state['MD'] >= 8 || (state['J'] & 1) || state['J'] >= 8) {
        roar |= 1;
      }
      break;
    case 28: // IVA // QT110/0149
      if (state['SAR'] & 1) {
        roar |= 1;
      }
      break;
    case 29: // I/O stat 3
      alert('Unimplemented I/O BB ' + entry['BB'] + " " + labels['BB'][entry['BB']]);
      break;
    case 30: // (CAR) branch immediate on carry latch
      if (state['CAR'] == 1) {
        roar |= 1;
      }
      break;
    case 31: // (Z00): looks at current T
      if (state['T0'] & 0x80000000) {
        roar |= 1;
      }
      break;
    default: 
      alert('Unimplemented BB ' + entry['BB'] + " " + labels['BB'][entry['BB']]);
  }
  state['ROAR'] = roar;
}

function roarZN(state, entry) {
  var roar = state['ROAR'];

  // ROS address control
  // See also CROS manual page 28 for gate-level description
  switch (entry['ZN']) {
    case 0:
      // Use ZF function
      switch (entry['ZF']) {
        case 2: // D→ROAR,SCAN // 50Maint p39
          // CLF 213, QY110:F49
          // SDR(1-3) to scan counter
          // SDR(4) to enable storage stat
          // SDR(5) to PSS
          // SDR(6) to supervis stat
          // SDR(7) to IOMODE (I/O mode stat)
          // SDR (19-30) to ROAR
          alert('Unimplemented ZF ' + entry['ZF'] + " " + labels['ZF'][entry['ZF']]);
          break;
        case 6: // M(03)→ROAR
          roar |= ((state['M'] >> 28) & 0xf) << 2;
          break;
        case 8: // M(47)→ROAR
          roar |= ((state['M'] >> 24) & 0xf) << 2;
          break;
        case 10: // F→ROAR
          roar = (roar & 0xffffc3) | (state['F']  << 2);
          break;
        case 12: // ED→ROAR exp diff
          roar = (roar & 0xffffc3) | (state['ED']  << 2);
          break;
        // case 14: Add Bfr ROS Add Cntl
        default:
          alert('Unexpected ZF value ' + entry['ZF'] + " " + labels['ZF'][entry['ZF']]);
          break;
      } // ZF case
      break;
    case 1: // SMIF suppress memory instruction fetch
      // Handle in iar()
      break;
    case 2: // AΩ(B=0)→A
      if ((roar & 1) == 0) {
        roar |= 2;
      }
      break;
    case 3: // AΩ(B=1)→A
      if ((roar & 1) == 1) {
        roar |= 2;
      }
      break;
    case 4:
      // Normal path: no change
      break;
    case 5:
      alert('Unexpected ZN ' + entry['ZN'] + " " + labels['ZN'][entry['ZN']]);
      break;
    case 6: // BΩ(A=0)→B // QT115/020A
      if ((roar & 2) == 0) {
        roar |= 1;
      }
      break;
    case 7: // BΩ(A=1)→B // QT120/01CC
      if ((roar & 2) == 2) {
        roar |= 1;
      }
      break;
    default: 
      alert('Unimplemented ZN ' + entry['ZN'] + " " + labels['ZN'][entry['ZN']]);
      break;
  }

  state['ROAR'] = roar;
}
