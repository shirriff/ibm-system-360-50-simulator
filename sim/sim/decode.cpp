#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>
#include <vector>
#include <codecvt>
#include <locale>
#include <algorithm>
#include <regex>
#include "utils.hpp"
#include "decode.hpp"
#include "entry.hpp"

std::string bin(int n, int len) {
    std::ostringstream sstream;
    for (int i = len - 1; i >= 0; i--) {
        sstream << ((n & (1 << i)) ? "1" : "0");
    }
    return sstream.str();
}

// Compute length of UTF-8 string.
unsigned long uLength(std::string s) {
    return std::wstring_convert< std::codecvt_utf8<char32_t>, char32_t >().from_bytes(s).size();
}

// Pad string with spaces on the end
std::string padEnd(int n, std::string s) {
    int padding = int(n - uLength(s));
    if (padding > 0) {
        return s.append(padding, ' ');
    } else {
        return s;
    }
}

// LHS of A expression
std::vector<std::string> labels_RY = {
    /* 0 */ "0",
    /* 1 */ "R",
    /* 2 */ "M",
    /* 3 */ "M23",
    /* 4 */ "H",
    /* 5 */ "SEMT",
};

// True - complement control
std::vector<std::string> labels_TC = {
    /* 0 */ "-",
    /* 1 */ "+",
};
// left input to adder 
std::vector<std::string> labels_LX = {
    /* 0 */ "0",
        /* 1 */ "L",
        /* 2 */ "SGN",
        /* 3 */ "E",
        /* 4 */ "LRL",
        // and L(16-13) to M(16-31) via BUS (0-15) LRL->MHL QE580/070b
        /* 5 */ "LWA",
        /* 6 */ "4",
        /* 7 */ "64C",
    };
    // Adder latch destination
std::vector<std::string> labels_TR = {
        /* 0 */ "T",
        /* 1 */ "R",
        /* 2 */ "R0",
        /* 3 */ "M",
        /* 4 */ "D",
        /* 5 */ "L0",
        /* 6 */ "R,A",
        /* 7 */ "L",
        /* 8 */ "HA→A",
        /* 9 */ "R,AN",
        /* 10 */ "R,AW",
        /* 11 */ "R,AD",
        /* 12 */ "D→IAR",
        /* 13 */ "SCAN→D",
        /* 14 */ "R13",
        /* 15 */ "A",
        /* 16 */ "L,A",
        /* 17 */ "I/O",
        /* 18 */ "undef!!!TR", // not found
        /* 19 */ "I/O",
        /* 20 */ "H",
        /* 21 */ "IA",
        /* 22 */ "FOLD→D",
        /* 23 */ "undef!!!TR", // not found
        /* 24 */ "L,M",
        /* 25 */ "MLJK",
        /* 26 */ "MHL",
        /* 27 */ "MD",
        /* 28 */ "M,SP",
        /* 29 */ "D*BS",
        /* 30 */ "L13",
        /* 31 */ "J",
    };
    // Adder function
std::vector<std::string> labels_AD = {
        /* 0 */ "undef!!!AD", // used by f43?
        /* 1 */ "undef!!!AD", // is default
        /* 2 */ "BCFO",
        /* 3 */  "undef!!!AD", // not found
        /* 4 */ "BC0",
        /* 5 */ "BC⩝C",
        /* 6 */ "BC1B",
        /* 7 */ "BC8",
        /* 8 */ "DHL",
        /* 9 */ "DC0",
        /* 10 */ "DDC0",
        /* 11 */ "DHH",
        /* 12 */ "DCBS",
    };
    /// Shift gate and adder latch control
std::vector<std::string> labels_AL = {
        /* 0 */ "undef!!!AL",
        /* 1 */ "Q→SR1→F",
        /* 2 */ "L0,¬S4→",
        /* 3 */ "+SGN→",
        /* 4 */ "-SGN→",
        /* 5 */ "L0,S4→",
        /* 6 */ "IA→H",
        /* 7 */ "Q→SL→-F",
        /* 8 */ "Q→SL1→F",
        /* 9 */ "F→SL1→F",
        /* 10 */ "SL1→Q",
        /* 11 */ "Q→SL1",
        /* 12 */ "SR1→F",
        /* 13 */ "SR1→Q",
        /* 14 */ "Q→SR1→Q",
        /* 15 */ "F→SL1→Q",
        /* 16 */ "SL4→F",
        /* 17 */ "F→SL4→F",
        /* 18 */ "FPSL4",
        /* 19 */ "F→FPSL4",
        /* 20 */ "SR4→F",
        /* 21 */ "F→SR4→F",
        /* 22 */ "FPSR4→F",
        /* 23 */ "1→FPSR4→F",
        /* 24 */ "SR4→H",
        /* 25 */ "F→SR4",
        /* 26 */ "E→FPSL4",
        /* 27 */ "F→SR1→Q",
        /* 28 */ "DKEY→",
        /* 29 */ "I/O",
        /* 30 */ "D→",
        /* 31 */ "AKEY→",
    };
    // B
    // Mover input left side -> U
std::vector<std::string> labels_LU = {
        /* 0 */ "undef!!!LU",
        /* 1 */ "MD,F",
        /* 2 */ "R3",
        /* 3 */ "I/O",
        /* 4 */ "XTR",
        /* 5 */ "PSW4",
        /* 6 */ "LMB",
        /* 7 */ "LLB",
    };
    // Mover input right side -> V
std::vector<std::string> labels_MV = {
        /* 0 */ "undef!!!MV",
        /* 1 */ "MLB",
        /* 2 */ "MMB",
    };
    // Mover action 0-3 -> WL, -> WR
    // Combined if same?
std::vector<std::string> labels_UL = {
        /* 0 */ "E",
        /* 1 */ "U",
        /* 2 */ "V",
        /* 3 */ "?",
    };
std::vector<std::string> labels_UR = {
        /* 0 */ "E",
        /* 1 */ "U",
        /* 2 */ "V",
        /* 3 */ "?",
    };
    // Mover output destination W ->
std::vector<std::string> labels_WM = {
        /* 0 */ "undef!!!WM",
        /* 1 */ "W→MMB",
        /* 2 */ "W67→MB",
        /* 3 */ "W67→LB",
        /* 4 */ "W27→PSW4",
        /* 5 */ "W→PSW0",
        /* 6 */ "WL→J",
        /* 7 */ "W→CHCTL",
        /* 8 */ "W,E→A(BUMP)",
        /* 9 */ "WL→G1",
        /* 10 */ "WR→G2",
        /* 11 */ "W→G",
        /* 12 */ "W→MMB(E?)",
        /* 13 */ "WL→MD",
        /* 14 */ "WR→F",
        /* 15 */ "W→MD,F",
    };
    // D
    // Counter function control
std::vector<std::string> labels_UP = {
        /* 0 */ "0→",
        /* 1 */ "3→",
        /* 2 */ "-",
        /* 3 */ "+",
    };
    // Select L byte counter
std::vector<std::string> labels_LB = {
        /* 0 */ "0",
        /* 1 */ "1",
    };
    // Select M byte counter
std::vector<std::string> labels_MB = {
        /* 0 */ "undef!!!MB",
        /* 1 */ "1",
    };

    // Length counter and carry insert ctrl
std::vector<std::string> labels_DG = {
        /* 0 */ "undef!!!DG",
        /* 1 */ "CSTAT→ADDER",
        /* 2 */ "HOT1→ADDER",
        /* 3 */ "G1-1",
        /* 4 */ "HOT1,G-1",
        /* 5 */ "G2-1",
        /* 6 */ "G-1",
        /* 7 */ "G1,2-1",
    };
    // Local storage addressing
std::vector<std::string> labels_WS = {
        /* 0 */ "undef!!!WS",
        /* 1 */ "WS1→LSA",
        /* 2 */ "WS2→LSA",
        /* 3 */ "WS,E→LSA",
        /* 4 */ "FN,J→LSA",
        /* 5 */ "FN,JΩ1→LSA",
        /* 6 */ "FN,MD→LSA",
        /* 7 */ "FN,MDΩ1→LSA",
    };
    // Local storage function
std::vector<std::string> labels_SF = {
        /* 0 */ "R→LS",
        /* 1 */ "LS→L,R→LS",
        /* 2 */ "LS→R→LS",
        /* 3 */ "UNUSED",
        /* 4 */ "L→LS",
        /* 5 */ "LS→R,L→LS",
        /* 6 */ "LS→L→LS",
        /* 7 */ "undef!!!SF",
    };
    // Instruction address reg control
std::vector<std::string> labels_IV = {
        /* 0 */ "undef!!!IV",
        /* 1 */ "WL→IVD",
        /* 2 */ "WR→IVD",
        /* 3 */ "W→IVD",
        /* 4 */ "IA/4→A,IA",
        /* 5 */ "IA+2/4",
        /* 6 */ "IA+2",
        /* 7 */ "IA+0/2→A",
    };
    // Suppress memory instruction fetch / ROS address control
std::vector<std::string> labels_ZN = {
        /* 0 */ "--ROAR--",
        /* 1 */ "SMIF",
        /* 2 */ "AΩ(B=0)→A",
        /* 3 */ "AΩ(B=1)→A",
        /* 4 */ "2",
        /* 5 */ "unused",
        /* 6 */ "BΩ(A=0)→B",
        /* 7 */ "BΩ(A=1)→B",
    };
    // C/*  */ Stat setting and misc control
std::vector<std::string> labels_SS = {
        /* 0 */ "undef!!!SS",
        /* 1 */ "undef!!!SS",
        /* 2 */ "undef!!!SS",
        /* 3 */ "D→CR*BS",
        /* 4 */ "E→SCANCTL",
        /* 5 */ "L,RSGNS",
        /* 6 */ "IVD/RSGNS",
        /* 7 */ "EDITSGN",
        /* 8 */ "E→S03",
        /* 9 */ "S03ΩE,1→LSGN",
        /* 10 */ "S03ΩE",
        /* 11 */ "S03ΩE,0→BS",
        /* 12 */ "X0,B0,1SYL",
        /* 13 */ "FPZERO",
        /* 14 */ "FPZERO,E→FN",
        /* 15 */ "B0,1SYL",
        /* 16 */ "S03.¬E",
        /* 17 */ "(T=0)→S3",
        /* 18 */ "E→BS,T30→S3",
        /* 19 */ "E→BS",
        /* 20 */ "1→BS*MB",
        /* 21 */ "undef!!!SS", // not found
        /* 22 */ "undef!!!SS", // not found
        /* 23 */ "MANUAL→STOP",
        /* 24 */ "E→S47",
        /* 25 */ "S47ΩE",
        /* 26 */ "S47.¬E",
        /* 27 */ "S47,ED*FP",
        /* 28 */ "OPPANEL→S47",
        /* 29 */ "CAR,(T≠0)→CR",
        /* 30 */ "KEY→F",
        /* 31 */ "F→KEY",
        /* 32 */ "1→LSGNS",
        /* 33 */ "0→LSGNS",
        /* 34 */ "1→RSGNS",
        /* 35 */ "0→RSGNS",
        /* 36 */ "L(0)→LSGNS",
        /* 37 */ "R(0)→RSGNS",
        /* 38 */ "E(13)→WFN",
        /* 39 */ "E(23)→LSFN",
        /* 40 */ "E(23)→CR",
        /* 41 */ "SETCRALG",
        // T=0, 00->CR, if T<0, 01->CR, if 0<T, 10->CR QB/* 100 */0284, QE580/222.
        /* 42 */ "SETCRLOG",
        // QP102//* 0641 */ If T*BS=0: 00->CR. If T*BS != 0 and CAR(0) =0: 01->CR. If T*BS != 0 and CAR(0)=1: 10->CR
        /* 43 */ "¬S4,S4→CR",
        /* 44 */ "S4,¬S4→CR",
        /* 45 */ "1→REFETCH",
        /* 46 */ "SYNC→OPPANEL",
        /* 47 */ "SCAN*E,10",
        /* 48 */ "I/O",
        /* 49 */ "undef!!!SS", // not found
        /* 50 */ "E(0)→IBFULL",
        /* 51 */ "undef!!!SS", // not found
        /* 52 */ "E→CH",
        /* 53 */ "undef!!!SS", // not found
        /* 54 */ "1→TIMERIRPT",
        /* 55 */ "T→PSW,IPL→T",
        /* 56 */ "T→PSW",
        /* 57 */ "SCAN*E,00",
        /* 58 */ "1→IOMODE",
    };
    // ROAR values for ZN=0
std::vector<std::string> labels_ZF = {
        /* 0 */ "undef!!!ZF",
        /* 1 */ "undef!!!ZF",
        /* 2 */ "D→ROAR,SCAN",
        /* 3 */ "undef!!!ZF",
        /* 4 */ "undef!!!ZF",
        /* 5 */ "undef!!!ZF",
        /* 6 */ "M(03)→ROAR",
        /* 7 */ "undef!!!ZF",
        /* 8 */ "M(47)→ROAR",
        /* 9 */ "undef!!!ZF",
        /* 10 */ "F→ROAR",
        /* 11 */ "undef!!!ZF",
        /* 12 */ "ED→ROAR",
    };
    // Condition test (left side)
std::vector<std::string> labels_AB = {
        /* 0 */ "0",
        /* 1 */ "1",
        /* 2 */ "S0",
        /* 3 */ "S1",
        /* 4 */ "S2",
        /* 5 */ "S3",
        /* 6 */ "S4",
        /* 7 */ "S5",
        /* 8 */ "S6",
        /* 9 */ "S7",
        /* 10 */ "CSTAT",
        /* 11 */ "undef!!!AB", // not found
        /* 12 */ "1SYLS",
        /* 13 */ "LSGNS",
        /* 14 */ "⩝SGNS",
        /* 15 */ "undef!!!AB", // not found
        /* 16 */ "CRMD",
        /* 17 */ "W=0",
        /* 18 */ "WL=0",
        /* 19 */ "WR=0",
        /* 20 */ "MD=FP",
        /* 21 */ "MB=3",
        /* 22 */ "MD3=0",
        /* 23 */ "G1=0",
        /* 24 */ "G1<0",
        /* 25 */ "G<4",
        /* 26 */ "G1MBZ",
        /* 27 */ "I/O",
        /* 28 */ "I/O",
        /* 29 */ "R(31)",
        /* 30 */ "F(2)",
        /* 31 */ "L(0)",
        /* 32 */ "F=0",
        /* 33 */ "UNORM",
        /* 34 */ "TZ*BS",
        /* 35 */ "EDITPAT",
        /* 36 */ "PROB",
        /* 37 */ "TIMUP",
        /* 38 */  "undef!!!AB", // not found
        /* 39 */ "GZ/MB3",
        /* 40 */ "undef!!!AB", // not found
        /* 41 */ "LOG",
        /* 42 */ "STC=0",
        /* 43 */ "G2<=LB",
        /* 44 */ "undef!!!AB", // not found
        /* 45 */ "D(7)",
        /* 46 */ "SCPS",
        /* 47 */ "SCFS",
        /* 48 */ "I/O",
        /* 49 */ "W(67)→AB",
        /* 50 */ "I/O",
        /* 51 */ "I/O",
        /* 52 */ "I/O",
        /* 53 */ "I/O",
        /* 54 */ "CANG",
        /* 55 */ "CHLOG",
        /* 56 */ "I-FETCH",
        /* 57 */ "IA(30)",
        /* 58 */ "EXT,CHIRPT",
        /* 59 */ "undef!!!AB", // not found
        /* 60 */ "PSS",
        /* 61 */ "undef!!!AB",
        /* 62 */ "undef!!!AB",
        /* 63 */ "RX.S0",
    };
std::vector<std::string> labels_BB = {
        /* 0 */ "0",
        /* 1 */ "1",
        /* 2 */ "S0",
        /* 3 */ "S1",
        /* 4 */ "S2",
        /* 5 */ "S3",
        /* 6 */ "S4",
        /* 7 */ "S5",
        /* 8 */ "S6",
        /* 9 */ "S7",
        /* 10 */ "RSGNS",
        /* 11 */ "HSCH",
        /* 12 */ "EXC",
        /* 13 */ "WR=0",
        /* 14 */ "undef!!!BB", // unused
        /* 15 */ "T13=0",
        /* 16 */ "T(0)",
        /* 17 */ "T=0",
        /* 18 */ "TZ*BS",
        /* 19 */ "W=1",
        /* 20 */ "LB=0",
        /* 21 */ "LB=3",
        /* 22 */ "MD=0",
        /* 23 */ "G2=0",
        /* 24 */ "G2<0",
        /* 25 */ "G2LBZ",
        /* 26 */ "I/O",
        /* 27 */ "MD/JI",
        /* 28 */ "IVA",
        /* 29 */ "I/O",
        /* 30 */ "(CAR)",
        /* 31 */ "(Z00)",
    };

uint16_t nextaddr = 0;
// Generates the info box for the given entry at addr.
// Returns array of strings.
// Addr is a 4-digit hex string.
std::vector<std::string> decode(uint16_t addr, Entry_t entry) {
    std::vector<std::string> result;
    result.push_back("---------- " + fmt2uc(addr));
    if (entry.CE) {
        padbox(result, "E", bin(entry.CE, 4));
    }
    if (entry.AL == 28 || entry.AL == 30 || entry.AL == 31 || entry.TR == 12 || entry.TR == 22 || entry.TR == 13) {
        // Handled by D
    }
    else if (entry.TR == 8) {
        // Handled by S
    }
    else {
        if (entry.RY || entry.LX || entry.TR) {
            std::string lx = labels_LX[entry.LX];
            if (entry.TC == 0 && entry.LX == 0) {
                lx = "1"; // -0 turns into -1 for some reason, 1"s complement?
            }
            std::string line = labels_RY[entry.RY] + labels_TC[entry.TC] + lx + "→" + labels_TR[entry.TR];
            line = std::regex_replace(line, std::regex("0\\+"), "");
            line = std::regex_replace(line, std::regex("\\+0"), "");
            line = std::regex_replace(line, std::regex("0-"), "-");
            padbox(result, "A", line);
        }
        std::string l;
        std::string r;
        if (entry.AL == 6) {
            // Handled by D
        }
        else if (entry.AL) {
            r = labels_AL[entry.AL];
        }
        if (entry.AD != 1) {
            l = labels_AD[entry.AD];
        }
        if (l.length() > 0 || r.length() > 0) {
            padbox(result, "A", l, r);
        }
    }
    // B entry
    if (entry.RY == 5) {
        padbox(result, "B", "", labels_RY[entry.RY]);
    }
    std::string lu;
    if (entry.LU) {
        lu = labels_LU[entry.LU] + "→U";
    }
    std::string lv;
    if (entry.MV) {
        lv = labels_MV[entry.MV] + "→V";
    }
    if (lu.length() > 0 || lv.length() > 0) {
        padbox(result, "B", lu, lv);
    }
    if ((lu.length() > 0 || entry.UL != 1) && entry.UL == entry.UR) {
        padbox(result, "B", labels_UL[entry.UL] + "→W");
    }
    else if (entry.UL != 1 || entry.UR != 1) {
        std::string ul = "      ";
        std::string ur = "      ";
        if (entry.UL != 1 || entry.UR == 3) {
            ul = padEnd(6, std::regex_replace(labels_UL[entry.UL] + "L→WL", std::regex("EL"), "E"));
        }
        if (entry.UR != 1 || entry.UL == 0) {
            ur = std::regex_replace(labels_UR[entry.UR] + "R→WR", std::regex("ER"), "E");
            ur = padEnd(6, std::regex_replace(ur, std::regex("\\?R"), "?"));
        }
        result.push_back("B " + ul + ur + "|");
    }
    if (entry.WM) {
        padbox(result, "B", labels_WM[entry.WM]);
    }
    if (entry.AL == 6) {
        padbox(result, "D", labels_AL[entry.AL]);
    }
    else if (entry.AL == 28 || entry.AL == 30 || entry.AL == 31) {
        padbox(result, "D", labels_AL[entry.AL] + labels_TR[entry.TR]);
    }
    // Combine LB, MB, MD into 1
    std::string names;
    int n = 0;
    for (int i = 0; i < 3; i++) {
        std::string key;
        int n0 = 0;
        if (i == 0) {
           n0 = entry.LB;
           key = "LB";
        } else if (i == 1) {
           n0 = entry.MB;
           key = "MB";
        } else {
           n0 = entry.MD;
           key = "MD";
        }
        if (n0 != 0) {
            n = n0;
            if (names.length() > 0) {
                names += ",";
            }
            names += key;
        }
    }
    if (n != 0) {
        if (entry.UP == 0 || entry.UP == 1) {
            padbox(result, "D", labels_UP[entry.UP] + names);
        }
        else {
            padbox(result, "D", names + labels_UP[entry.UP] + std::to_string(n));
        }
    }
    if (entry.DG) {
        padbox(result, "D", labels_DG[entry.DG]);
    }
    if (entry.TR == 12 || entry.TR == 13 || entry.TR == 22) {
        padbox(result, "D", labels_TR[entry.TR]);
    }
    if (entry.WS != 4 || entry.SF != 7) {
        padbox(result, "L", labels_WS[entry.WS]);
    }
    if (entry.SF != 7) {
        padbox(result, "L", labels_SF[entry.SF]);
    }
    if (entry.TR == 8) {
        padbox(result, "S", labels_TR[entry.TR]);
    }
    std::string iv;
    if (entry.IV) {
        iv = labels_IV[entry.IV];
        if (iv.find("→") != std::string::npos) {
            // Assignments go into S
            padbox(result, "S", iv);
            iv = "";
        }
    }
    std::string ss;
    if (entry.SS) {
        ss = labels_SS[entry.SS];
    }
    if (iv.length () > 0) {
        padbox(result, "C", iv, ss);
    }
    else if (ss.length() > 0) {
        padbox(result, "C", ss);
    }
    if (result.size() == 1) {
        result.push_back("|             |");
        result.push_back("| NOP         |");
    }
    int nextaddr = entry.ZP << 6;
    std::string addr03;
    if (entry.ZN == 0) {
        padbox(result, "R", labels_ZF[entry.ZF]);
        addr03 = "****";
    }
    else if (entry.ZN != 4) {
        padbox(result, "R", labels_ZN[entry.ZN]);
        nextaddr |= entry.ZF << 2;
        addr03 = "    ";
    }
    else {
        nextaddr |= entry.ZF << 2;
        addr03 = "    ";
    }
    while (result.size() < 6) {
        result.push_back("|             |");
    }
    if (entry.AB <= 1 && entry.BB <= 1) {
    }
    else {
        std::string ab = labels_AB[entry.AB];
        std::string bb = labels_BB[entry.BB];
        if (entry.BB == 0 && (entry.AB == 56 || entry.AB == 58)) {
            // Sometimes suppress BB=0?
            bb = "";
        }
        else if (entry.BB == 1 && (entry.AB == 34)) {
            // Sometimes suppress BB=1?
            bb = "";
        }
        if (entry.AB == 1 && (entry.BB == 2 || entry.BB == 23 || entry.BB == 30)) {
            ab = "";
        }
        // Pad so ab + bb have length 11
        bb.insert(0, 11 - uLength(ab) - uLength(bb), ' ');

        padbox(result, "R", ab + bb);
    }
    while (result.size() < 7) {
        result.push_back("|             |");
    }
    std::string nextlabel = "Next: ";
    std::string achar = "*";
    std::string bchar = "*";
    if (entry.AB <= 1) {
        nextaddr |= (entry.AB << 1);
        achar = "X";
    }
    if (entry.BB <= 1 && entry.AB != 56 && entry.AB != 49) {
        nextaddr |= entry.BB;
        bchar = "X";
    }
    result.push_back("----" + addr03 + achar + bchar + " ----");
    std::string nextaddr_pad = fmt2(nextaddr);
    result.push_back(nextlabel + nextaddr_pad);
    return result;
}

// Pad s1 on the right to make a box
// Append to result.
// If s2 is present, put it to the right of s1
void padbox(std::vector<std::string> &result, std::string label, std::string s1, std::string s2) {
    if (s2.length() == 0) {
        result.push_back(label + " " + padEnd(12, s1) + "|");
    } else {
        int spacing1 = std::max<int>(0, std::min<int>(5, int(11 - uLength(s1) - uLength(s2))));
        std::string part1 = padEnd(spacing1, s1);
        int spacing2 = std::max<int>(0, int(11 - uLength(part1)));
        result.push_back(label + " " + part1 + " " + padEnd(spacing2, s2) + "|");
    }
}
