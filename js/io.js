// i/o simulation code

var ioactions = {}; // Dictionary of pending I/O actions

function doio(state, entry) {
  if (count in ioactions) {
    var status = ioactions[count](state);
    delete ioactions[count];
    return status;
  }
}

cards = [];
cardIdx = 0;
cardOffset = 0; // In 4-byte units for now
cards1 = [
          [0x00000000, 0x00000400, 0x02000400, 0x00000050, 0x00020000, 0x00000000],
          [0x12345678, 0x23456789, 0x34567890]
          ];

function loadCards(cardfile) {
  cards = [];
  for (var i = 0; i < cardfile.length; i++) {
    var card = cardfile[i];
    for (var j = card.length; j < 80; j++) {
      card[j] = 0;
    }
    cards.push(card);
  }
  cardIdx = 0;
  cardOffset = 0;
}

loadCards(cards1);

// Read cards from CCW(s)
// Returns status message
function doReadFromCCW(state, ccwAddr, chainDataCommand) {
  if (ccwAddr & 3) {
    alert('doReadFromCCW alignment problem: ' + ccwAddr);
  }
  var ccw = state['MS'][ccwAddr];
  var ccwB= state['MS'][ccwAddr + 4];
  var command = ccw >>> 24;
  if (chainDataCommand != undefined) {
    command = chainDataCommand;
  }
  var dataAddr = ccw & 0xffffff;
  var flags = (ccwB >>> 27) & 0xff;
  if (flags & 1) {
    alert('Unexpected PCI flag');
  }
  var count = ccwB & 0xffff;
  if (dataAddr & 3) {
    alert('doReadFromCCW address alignment problem: ' + dataAddr);
  }
  if (ccwAddr & 3) {
    alert('doReadFromCCW count alignment problem: ' + count);
  }
  for (var i = 0; i < count; i += 4) {
    if (cardOffset >= cards[cardIdx].length) {
      if (flags & 32) { // SILI flag
        break;
      } else {
        alert('Length error: ' + i + ' vs ' + count);
        break;
      }
    }
    if (!(flags & 2)) { // if no skip flag
      state['MS'][dataAddr + i] = cards[cardIdx][cardOffset];
    }
    cardOffset += 1;
  }
  var msg = 'I/O: Read ' + i + ' to ' + dataAddr;
  if (flags & 2) {
    msg += ' (skip)';
  }
  if (flags & 16) { // Chain data
    return msg + '\n' + doReadFromCCW(state, ccwAddr + 8, command) + ' (chain data)';
  } else if (flags & 8) { // Chain command
    cardIdx += 1; // Move to next card
    cardOffset = 0;
    return msg + '\n' + doReadFromCCW(state, ccwAddr + 8) + ' (chain command)';
  } else {
    cardIdx += 1; // Move to next card
    cardOffset = 0;
    return msg;
  }
}

function chctl(state, entry) {
  switch (state['W']) {
    case 0:
      // 0000 -> CHCTL: proc with IRPT QK700
      break;
    case 1:
      // 0001 -> CHCTL: start IO QK800:09b4 QK700:9be
      ioactions[count+2] = function(state) {
        state['S'][3] = 1; // Channel response QK800:0988
        state['CR'] = 0; // for CRMD. 0 = CC for start IO accepted? QK800
        return "IO accepted";
      };
      break;
    case 2:
      // 0010 -> CHCTL: halt IO QK700 (time out? QK701:0942)
      alert('io.js: chctl ' + state['W'] + ' not implemented');
      break;
    case 4:
      // 0100 -> CHCTL: test IO QK800:09b4 (emit time out QK702:090d)
      ioactions[count+2] = function(state) {
        state['S'][3] = 1; // Channel response QK800:0988
        state['S'][2] = 1; // Channel end status received QK800:09b5
        // 50Maint page 156: CC=1 for channel end, CC=2 for channel busy
        var us = 0x6c; // Unit status must be 0xx01x00 for success
        var cs = 0x80; // Channel status must be xx000000 for success
        state['M'] = (us << 24) | (cs << 16);
        // CCW2 stored in word 1, so set up word 0
        state['MS'][0] = 0x02000000; // Read, addr = 0
        return doReadFromCCW(state, 0);
      };
      break;
    case 8:
      // 1000 -> CHCTL: test chan QK700
      alert('io.js: chctl ' + state['W'] + ' not implemented');
      break;
    case 16:
      // 00010000 -> CHCTL: issue foul on start QK700:09bc
      alert('io.js: chctl ' + state['W'] + ' not implemented');
      break;
    default:
      alert('io.js: chctl ' + state['W'] + ' not implemented');
      break;
  }
}

function ech(state, entry) {
  alert('io.js: e->ch not implemented');
}


