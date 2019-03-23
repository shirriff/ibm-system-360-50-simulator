// I/O simulation code

var ioactions = {}; // Dictionary of pending I/O actions

function doio(state, entry) {
  if (count in ioactions) {
    ioactions[count](state);
    delete ioactions[count];
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
        state['CR'] = 0; // for CRMD. 0 = start IO accepted? QK800
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


