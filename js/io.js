// I/O simulation code

var ioactions = {}; // Dictionary of pending I/O actions

function doio(state, entry) {
  if (count in ioactions) {
    var status = ioactions[count](state);
    delete ioactions[count];
    return status;
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
        for (var i = 0; i < 24; i += 4) {
          // IPL card
          state['MS'][i] = [0x00000000, 0x00000400, 0x02000400, 0x00000050,
          0x00020000, 0x00000000][i >> 2];
        }
        return "IO test complete";
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


