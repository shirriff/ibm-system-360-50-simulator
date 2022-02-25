# Generate the I2C numbers for the boards and check for conflicts
# This also generates the .h file.
# The code is a bit random since this was used to work out the assignments and then to produce the file.

# Return all 3 LED numbers
def addLEDs(boardId):
  update(0x10 | boardId, "LED0")
  update(0x30 | boardId, "LED1")
  update(0x50 | boardId, "LED2")

switchCount = {"A": [], "B": []}
# Switch input 0 number on a new board, or switch on an old board
def addSwitch0(boardId):
  update(0x20 | (boardId & 3), "SWITCH0")

# Switch input 1 number on a new board
def addSwitch1(boardId):
  update(0x24 | (boardId & 3), "SWITCH1")

# The DAC chip
def addDAC(boardId):
  update(0x60 | (boardId & 3), "DAC")

# Pair of ADCs on an old board; new board uses just the first
def addADCs(boardId):
  update(0x48 | (boardId & 1), "ADC0")
  update(0x4a | (boardId & 1), "ADC1")

i2cA = {}
i2cB = {}

boardList = []
components = {}

# Update the specified set with i2c (number or set)
def update(i2c, component):
  if bus == "A":
    i2cSet = i2cA
  else:
    i2cSet = i2cB
    i2c |= 0x100

  if i2c in i2cSet:
    print("Conflict on", hex(i2c), i2cSet[i2c])

  text = "%s: %s %d %s" % (component, bus, boardId, boardName)
  print(text)
  i2cSet[i2c] = text
  components[(bus, boardName, component)] = i2c

  if "Switch" in component:
    switchCount[bus].append(text)

seen = {}
counts = {"A": 0, "B": 0}
def title(boardName, boardId, bus):
  if boardId in seen:
    print("boardId conflict", boardName, boardId, bus, seen[boardId])
  seen[boardId] = (boardName, boardId, bus)
  boardList.append([boardName, boardId, bus])
  print("\n%s: bus %s, boardId %d" % (boardName, bus, boardId))
  counts[bus] += 1
  
with open('i2c_addrs.h', 'w') as f:
  print("""
// Assignments of I2C addresses for the System/360 console.
// https://righto.com/360led

#ifndef _I2C_ADDRS_
#define _I2C_ADDRS_

// The system consists of 15 boards, split across two I2C buses: "A" and "B".
// Each board can have LED drivers, switch inputs, ADCs, and/or a DAC.
// Each component has an I2C address. To distinguish the "A" and "B" buses, I'm adding 0x100 to the "B" bus addresses.
// (The real address is still 7 bits.)
//
// Each board is wired with a 4-bit board code. Depending on the component type, some bits of the board code will
// affect the component address. (Components have most of the address hard-wired.) Thus, careful assignment of components
// is necessary to avoid address collisions.
// For now, the physical locations of the boards match the board codes. If that changes, the code may need to be updated.
//
// On the Teensy 4.1, bus "A" is wired with SCL to pin 19, SDA to pin 18.
// Bus "B" is wired with SCL to pin 16 and SDA to pin 17. (Note the order is reversed compared to bus "A".
// Bus "A" can be accessed with "Wire" and bus "B" with "Wire1".

typedef struct BOARD_struct
{
  uint16_t leds[3];
  uint16_t switches[2];
  uint16_t adcs[2];
  uint16_t dac;
} BOARD_t;

// BRD_pos defines the table index for the board in that position. (It doesn't match the board id or any other physical value.)
// BRD_pos_component defines the I2C address for that component. (Boards on bus B have 0x100 added.)
// Boards are partially populated, so not all potential components are used.

""", file=f)


  # board 0
  boardName = "BRD_TOP_ANALOG"
  boardId = 8 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addDAC(boardId)
  addLEDs(boardId)
  addADCs(boardId)
  addSwitch0(boardId)

  # board 1
  boardName = "BRD_ROLLER1_L"
  boardId = 0 & 7
  bus = "A"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch0(boardId)
  addSwitch1(boardId)

  # board 2
  boardName = "BRD_ROLLER1_R"
  boardId = 9 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch0(boardId)

  # board 3
  boardName = "BRD_ROLLER2_L"
  boardId = 1 & 7
  bus = "A"
  title(boardName, boardId, bus)
  addLEDs(boardId)

  # board 4
  boardName = "BRD_ROLLER2_R"
  boardId = 10 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch0(boardId)

  # board 5
  boardName = "BRD_ROLLER3_L"
  boardId = 2 & 7
  bus = "A"
  title(boardName, boardId, bus)
  addLEDs(boardId)

  # board 6
  boardName = "BRD_ROLLER3_R"
  boardId = 11 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addLEDs(boardId)

  # board 7
  boardName = "BRD_ROLLER4_L"
  boardId = 3 & 7
  bus = "A"
  title(boardName, boardId, bus)
  addLEDs(boardId)

  # board 8
  boardName = "BRD_ROLLER4_R"
  boardId = 12 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch1(boardId)

  # board 9
  boardName = "BRD_FLT_L"
  boardId = 4 & 7
  bus = "A"
  title(boardName, boardId, bus)
  addLEDs(boardId)

  # board 10
  boardName = "BRD_FLT_R"
  boardId = 13 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addLEDs(boardId)

  # board 11
  boardName = "BRD_SDR_L"
  boardId = 5 & 7
  bus = "A"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch0(boardId)
  addSwitch1(boardId)

  # board 12
  boardName = "BRD_SDR_R"
  boardId = 14 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch1(boardId)

  # board 13
  boardName = "BRD_IAR_CTRL_L"
  boardId = 6 & 7
  bus = "A"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch0(boardId)
  addSwitch1(boardId)

  # board 14
  boardName = "BRD_IAR_CTRL_R"
  boardId = 15 & 7
  bus = "B"
  title(boardName, boardId, bus)
  addLEDs(boardId)
  addSwitch0(boardId)
  addSwitch1(boardId)

  print("\nCounts: busA %d, busB %d" % (counts["A"], counts["B"]))
  print("\nSwitch count A:%d B:%d" % (len(switchCount["A"]), len(switchCount["B"])))
  print("Switch count A: %s" % switchCount["A"])
  print("Switch count B: %s" % switchCount["B"])

  for bus in ["A", "B"]:
    i2c = {"A": i2cA, "B": i2cB}[bus]
    for i in range(0, 256):
      if i in i2c:
        print("%s %02x: %s" % (bus, i, i2c[i]))

  for idx, [boardName, boardId, bus] in enumerate(boardList):
    print("\n// Board %s: bus %s, board id %d" % (boardName.replace("BRD_", ""), bus, boardId), file=f)
    print("#define %s %d" % (boardName, idx), file=f)
    for component in ["LED0", "LED1", "LED2", "SWITCH0", "SWITCH1", "ADC0", "ADC1", "DAC"]:
      if (bus, boardName, component) in components:
        print("#define %s_%s 0x%02x" % (boardName, component, components[(bus, boardName, component)]), file=f)
      
  print("""
// This array defines the components and their addresses for each board. It puts the addresses above into a structued
// form. Unused components are given the value 0. The array is indexed by the board indices above.

#define BOARD_COUNT %d

BOARD_t boards[BOARD_COUNT] = {""" % len(boardList), file=f)
  for idx, [boardName, boardId, bus] in enumerate(boardList):
    def entry(component):
      key = (bus, boardName, component)
      if key in components:
        return "%s_%s" % (boardName, component)
      else:
        return 0
    print("  { // Board %s, bus %s, id %s, #%d" % (boardName, bus, boardId, idx), file=f)
    print("    .leds = {%s, %s, %s}," % (entry("LED0"), entry("LED1"), entry("LED2")), file=f)
    print("    .switches = {%s, %s}," % (entry("SWITCH0"), entry("SWITCH1")), file=f)
    print("    .adcs = {%s, %s}," % (entry("ADC0"), entry("ADC1")), file=f)
    print("    .dac = %s" % entry("DAC"), file=f)
    if idx < len(boardList) - 1:
      print("  },", file=f)
    else:
      print("  }", file=f)

  print("};", file=f)
   

  print("""
#endif /* _I2C_ADDRS_ */""", file=f)
