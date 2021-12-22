The js directory holds the Javascript source code.


Compile typescript with "tsc"

(Warning: edit .ts files not .js!)

In `js/out`, start web server:
```
python3 -m http.server
```

Load http://localhost:8000

decode.js: generates the microcode expression box
disasm.js: disassembles a System/360 instruction
engine.js: the actual simulator engine
io.js: i/O simulation: very basic
sim.js: top-level simulator
utils.js: shared utility functions
viewer.js: used by display.html and viewer.html

display.html: displays microcode
sim.html: main simulator
viewer.html: search/diff

Open tests in browser, e.g. tests/instructions.html
Tests don't all pass currently.

