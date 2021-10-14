// Disassemble an IBM System/360 instruction

#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>
#include <vector>

typedef struct instr {
    std::string op;
    std::string text;
} instr;

instr instructions[256] = {
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
std::string getName(std::vector<uint16_t> hw) {
    uint16_t op = hw[0] >> 8; // Opcode
    return instructions[op].text;
}

std::string disasm(std::vector<uint16_t> hw) {
    uint16_t op = hw[0] >> 8; // Opcode
    uint16_t type = op >> 6; // Top two bits
    uint16_t ic;
    // Top two bits determine instruction length
    if (type == 0) {
        ic = 1;
    } else if (type == 1 || type == 2) {
        ic = 2;
    } else if (type ==3) {
        ic = 3;
    } else {
        std::cerr << "Bad type " << type << "\n";
        return "";
    }
    std::string opcode = instructions[op].op;
    std::stringstream stream;
    stream << std::left << std::setw(6) << std::setfill(' ') << opcode;
    if (opcode == "") {
        return "undefined";
    } else if (op == 0x83) {
        return "diagnose"; // Diagnose is special case; no op assigned
    } else if (type == 0) {
        // RR
        uint16_t r1 = (hw[0] >> 4) & 0xf;
        uint16_t r2 = hw[0] & 0xf;
        if (op == 0x04) { // SPM. Ignore r2
            stream << r1;
        } else if (op == 0x0a) { // SVC. i field.
            uint16_t i = (hw[0] & 0xff);
            stream << std::hex << i;
        } else {
            stream << r1 << ',' << r2;
        }
    } else if (type == 1) {
        // RX
        uint16_t r1 = (hw[0] >> 4) & 0xf;
        uint16_t x2 = hw[0] & 0xf;
        uint16_t b2 = (hw[1] >> 12) & 0xf;
        uint16_t d2 = hw[1] & 0x0fff;
        stream << r1 << ',' << std::hex << d2 << '(' << std::dec << x2 << ',' << b2 << ')';
    } else if (type == 2) {
        if (op == 0x84 || op == 0x85 || op == 0x91 || op == 0x92 || op == 0x94 || op == 0x95 || op == 0x96 || op == 0x97) { // MVI etc
            // SI
            uint16_t i2 = (hw[0] & 0xff);
            uint16_t b1 = (hw[1] >> 12) & 0xf;
            uint16_t d1 = hw[1] & 0x0fff;
            stream << std::hex << d1 << '(' << std::dec << b1 << ")," << std::hex << i2;
        } else if (op == 0x80 || op == 0x82 || op == 0x93 || op == 0x9c || op == 0x9d || op == 0x9e || op == 0x9f) { // IO LPSW etc.
            // SI without i2
            uint16_t b1 = (hw[1] >> 12) & 0xf;
            uint16_t d1 = hw[1] & 0x0fff;
            stream << std::hex << d1 << '(' << std::dec << b1 << ')';
        } else {
            // RS
            uint16_t r1 = (hw[0] >> 4) & 0xf;
            uint16_t r3 = hw[0] & 0xf;
            uint16_t b2 = (hw[1] >> 12) & 0xf;
            uint16_t d2 = hw[1] & 0x0fff;
            if (op == 0x88 || op == 0x89 || op == 0x8a || op == 0x8b || op == 0x8c || op == 0x8d || op == 0x8e || op == 0x8f) {
                // Shift. Ignore r3
                stream << r1 << ',' << std::hex << d2 << '(' << std::dec << b2 << ')';
            } else {
                stream << r1 << ',' << r3 << ',' << std::hex << d2 << '(' << std::dec << b2 << ')';
            }
        }
    } else if (type == 3) {
        // SS
        uint16_t l1 = ((hw[0] >> 4) & 0xf) + 1;
        uint16_t l2 = (hw[0] & 0xf) + 1;
        uint16_t b1 = (hw[1] >> 12) & 0xf;
        uint16_t d1 = hw[1] & 0x0fff;
        uint16_t b2 = (hw[2] >> 12) & 0xf;
        uint16_t d2 = hw[2] & 0x0fff;
        if (op == 0xd1 || op == 0xd2 || op == 0xd3 || op == 0xd4 || op == 0xd5 || op == 0xd6 || op == 0xd7 || op == 0xdc || op == 0xdd || op == 0xde || op == 0xdf) { // MVC, etc with single 16-bit L field
            uint16_t l = (hw[0] & 0xff) + 1;
            stream << std::hex << d1 << '(' << std::dec << l << ',' << b1 << ")," << std::hex << d2 << '(' << b2 << ')';
        } else {
            stream << std::hex << d1 << '(' << std::dec << l1 << ',' << b1 << ")," << std::hex << d2 << '(' << l2 << ',' << b2 << ')';
        }
    } else {
        return "undefined";
    }
    return stream.str();
}
