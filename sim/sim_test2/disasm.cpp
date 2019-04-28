#include "catch.hpp"
#include "disasm.hpp"

// Wrapper so we can easily pass the array in.
std::string disasmWrapper(std::vector<uint16_t> hw) {
  return disasm(&hw[0]);
}

std::string getNameWrapper(std::vector<uint16_t> hw) {
    return getName(&hw[0]);
}

TEST_CASE( "load") {
  REQUIRE( disasmWrapper({0x1812}) == "LR    1,2");
  REQUIRE( disasmWrapper({0x5812, 0x3abc}) == "L     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4812, 0x3abc}) == "LH    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x1212}) == "LTR   1,2");
  REQUIRE( disasmWrapper({0x1312}) == "LCR   1,2");
  REQUIRE( disasmWrapper({0x1012}) == "LPR   1,2");
  REQUIRE( disasmWrapper({0x1112}) == "LNR   1,2");
  REQUIRE( disasmWrapper({0x9812, 0x3abc}) == "LM    1,2,abc(3)");
}

TEST_CASE( "add") {
  REQUIRE( disasmWrapper({0x1a12}) == "AR    1,2");
  REQUIRE( disasmWrapper({0x5a12, 0x3abc}) == "A     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4a12, 0x3abc}) == "AH    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x1e12}) == "ALR   1,2");
  REQUIRE( disasmWrapper({0x5e12, 0x3abc}) == "AL    1,abc(2,3)");
}

TEST_CASE( "subtract") {
  REQUIRE( disasmWrapper({0x1b12}) == "SR    1,2");
  REQUIRE( disasmWrapper({0x5b12, 0x3abc}) == "S     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4b12, 0x3abc}) == "SH    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x1f12}) == "SLR   1,2");
  REQUIRE( disasmWrapper({0x5f12, 0x3abc}) == "SL    1,abc(2,3)");
}

TEST_CASE( "compare") {
  REQUIRE( disasmWrapper({0x1912}) == "CR    1,2");
  REQUIRE( disasmWrapper({0x5912, 0x3abc}) == "C     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4912, 0x3abc}) == "CH    1,abc(2,3)");
}

TEST_CASE( "multiply") {
  REQUIRE( disasmWrapper({0x1c12}) == "MR    1,2");
  REQUIRE( disasmWrapper({0x5c12, 0x3abc}) == "M     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4c12, 0x3abc}) == "MH    1,abc(2,3)");
}

TEST_CASE( "divide") {
  REQUIRE( disasmWrapper({0x1d12}) == "DR    1,2");
  REQUIRE( disasmWrapper({0x5d12, 0x3abc}) == "D     1,abc(2,3)");
}

TEST_CASE( "convert") {
  REQUIRE( disasmWrapper({0x4f12, 0x3abc}) == "CVB   1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4e12, 0x3abc}) == "CVD   1,abc(2,3)");
}

TEST_CASE( "store") {
  REQUIRE( disasmWrapper({0x5012, 0x3abc}) == "ST    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4012, 0x3abc}) == "STH   1,abc(2,3)");
  REQUIRE( disasmWrapper({0x9012, 0x3abc}) == "STM   1,2,abc(3)");
}

TEST_CASE( "shift") {
  REQUIRE( disasmWrapper({0x8b1f, 0x3abc}) == "SLA   1,abc(3)");
  REQUIRE( disasmWrapper({0x8a1f, 0x3abc}) == "SRA   1,abc(3)");
  REQUIRE( disasmWrapper({0x8f1f, 0x3abc}) == "SLDA  1,abc(3)");
  REQUIRE( disasmWrapper({0x8e1f, 0x3abc}) == "SRDA  1,abc(3)");
}

TEST_CASE( "decimal") {
  // l1=1, l2=2, b1=3, d1=abc, b2=4, d2=def
  REQUIRE( disasmWrapper({0xfa12, 0x3abc, 0x4def}) == "AP    abc(2,3),def(3,4)");
  REQUIRE( disasmWrapper({0xfb12, 0x3abc, 0x4def}) == "SP    abc(2,3),def(3,4)");
  REQUIRE( disasmWrapper({0xf842, 0x9000, 0x9500}) == "ZAP   0(5,9),500(3,9)");
  REQUIRE( disasmWrapper({0xf912, 0x3abc, 0x4def}) == "CP    abc(2,3),def(3,4)");
  REQUIRE( disasmWrapper({0xfd12, 0x3abc, 0x4def}) == "DP    abc(2,3),def(3,4)");
  REQUIRE( disasmWrapper({0xf212, 0x3abc, 0x4def}) == "PACK  abc(2,3),def(3,4)");
  REQUIRE( disasmWrapper({0xf312, 0x3abc, 0x4def}) == "UNPK  abc(2,3),def(3,4)");
  REQUIRE( disasmWrapper({0xf112, 0x3abc, 0x4def}) == "MVO   abc(2,3),def(3,4)");
  REQUIRE( disasmWrapper({0xfc12, 0x3abc, 0x4def}) == "MP    abc(2,3),def(3,4)");
}

TEST_CASE( "float") {
  REQUIRE( disasmWrapper({0x3812}) == "LER   1,2");
  REQUIRE( disasmWrapper({0x7812, 0x3abc}) == "LE    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2812}) == "LDR   1,2");
  REQUIRE( disasmWrapper({0x3212}) == "LTER  1,2");
  REQUIRE( disasmWrapper({0x2212}) == "LTDR  1,2");
  REQUIRE( disasmWrapper({0x3312}) == "LCER  1,2");
  REQUIRE( disasmWrapper({0x2312}) == "LCDR  1,2");
  REQUIRE( disasmWrapper({0x3012}) == "LPER  1,2");
  REQUIRE( disasmWrapper({0x2012}) == "LPDR  1,2");
  REQUIRE( disasmWrapper({0x3112}) == "LNER  1,2");
  REQUIRE( disasmWrapper({0x2112}) == "LNDR  1,2");
  REQUIRE( disasmWrapper({0x3a12}) == "AER   1,2");
  REQUIRE( disasmWrapper({0x7a12, 0x3abc}) == "AE    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2a12}) == "ADR   1,2");
  REQUIRE( disasmWrapper({0x6a12, 0x3abc}) == "AD    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x3e12}) == "AUR   1,2");
  REQUIRE( disasmWrapper({0x7e12, 0x3abc}) == "AU    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2e12}) == "AWR   1,2");
  REQUIRE( disasmWrapper({0x6e12, 0x3abc}) == "AW    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x3b12}) == "SER   1,2");
  REQUIRE( disasmWrapper({0x7b12, 0x3abc}) == "SE    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2b12}) == "SDR   1,2");
  REQUIRE( disasmWrapper({0x6b12, 0x3abc}) == "SD    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x3f12}) == "SUR   1,2");
  REQUIRE( disasmWrapper({0x7f12, 0x3abc}) == "SU    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2f12}) == "SWR   1,2");
  REQUIRE( disasmWrapper({0x6f12, 0x3abc}) == "SW    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x3912}) == "CER   1,2");
  REQUIRE( disasmWrapper({0x7912, 0x3abc}) == "CE    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2912}) == "CDR   1,2");
  REQUIRE( disasmWrapper({0x6912, 0x3abc}) == "CD    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x3412}) == "HER   1,2");
  REQUIRE( disasmWrapper({0x2412}) == "HDR   1,2");
  REQUIRE( disasmWrapper({0x3c12}) == "MER   1,2");
  REQUIRE( disasmWrapper({0x7c12, 0x3abc}) == "ME    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2c12}) == "MDR   1,2");
  REQUIRE( disasmWrapper({0x6c12, 0x3abc}) == "MD    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x3d12}) == "DER   1,2");
  REQUIRE( disasmWrapper({0x7d12, 0x3abc}) == "DE    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x2d12}) == "DDR   1,2");
  REQUIRE( disasmWrapper({0x7012, 0x3abc}) == "STE   1,abc(2,3)");
  REQUIRE( disasmWrapper({0x6012, 0x3abc}) == "STD   1,abc(2,3)");

  REQUIRE( disasmWrapper({0x3512}) == "LRER  1,2");
  REQUIRE( disasmWrapper({0x2512}) == "LRDR  1,2");
  REQUIRE( disasmWrapper({0x3612}) == "AXR   1,2");
  REQUIRE( disasmWrapper({0x3712}) == "SXR   1,2");
  REQUIRE( disasmWrapper({0x2612}) == "MXR   1,2");
  REQUIRE( disasmWrapper({0x2712}) == "MXDR  1,2");
  REQUIRE( disasmWrapper({0x6712, 0x3abc}) == "MXD   1,abc(2,3)");
}

TEST_CASE( "logical") {
  REQUIRE( disasmWrapper({0x9212, 0x3abc}) == "MVI   abc(3),12");
  REQUIRE( disasmWrapper({0xd207, 0x1000, 0x2000}) == "MVC   0(8,1),0(2)");
  REQUIRE( disasmWrapper({0xd112, 0x3abc, 0x4def}) == "MVN   abc(19,3),def(4)");
  REQUIRE( disasmWrapper({0xd312, 0x3abc, 0x4def}) == "MVZ   abc(19,3),def(4)");
  REQUIRE( disasmWrapper({0x1512}) == "CLR   1,2");
  REQUIRE( disasmWrapper({0x5512, 0x3abc}) == "CL    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x9512, 0x3abc}) == "CLI   abc(3),12");
  REQUIRE( disasmWrapper({0xd512, 0x3abc, 0x4def}) == "CLC   abc(19,3),def(4)");

  REQUIRE( disasmWrapper({0x1412}) == "NR    1,2");
  REQUIRE( disasmWrapper({0x5412, 0x3abc}) == "N     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x9412, 0x3abc}) == "NI    abc(3),12");
  REQUIRE( disasmWrapper({0xd412, 0x3abc, 0x4def}) == "NC    abc(19,3),def(4)");

  REQUIRE( disasmWrapper({0x1612}) == "OR    1,2");
  REQUIRE( disasmWrapper({0x5612, 0x3abc}) == "O     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x9612, 0x3abc}) == "OI    abc(3),12");
  REQUIRE( disasmWrapper({0xd612, 0x3abc, 0x4def}) == "OC    abc(19,3),def(4)");

  REQUIRE( disasmWrapper({0x1712}) == "XR    1,2");
  REQUIRE( disasmWrapper({0x5712, 0x3abc}) == "X     1,abc(2,3)");
  REQUIRE( disasmWrapper({0x9712, 0x3abc}) == "XI    abc(3),12");
  REQUIRE( disasmWrapper({0xd712, 0x3abc, 0x4def}) == "XC    abc(19,3),def(4)");

  REQUIRE( disasmWrapper({0x9112, 0x3abc}) == "TM    abc(3),12");
  REQUIRE( disasmWrapper({0x4312, 0x3abc}) == "IC    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4212, 0x3abc}) == "STC   1,abc(2,3)");
  REQUIRE( disasmWrapper({0x4112, 0x3abc}) == "LA    1,abc(2,3)");

  REQUIRE( disasmWrapper({0xdc12, 0x3abc, 0x4def}) == "TR    abc(19,3),def(4)");
  REQUIRE( disasmWrapper({0xdd12, 0x3abc, 0x4def}) == "TRT   abc(19,3),def(4)");
  REQUIRE( disasmWrapper({0xde12, 0x3abc, 0x4def}) == "ED    abc(19,3),def(4)");
  REQUIRE( disasmWrapper({0xdf12, 0x3abc, 0x4def}) == "EDMK  abc(19,3),def(4)");

  REQUIRE( disasmWrapper({0x891f, 0x3abc}) == "SLL   1,abc(3)");
  REQUIRE( disasmWrapper({0x881f, 0x3abc}) == "SRL   1,abc(3)");
  REQUIRE( disasmWrapper({0x8d1f, 0x3abc}) == "SLDL  1,abc(3)");
  REQUIRE( disasmWrapper({0x8c1f, 0x3abc}) == "SRDL  1,abc(3)");
}

TEST_CASE( "branching") {
  REQUIRE( disasmWrapper({0x0712}) == "BCR   1,2");
  REQUIRE( disasmWrapper({0x4712, 0x3abc}) == "BC    1,abc(2,3)");
  REQUIRE( disasmWrapper({0x0512}) == "BALR  1,2");
  REQUIRE( disasmWrapper({0x4512, 0x3abc}) == "BAL   1,abc(2,3)");
  REQUIRE( disasmWrapper({0x0612}) == "BCTR  1,2");
  REQUIRE( disasmWrapper({0x4612, 0x3abc}) == "BCT   1,abc(2,3)");
  REQUIRE( disasmWrapper({0x8612, 0x3abc}) == "BXH   1,2,abc(3)");
  REQUIRE( disasmWrapper({0x8712, 0x3abc}) == "BXLE  1,2,abc(3)");
  REQUIRE( disasmWrapper({0x4412, 0x3abc}) == "EX    1,abc(2,3)");
}

TEST_CASE( "status") {
  REQUIRE( disasmWrapper({0x82ff, 0x3abc}) == "LPSW  abc(3)");
  REQUIRE( disasmWrapper({0x041f}) == "SPM   1");
  REQUIRE( disasmWrapper({0x80ff, 0x3abc}) == "SSM   abc(3)");
  REQUIRE( disasmWrapper({0x0a12}) == "SVC   12");
  REQUIRE( disasmWrapper({0x0812}) == "SSK   1,2");
  REQUIRE( disasmWrapper({0x0912}) == "ISK   1,2");
  REQUIRE( disasmWrapper({0x93ff, 0x3abc}) == "TS    abc(3)");
  REQUIRE( disasmWrapper({0x8412, 0x3abc}) == "WRD   abc(3),12");
  REQUIRE( disasmWrapper({0x8512, 0x3abc}) == "RDD   abc(3),12");
  REQUIRE( disasmWrapper({0x8312, 0x3abc}) == "diagnose");
}

TEST_CASE( "i/o") {
  REQUIRE( disasmWrapper({0x9cff, 0x3abc}) == "SIO   abc(3)");
  REQUIRE( disasmWrapper({0x9dff, 0x3abc}) == "TIO   abc(3)");
  REQUIRE( disasmWrapper({0x9eff, 0x3abc}) == "HIO   abc(3)");
  REQUIRE( disasmWrapper({0x9fff, 0x3abc}) == "TCH   abc(3)");
}

TEST_CASE( "invalid") {
  REQUIRE( disasmWrapper({0x000f, 0x3abc}) == "undefined");
}

TEST_CASE( "getNameWrapper") {
  REQUIRE( getNameWrapper({0x9cff, 0x3abc}) == "Start I/O");
  REQUIRE( getNameWrapper({0x00ff, 0x3abc}) == "");
  REQUIRE( getNameWrapper({0x8312, 0x3abc}) == "Diagnose");
}
