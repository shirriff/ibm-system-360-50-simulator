// Disassemble an IBM System/360 instruction

typedef struct instr {
  string op;
  string text;
} instr;

instr instrs[256] = {
  {"", ""}, // 00
  {"", ""}, // 01
  {"", ""}, // 02
  {"", ""}, // 03
  {"SPM", "Set Program Mask"}, // 04
  {"BALR", "Branch and Link"}, // 05
  {"BCTR", "Branch on Count"}, // 06
  {"BCR", "Branch/Condition"}, // 07
  {"SSK", "Set Key"}, // 08
  {"ISK", "Insert Key"}, // 09
  {"SVC", "Supervisor Call"}, // 0a
  {"", ""}, // 0b
  {"", ""}, // 0c
  {"", ""}, // 0d
  {"", ""}, // 0e
  {"", ""}, // 0f
  {"LPR", "Load Positive,"}, // 10
  {"LNR", "Load Negative"}, // 11
  {"LTR", "Load and Test"}, // 12
  {"LCR", "Load Complement"}, // 13
  {"NR", "AND"}, // 14
  {"CLR", "Compare Logical"}, // 15
  {"OR", "OR"}, // 16
  {"XR", "Exclusive OR"}, // 17
  {"LR", "Load"}, // 18
  {"CR", "Compare"}, // 19
  {"AR", "Add"}, // 1a
  {"SR", "Subtract"}, // 1b
  {"MR", "Multiply"}, // 1c
  {"DR", "Divide"}, // 1d
  {"ALR", "Add Logical"}, // 1e
  {"SLR", "Subtract Logical"}, // 1f
  {"LPDR", "Load Positive"}, // 20
  {"LNDR", "Load Negative"}, // 21
  {"LTDR", "Load and Test"}, // 22
  {"LCDR", "Load Complement"}, // 23
  {"HDR", "Halve"}, // 24
  {"LRDR", "Load Rounded"}, // 25
  {"MXR", "Multiply"}, // 26
  {"MXDR", "Multiply"}, // 27
  {"LDR", "Load"}, // 28
  {"CDR", "Compare"}, // 29
  {"ADR", "Add N"}, // 2a
  {"SDR", "Subtract N"}, // 2b
  {"MDR", "Multiply"}, // 2c
  {"DDR", "Divide"}, // 2d
  {"AWR", "Add U"}, // 2e
  {"SWR", "Subtract U"}, // 2f
  {"LPER", "Load Positive"}, // 30
  {"LNER", "Load Negative"}, // 31
  {"LTER", "Load and Test"}, // 32
  {"LCER", "Load Complement"}, // 33
  {"HER", "Halve"}, // 34
  {"LRER", "Load Rounded"}, // 35
  {"AXR", "Add Normalized"}, // 36
  {"SXR", "Subtract Normalized"}, // 37
  {"LER", "Load"}, // 38
  {"CER", "Compare"}, // 39
  {"AER", "Add N"}, // 3a
  {"SER", "Subtract N"}, // 3b
  {"MER", "Multiply"}, // 3c
  {"DER", "Divide"}, // 3d
  {"AUR", "Add U"}, // 3e
  {"SUR", "Subtract U"}, // 3f
  {"STH", "Store"}, // 40
  {"LA", "Load Address"}, // 41
  {"STC", "Store Character"}, // 42
  {"IC", "Insert Character"}, // 43
  {"EX", "Execute"}, // 44
  {"BAL", "Branch and Link"}, // 45
  {"BCT", "Branch on Count"}, // 46
  {"BC", "Branch/Condition"}, // 47
  {"LH", "Load"}, // 48
  {"CH", "Compare"}, // 49
  {"AH", "Add"}, // 4a
  {"SH", "Subtract"}, // 4b
  {"MH", "Multiply"}, // 4c
  {"", ""}, // 4d
  {"CVD", "Convert-Decimal"}, // 4e
  {"CVB", "Convert-Binary"}, // 4f
  {"ST", "Store"}, // 50
  {"", ""}, // 51
  {"", ""}, // 52
  {"", ""}, // 53
  {"N", "AND"}, // 54
  {"CL", "Compare Logical"}, // 55
  {"O", "OR"}, // 56
  {"X", "Exclusive OR"}, // 57
  {"L", "Load"}, // 58
  {"C", "Compare"}, // 59
  {"A", "Add"}, // 5a
  {"S", "Subtract"}, // 5b
  {"M", "Multiply"}, // 5c
  {"D", "Divide"}, // 5d
  {"AL", "Add Logical"}, // 5e
  {"SL", "Subtract Logical"}, // 5f
  {"STD", "Store"}, // 60
  {"", ""}, // 61
  {"", ""}, // 62
  {"", ""}, // 63
  {"", ""}, // 64
  {"", ""}, // 65
  {"", ""}, // 66
  {"MXD", "Multiply"}, // 67
  {"LD", "Load"}, // 68
  {"CD", "Compare"}, // 69
  {"AD", "AddN"}, // 6a
  {"SD", "Subtract N"}, // 6b
  {"MD", "Multiply"}, // 6c
  {"DD", "Divide"}, // 6d
  {"AW", "Add U"}, // 6e
  {"SW", "Subtract U"}, // 6f
  {"STE", "Store"}, // 70
  {"", ""}, // 71
  {"", ""}, // 72
  {"", ""}, // 73
  {"", ""}, // 74
  {"", ""}, // 75
  {"", ""}, // 76
  {"", ""}, // 77
  {"LE", "Load"}, // 78
  {"CE", "Compare"}, // 79
  {"AE", "Add N"}, // 7a
  {"SE", "Subtract N"}, // 7b
  {"ME", "Multiply"}, // 7c
  {"DE", "Divide"}, // 7d
  {"AU", "Add U"}, // 7e
  {"SU", "Subtract U"}, // 7f
  {"SSM", "Set System Mask"}, // 80
  {"", ""}, // 81
  {"LPSW", "Load PSW"}, // 82
  {"diagnose", "Diagnose"}, // 83
  {"WRD", "Write Direct"}, // 84
  {"RDD", "Read Direct"}, // 85
  {"BXH", "Branch/High"}, // 86
  {"BXLE", "Branch/Low-Equal"}, // 87
  {"SRL", "Shift Right SL"}, // 88
  {"SLL", "Shift Left S L"}, // 89
  {"SRA", "Shift Right S"}, // 8a
  {"SLA", "Shift Left S"}, // 8b
  {"SRDL", "Shift Right DL"}, // 8c
  {"SLDL", "Shift Left DL"}, // 8d
  {"SRDA", "Shift Right D"}, // 8e
  {"SLDA", "Shift Left D"}, // 8f
  {"STM", "Store Multiple"}, // 90
  {"TM", "Test Under Mask"}, // 91
  {"MVI", "Move"}, // 92
  {"TS", "Test and Set"}, // 93
  {"NI", "AND"}, // 94
  {"CLI", "Compare Logical"}, // 95
  {"OI", "OR"}, // 96
  {"XI", "Exclusive OR"}, // 97
  {"LM", "Load Multiple"}, // 98
  {"", ""}, // 99
  {"", ""}, // 9a
  {"", ""}, // 9b
  {"SIO", "Start I/O"}, // 9c
  {"TIO", "Test I/O"}, // 9d
  {"HIO", "Halt I/O"}, // 9e
  {"TCH", "Test Channel"}, // 9f
  {"", ""}, // a0
  {"", ""}, // a1
  {"", ""}, // a2
  {"", ""}, // a3
  {"", ""}, // a4
  {"", ""}, // a5
  {"", ""}, // a6
  {"", ""}, // a7
  {"", ""}, // a8
  {"", ""}, // a9
  {"", ""}, // aa
  {"", ""}, // ab
  {"", ""}, // ac
  {"", ""}, // ad
  {"", ""}, // ae
  {"", ""}, // af
  {"", ""}, // b0
  {"", ""}, // b1
  {"", ""}, // b2
  {"", ""}, // b3
  {"", ""}, // b4
  {"", ""}, // b5
  {"", ""}, // b6
  {"", ""}, // b7
  {"", ""}, // b8
  {"", ""}, // b9
  {"", ""}, // ba
  {"", ""}, // bb
  {"", ""}, // bc
  {"", ""}, // bd
  {"", ""}, // be
  {"", ""}, // bf
  {"", ""}, // c0
  {"", ""}, // c1
  {"", ""}, // c2
  {"", ""}, // c3
  {"", ""}, // c4
  {"", ""}, // c5
  {"", ""}, // c6
  {"", ""}, // c7
  {"", ""}, // c8
  {"", ""}, // c9
  {"", ""}, // ca
  {"", ""}, // cb
  {"", ""}, // cc
  {"", ""}, // cd
  {"", ""}, // ce
  {"", ""}, // cf
  {"", ""}, // d0
  {"MVN", "Move Numeric"}, // d1
  {"MVC", "Move"}, // d2
  {"MVZ", "Move Zone"}, // d3
  {"NC", "AND"}, // d4
  {"CLC", "Compare Logical"}, // d5
  {"OC", "OR"}, // d6
  {"XC", "Exclusive OR"}, // d7
  {"", ""}, // d8
  {"", ""}, // d9
  {"", ""}, // da
  {"", ""}, // db
  {"TR", "Translate"}, // dc
  {"TRT", "Translate and Test"}, // dd
  {"ED", "Edit"}, // de
  {"EDMK", "Edit and Mark"}, // df
  {"", ""}, // e0
  {"", ""}, // e1
  {"", ""}, // e2
  {"", ""}, // e3
  {"", ""}, // e4
  {"", ""}, // e5
  {"", ""}, // e6
  {"", ""}, // e7
  {"", ""}, // e8
  {"", ""}, // e9
  {"", ""}, // ea
  {"", ""}, // eb
  {"", ""}, // ec
  {"", ""}, // ed
  {"", ""}, // ee
  {"", ""}, // ef
  {"", ""}, // f0
  {"MVO", "Move with Offset"}, // f1
  {"PACK", "Pack"}, // f2
  {"UNPK", "Unpack"}, // f3
  {"", ""}, // f4
  {"", ""}, // f5
  {"", ""}, // f6
  {"", ""}, // f7
  {"ZAP", "Zero and Add"}, // f8
  {"CP", "Compare"}, // f9
  {"AP", "Add"}, // fa
  {"SP", "Subtract"}, // fb
  {"MP", "Multiply"}, // fc
  {"DP", "Divide"}, // fd
  {"", ""}, // fe
  {"", ""}, // ff
};

// Pass in a list of 16-bit halfwords
function getName(hw) {
  var op = hw[0] >>> 8; // Opcode
  if (op in instructions) {
    return instructions[op][1];
  } else {
    return 'undefined';
  }
  
}

function disasm(hw) {
  var op = hw[0] >>> 8; // Opcode
  var type = op >>> 6; // Top two bits
  var ic =[1, 2, 2, 3][type]; // Top two bits determine instruction length
  if (!(op in instructions)) {
    return 'undefined';
  } else if (op == 0x83) {
    return "diagnose"; // Diagnose is special case; no op assigned
  } else if (type == 0) {
    // RR
    var r1 = (hw[0] >> 4) & 0xf;
    var r2 = hw[0] & 0xf;
    if ([0x04].includes(op)) { // SPM. Ignore r2
      return instructions[op][0].padEnd(6, ' ') + r1;
    } else if ([0x0a].includes(op)) { // SVC. i field.
      var i = (hw[0] & 0xff).toString(16);
      return instructions[op][0].padEnd(6, ' ') + i;
    } else {
      return instructions[op][0].padEnd(6, ' ') + r1 + ',' + r2;
    }
  } else if (type == 1) {
    // RX
    var r1 = (hw[0] >> 4) & 0xf;
    var x2 = hw[0] & 0xf;
    var b2 = (hw[1] >> 12) & 0xf;
    var d2 = (hw[1] & 0x0fff).toString(16);
    return instructions[op][0].padEnd(6, ' ') + r1 + ',' + d2 + '(' + x2 + ',' + b2 + ')';
  } else if (type == 2) {
    if ([0x84, 0x85, 0x91, 0x92, 0x94, 0x95, 0x96, 0x97].includes(op)) { // MVI, etc
      // SI
      var i2 = (hw[0] & 0xff).toString(16);
      var b1 = (hw[1] >> 12) & 0xf;
      var d1 = (hw[1] & 0x0fff).toString(16);
      return instructions[op][0].padEnd(6, ' ') + d1 + '(' + b1 + '),' + i2;
    } else if ([0x80, 0x82, 0x93, 0x9c, 0x9d, 0x9e, 0x9f].includes(op)) { // IO, LPSW, etc.
      // SI without i2
      var b1 = (hw[1] >> 12) & 0xf;
      var d1 = (hw[1] & 0x0fff).toString(16);
      return instructions[op][0].padEnd(6, ' ') + d1 + '(' + b1 + ')'
    } else {
      // RS
      var r1 = (hw[0] >> 4) & 0xf;
      var r3 = hw[0] & 0xf;
      var b2 = (hw[1] >> 12) & 0xf;
      var d2 = (hw[1] & 0x0fff).toString(16);
      if ([0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f].includes(op)) {
        // Shift. Ignore r3
        return instructions[op][0].padEnd(6, ' ') + r1 + ',' + d2 + '(' + b2 + ')';
      } else {
        return instructions[op][0].padEnd(6, ' ') + r1 + ',' + r3 + ',' + d2 + '(' + b2 + ')';
      }
    }
  } else if (type == 3) {
    // SS
    var l1 = ((hw[0] >> 4) & 0xf) + 1;
    var l2 = (hw[0] & 0xf) + 1;
    var b1 = (hw[1] >> 12) & 0xf;
    var d1 = (hw[1] & 0x0fff).toString(16);
    var b2 = (hw[2] >> 12) & 0xf;
    var d2 = (hw[2] & 0x0fff).toString(16);
    if ([0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xdc, 0xdd, 0xde, 0xdf].includes(op)) { // MVC, etc with single 16-bit L field
      var l = (hw[0] & 0xff) + 1;
      return instructions[op][0].padEnd(6, ' ') + d1 + '(' + l + ',' + b1 + '),' + d2 + '(' + b2 + ')';
    }
    return instructions[op][0].padEnd(6, ' ') + d1 + '(' + l1 + ',' + b1 + '),' + d2 + '(' + l2 + ',' + b2 + ')';
  } else {
    return 'undefined';
  }
}

var instructions = {
0x04: ['SPM', 'Set Program Mask'],
0x05: ['BALR', 'Branch and Link'],
0x06: ['BCTR', 'Branch on Count'],
0x07: ['BCR', 'Branch/Condition'],
0x08: ['SSK', 'Set Key'],
0x09: ['ISK', 'Insert Key'],
0x0a: ['SVC', 'Supervisor Call'],

0x10: ['LPR', 'Load Positive,'],
0x11: ['LNR', 'Load Negative'],
0x12: ['LTR', 'Load and Test'],
0x13: ['LCR', 'Load Complement'],
0x14: ['NR', 'AND'],
0x15: ['CLR', 'Compare Logical'],
0x16: ['OR', 'OR'],
0x17: ['XR', 'Exclusive OR'],
0x18: ['LR', 'Load'],
0x19: ['CR', 'Compare'],
0x1a: ['AR', 'Add'],
0x1b: ['SR', 'Subtract'],
0x1c: ['MR', 'Multiply'],
0x1d: ['DR', 'Divide'],
0x1e: ['ALR', 'Add Logical'],
0x1f: ['SLR', 'Subtract Logical'],

0x20: ['LPDR', 'Load Positive'],
0x21: ['LNDR', 'Load Negative'],
0x22: ['LTDR', 'Load and Test'],
0x23: ['LCDR', 'Load Complement'],
0x24: ['HDR', 'Halve'],
0x25: ['LRDR', 'Load Rounded'],
0x26: ['MXR', 'Multiply'],
0x27: ['MXDR', 'Multiply'],
0x28: ['LDR', 'Load'],
0x29: ['CDR', 'Compare'],
0x2a: ['ADR', 'Add N'],
0x2b: ['SDR', 'Subtract N'],
0x2c: ['MDR', 'Multiply'],
0x2d: ['DDR', 'Divide'],
0x2e: ['AWR', 'Add U'],
0x2f: ['SWR', 'Subtract U'],

0x30: ['LPER', 'Load Positive'],
0x31: ['LNER', 'Load Negative'],
0x32: ['LTER', 'Load and Test'],
0x33: ['LCER', 'Load Complement'],
0x34: ['HER', 'Halve'],
0x35: ['LRER', 'Load Rounded'],
0x36: ['AXR', 'Add Normalized'],
0x37: ['SXR', 'Subtract Normalized'],
0x38: ['LER', 'Load'],
0x39: ['CER', 'Compare'],
0x3a: ['AER', 'Add N'],
0x3b: ['SER', 'Subtract N'],
0x3c: ['MER', 'Multiply'],
0x3d: ['DER', 'Divide'],
0x3e: ['AUR', 'Add U'],
0x3f: ['SUR', 'Subtract U'],

0x40: ['STH', 'Store'],
0x41: ['LA', 'Load Address'],
0x42: ['STC', 'Store Character'],
0x43: ['IC', 'Insert Character'],
0x44: ['EX', 'Execute'],
0x45: ['BAL', 'Branch and Link'],
0x46: ['BCT', 'Branch on Count'],
0x47: ['BC', 'Branch/Condition'],
0x48: ['LH', 'Load'],
0x49: ['CH', 'Compare'],
0x4a: ['AH', 'Add'],
0x4b: ['SH', 'Subtract'],
0x4c: ['MH', 'Multiply'],
0x4e: ['CVD', 'Convert-Decimal'],
0x4f: ['CVB', 'Convert-Binary'],

0x50: ['ST', 'Store'],
0x54: ['N', 'AND'],
0x55: ['CL', 'Compare Logical'],
0x56: ['O', 'OR'],
0x57: ['X', 'Exclusive OR'],
0x58: ['L', 'Load'],
0x59: ['C', 'Compare'],
0x5a: ['A', 'Add'],
0x5b: ['S', 'Subtract'],
0x5c: ['M', 'Multiply'],
0x5d: ['D', 'Divide'],
0x5e: ['AL', 'Add Logical'],
0x5f: ['SL', 'Subtract Logical'],

0x60: ['STD', 'Store'],
0x67: ['MXD', 'Multiply'],
0x68: ['LD', 'Load'],
0x69: ['CD', 'Compare'],
0x6a: ['AD', 'AddN'],
0x6b: ['SD', 'Subtract N'],
0x6c: ['MD', 'Multiply'],
0x6d: ['DD', 'Divide'],
0x6e: ['AW', 'Add U'],
0x6f: ['SW', 'Subtract U'],

0x70: ['STE', 'Store'],
0x78: ['LE', 'Load'],
0x79: ['CE', 'Compare'],
0x7a: ['AE', 'Add N'],
0x7b: ['SE', 'Subtract N'],
0x7c: ['ME', 'Multiply'],
0x7d: ['DE', 'Divide'],
0x7e: ['AU', 'Add U'],
0x7f: ['SU', 'Subtract U'],

0x80: ['SSM', 'Set System Mask'],
0x82: ['LPSW', 'Load PSW'],
0x83: ['diagnose', 'Diagnose'],
0x84: ['WRD', 'Write Direct'],
0x85: ['RDD', 'Read Direct'],
0x86: ['BXH', 'Branch/High'],
0x87: ['BXLE', 'Branch/Low-Equal'],
0x88: ['SRL', 'Shift Right SL'],
0x89: ['SLL', 'Shift Left S L'],
0x8a: ['SRA', 'Shift Right S'],
0x8b: ['SLA', 'Shift Left S'],
0x8c: ['SRDL', 'Shift Right DL'],
0x8d: ['SLDL', 'Shift Left DL'],
0x8e: ['SRDA', 'Shift Right D'],
0x8f: ['SLDA', 'Shift Left D'],

0x90: ['STM', 'Store Multiple'],
0x91: ['TM', 'Test Under Mask'],
0x92: ['MVI', 'Move'],
0x93: ['TS', 'Test and Set'],
0x94: ['NI', 'AND'],
0x95: ['CLI', 'Compare Logical'],
0x96: ['OI', 'OR'],
0x97: ['XI', 'Exclusive OR'],
0x98: ['LM', 'Load Multiple'],
0x9c: ['SIO', 'Start I/O'],
0x9d: ['TIO', 'Test I/O'],
0x9e: ['HIO', 'Halt I/O'],
0x9f: ['TCH', 'Test Channel'],

0xd1: ['MVN', 'Move Numeric'],
0xd2: ['MVC', 'Move'],
0xd3: ['MVZ', 'Move Zone'],
0xd4: ['NC', 'AND'],
0xd5: ['CLC', 'Compare Logical'],
0xd6: ['OC', 'OR'],
0xd7: ['XC', 'Exclusive OR'],
0xdc: ['TR', 'Translate'],
0xdd: ['TRT', 'Translate and Test'],
0xde: ['ED', 'Edit'],
0xdf: ['EDMK', 'Edit and Mark'],

0xf1: ['MVO', 'Move with Offset'],
0xf2: ['PACK', 'Pack'],
0xf3: ['UNPK', 'Unpack'],
0xf8: ['ZAP', 'Zero and Add'],
0xf9: ['CP', 'Compare'],
0xfa: ['AP', 'Add'],
0xfb: ['SP', 'Subtract'],
0xfc: ['MP', 'Multiply'],
0xfd: ['DP', 'Divide'],
};
instr = {
  {"", ""}, // 00
  {"", ""}, // 01
  {"", ""}, // 02
  {"", ""}, // 03
  {"SPM", "Set Program Mask"}, // 04
  {"BALR", "Branch and Link"}, // 05
  {"BCTR", "Branch on Count"}, // 06
  {"BCR", "Branch/Condition"}, // 07
  {"SSK", "Set Key"}, // 08
  {"ISK", "Insert Key"}, // 09
  {"SVC", "Supervisor Call"}, // 0a
  {"", ""}, // 0b
  {"", ""}, // 0c
  {"", ""}, // 0d
  {"", ""}, // 0e
  {"", ""}, // 0f
  {"LPR", "Load Positive,"}, // 10
  {"LNR", "Load Negative"}, // 11
  {"LTR", "Load and Test"}, // 12
  {"LCR", "Load Complement"}, // 13
  {"NR", "AND"}, // 14
  {"CLR", "Compare Logical"}, // 15
  {"OR", "OR"}, // 16
  {"XR", "Exclusive OR"}, // 17
  {"LR", "Load"}, // 18
  {"CR", "Compare"}, // 19
  {"AR", "Add"}, // 1a
  {"SR", "Subtract"}, // 1b
  {"MR", "Multiply"}, // 1c
  {"DR", "Divide"}, // 1d
  {"ALR", "Add Logical"}, // 1e
  {"SLR", "Subtract Logical"}, // 1f
  {"LPDR", "Load Positive"}, // 20
  {"LNDR", "Load Negative"}, // 21
  {"LTDR", "Load and Test"}, // 22
  {"LCDR", "Load Complement"}, // 23
  {"HDR", "Halve"}, // 24
  {"LRDR", "Load Rounded"}, // 25
  {"MXR", "Multiply"}, // 26
  {"MXDR", "Multiply"}, // 27
  {"LDR", "Load"}, // 28
  {"CDR", "Compare"}, // 29
  {"ADR", "Add N"}, // 2a
  {"SDR", "Subtract N"}, // 2b
  {"MDR", "Multiply"}, // 2c
  {"DDR", "Divide"}, // 2d
  {"AWR", "Add U"}, // 2e
  {"SWR", "Subtract U"}, // 2f
  {"LPER", "Load Positive"}, // 30
  {"LNER", "Load Negative"}, // 31
  {"LTER", "Load and Test"}, // 32
  {"LCER", "Load Complement"}, // 33
  {"HER", "Halve"}, // 34
  {"LRER", "Load Rounded"}, // 35
  {"AXR", "Add Normalized"}, // 36
  {"SXR", "Subtract Normalized"}, // 37
  {"LER", "Load"}, // 38
  {"CER", "Compare"}, // 39
  {"AER", "Add N"}, // 3a
  {"SER", "Subtract N"}, // 3b
  {"MER", "Multiply"}, // 3c
  {"DER", "Divide"}, // 3d
  {"AUR", "Add U"}, // 3e
  {"SUR", "Subtract U"}, // 3f
  {"STH", "Store"}, // 40
  {"LA", "Load Address"}, // 41
  {"STC", "Store Character"}, // 42
  {"IC", "Insert Character"}, // 43
  {"EX", "Execute"}, // 44
  {"BAL", "Branch and Link"}, // 45
  {"BCT", "Branch on Count"}, // 46
  {"BC", "Branch/Condition"}, // 47
  {"LH", "Load"}, // 48
  {"CH", "Compare"}, // 49
  {"AH", "Add"}, // 4a
  {"SH", "Subtract"}, // 4b
  {"MH", "Multiply"}, // 4c
  {"", ""}, // 4d
  {"CVD", "Convert-Decimal"}, // 4e
  {"CVB", "Convert-Binary"}, // 4f
  {"ST", "Store"}, // 50
  {"", ""}, // 51
  {"", ""}, // 52
  {"", ""}, // 53
  {"N", "AND"}, // 54
  {"CL", "Compare Logical"}, // 55
  {"O", "OR"}, // 56
  {"X", "Exclusive OR"}, // 57
  {"L", "Load"}, // 58
  {"C", "Compare"}, // 59
  {"A", "Add"}, // 5a
  {"S", "Subtract"}, // 5b
  {"M", "Multiply"}, // 5c
  {"D", "Divide"}, // 5d
  {"AL", "Add Logical"}, // 5e
  {"SL", "Subtract Logical"}, // 5f
  {"STD", "Store"}, // 60
  {"", ""}, // 61
  {"", ""}, // 62
  {"", ""}, // 63
  {"", ""}, // 64
  {"", ""}, // 65
  {"", ""}, // 66
  {"MXD", "Multiply"}, // 67
  {"LD", "Load"}, // 68
  {"CD", "Compare"}, // 69
  {"AD", "AddN"}, // 6a
  {"SD", "Subtract N"}, // 6b
  {"MD", "Multiply"}, // 6c
  {"DD", "Divide"}, // 6d
  {"AW", "Add U"}, // 6e
  {"SW", "Subtract U"}, // 6f
  {"STE", "Store"}, // 70
  {"", ""}, // 71
  {"", ""}, // 72
  {"", ""}, // 73
  {"", ""}, // 74
  {"", ""}, // 75
  {"", ""}, // 76
  {"", ""}, // 77
  {"LE", "Load"}, // 78
  {"CE", "Compare"}, // 79
  {"AE", "Add N"}, // 7a
  {"SE", "Subtract N"}, // 7b
  {"ME", "Multiply"}, // 7c
  {"DE", "Divide"}, // 7d
  {"AU", "Add U"}, // 7e
  {"SU", "Subtract U"}, // 7f
  {"SSM", "Set System Mask"}, // 80
  {"", ""}, // 81
  {"LPSW", "Load PSW"}, // 82
  {"diagnose", "Diagnose"}, // 83
  {"WRD", "Write Direct"}, // 84
  {"RDD", "Read Direct"}, // 85
  {"BXH", "Branch/High"}, // 86
  {"BXLE", "Branch/Low-Equal"}, // 87
  {"SRL", "Shift Right SL"}, // 88
  {"SLL", "Shift Left S L"}, // 89
  {"SRA", "Shift Right S"}, // 8a
  {"SLA", "Shift Left S"}, // 8b
  {"SRDL", "Shift Right DL"}, // 8c
  {"SLDL", "Shift Left DL"}, // 8d
  {"SRDA", "Shift Right D"}, // 8e
  {"SLDA", "Shift Left D"}, // 8f
  {"STM", "Store Multiple"}, // 90
  {"TM", "Test Under Mask"}, // 91
  {"MVI", "Move"}, // 92
  {"TS", "Test and Set"}, // 93
  {"NI", "AND"}, // 94
  {"CLI", "Compare Logical"}, // 95
  {"OI", "OR"}, // 96
  {"XI", "Exclusive OR"}, // 97
  {"LM", "Load Multiple"}, // 98
  {"", ""}, // 99
  {"", ""}, // 9a
  {"", ""}, // 9b
  {"SIO", "Start I/O"}, // 9c
  {"TIO", "Test I/O"}, // 9d
  {"HIO", "Halt I/O"}, // 9e
  {"TCH", "Test Channel"}, // 9f
  {"", ""}, // a0
  {"", ""}, // a1
  {"", ""}, // a2
  {"", ""}, // a3
  {"", ""}, // a4
  {"", ""}, // a5
  {"", ""}, // a6
  {"", ""}, // a7
  {"", ""}, // a8
  {"", ""}, // a9
  {"", ""}, // aa
  {"", ""}, // ab
  {"", ""}, // ac
  {"", ""}, // ad
  {"", ""}, // ae
  {"", ""}, // af
  {"", ""}, // b0
  {"", ""}, // b1
  {"", ""}, // b2
  {"", ""}, // b3
  {"", ""}, // b4
  {"", ""}, // b5
  {"", ""}, // b6
  {"", ""}, // b7
  {"", ""}, // b8
  {"", ""}, // b9
  {"", ""}, // ba
  {"", ""}, // bb
  {"", ""}, // bc
  {"", ""}, // bd
  {"", ""}, // be
  {"", ""}, // bf
  {"", ""}, // c0
  {"", ""}, // c1
  {"", ""}, // c2
  {"", ""}, // c3
  {"", ""}, // c4
  {"", ""}, // c5
  {"", ""}, // c6
  {"", ""}, // c7
  {"", ""}, // c8
  {"", ""}, // c9
  {"", ""}, // ca
  {"", ""}, // cb
  {"", ""}, // cc
  {"", ""}, // cd
  {"", ""}, // ce
  {"", ""}, // cf
  {"", ""}, // d0
  {"MVN", "Move Numeric"}, // d1
  {"MVC", "Move"}, // d2
  {"MVZ", "Move Zone"}, // d3
  {"NC", "AND"}, // d4
  {"CLC", "Compare Logical"}, // d5
  {"OC", "OR"}, // d6
  {"XC", "Exclusive OR"}, // d7
  {"", ""}, // d8
  {"", ""}, // d9
  {"", ""}, // da
  {"", ""}, // db
  {"TR", "Translate"}, // dc
  {"TRT", "Translate and Test"}, // dd
  {"ED", "Edit"}, // de
  {"EDMK", "Edit and Mark"}, // df
  {"", ""}, // e0
  {"", ""}, // e1
  {"", ""}, // e2
  {"", ""}, // e3
  {"", ""}, // e4
  {"", ""}, // e5
  {"", ""}, // e6
  {"", ""}, // e7
  {"", ""}, // e8
  {"", ""}, // e9
  {"", ""}, // ea
  {"", ""}, // eb
  {"", ""}, // ec
  {"", ""}, // ed
  {"", ""}, // ee
  {"", ""}, // ef
  {"", ""}, // f0
  {"MVO", "Move with Offset"}, // f1
  {"PACK", "Pack"}, // f2
  {"UNPK", "Unpack"}, // f3
  {"", ""}, // f4
  {"", ""}, // f5
  {"", ""}, // f6
  {"", ""}, // f7
  {"ZAP", "Zero and Add"}, // f8
  {"CP", "Compare"}, // f9
  {"AP", "Add"}, // fa
  {"SP", "Subtract"}, // fb
  {"MP", "Multiply"}, // fc
  {"DP", "Divide"}, // fd
  {"", ""}, // fe
  {"", ""}, // ff
};
