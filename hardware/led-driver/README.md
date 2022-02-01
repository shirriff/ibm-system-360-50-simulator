This is a driver board for the Model 50 console lights (under development).
This board has 18 LEDs, matching the two-byte display segment on the console.
It would take 15 boards for the whole console, which has approximately 271 LEDs.
I'm planning to use yellow/orange 590nm LEDs which is what the [IBM 1620 Jr](https://github.com/IBM-1620/Junior) project used after a bunch of testing to see what matched the bulbs most closely.

![Rendering of the board.](board.jpg)

The board uses [PCA9634](https://www.nxp.com/docs/en/data-sheet/PCA9634.pdf) LED I2C PWM driver chips, 
