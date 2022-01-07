// Initialize memory with sample code

// Sample program from "A Programmer's Introduction to the IBM System/360 Architecture, Instructions, and Assembler Language " p48
// http://www.bitsavers.org/pdf/ibm/360/training/C20-1646-1_A_Programmers_Introduction_To_IBM_System360_Assembler_Language_May66.pdf

// Initialize memory with some code and return the start address.
function initCode(mem: number[]) : number {
  const code: number[] = [
    0x05f05820, 0xf0225a20, 0xf02a8b20, 0xf0015b20, 0xf0265020, 0xf02e5860, 0xf0325a60, 0xf0364e60,
    0xf03e0a00, 0x00000019, 0x0000000f, 0x0000000a, 0x00000000, 0x0000000c, 0x0000004e, 0x00000000
  ];
  const startAddr = 0x100;
  for (let i = 0; i < code.length; i++) {
    mem[startAddr + 4 * i] = code[i];
  }
  return startAddr;
}
