PCA9634	LED controller
Vcc/Vdd: 20	Gnd/Vss: 10	2.3-5.5V
20-SOIC 7.5mm
I2C: any except:
PCA9634 LED All Call address (1110 000) and Software Reset (0000 011) which are
active on start-up
• PCA9564 (0000 000) or PCA9665 (1110 000) slave address which is active on
start-up
• ‘reserved for future use’ I2C-bus addresses (0000 011, 1111 1XX)
• slave devices that use the 10-bit addressing scheme (1111 0XX)
• slave devices that are designed to respond to the General Call address (0000 000)
• High-speed mode (Hs-mode) master code (0000 1XX).

PCA9555 16-bit GPIO
Vdd: 24, Gnd/Vss: 12
1.65-5.5V
24-SOIC 7.5mm
I2C: 0100aaa

MCP47CVB01 DAC
Vdd: 1, Gnd/Vss: 7    
2.7-5.5V
10-MSOP 3mm width
I2C: 11000aa with 2 address pins 

ADS7828EB ADC
Vdd+: 16 Gnd 9
2.7-5V
16-TSSOP (0.173", 4.40mm Width)
I2C: 10010aa

I2C discussion:
Need 3 chips per board.
Use A1,A0 to select board

Taken:
01000bb: GPIO
11000bb: DAC
10010?b: ADC: a0 selects between 2 chips

For LEDs, need 4 bits to select board, 3 values to select the chip on a board
000bbbb: problem with 000000, 0000 011
001bbbb
010bbbb: confict with 0100aaa
011bbbb
100bbbb: conflict with 1001aaa
101bbbb
110bbbb: conflict with 11000aa
111bbbb: conflict with 11111xx, 1110000

No conflict with:
001bbbb
011bbbb
101bbbb
i.e: cc1bbbb where cc specifies the chip 00, 01, 10, and bbbb specifies the board 0000-1111



