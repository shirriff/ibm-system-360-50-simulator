var data = undefined;
var div = undefined;
var div2 = undefined;

$(document).ready(function() {
  can = $("#can")[0];
  ctx = can.getContext('2d');
  div = $("#div")[0];
  div2 = $("#div2")[0];
  div.innerHTML = '---loading---';
  layout();

  // Load data and then start up
  $.getJSON("data.json", function(indata) {
    data = indata;
    div.innerHTML = '';

    // Actions
    $("#step").click(function(e) {
      stopAnimate();
      step();
    });
    $("#control").click(function(e) {
      if ($("#control").text() == 'Stop') {
        stopAnimate();
      } else {
        startAnimate();
      }
    });

    init();
  }).fail(function() { alert('fail');});
});

function init() {
  addr = 0x0197;
  $("#LSAR0").html("00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff");
  $("#LSAR1").html("00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff");
  $("#LSAR2").html("00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff");
  $("#LSAR3").html("00 11 22 <span class='hilite'>33</span> 44 55 66 77 88 99 aa bb cc dd ee ff");
  step();
}

function stopAnimate() {
  running = 0;
  $("#control").text('Run');
}

function startAnimate() {
  $("#control").text('Stop');
  running = 1;
  then = 0;
  animate();
}

// Positing dst xoff pixels right of src
function posx(src, dst, xoff) {
  $(dst).css("top", $(src).css("top"));
  $(dst).css("left", $(src).css("left"));
  $(dst).css("left", "+=" + xoff);
}
function posy(src, dst, xoff) {
  $(dst).css("top", $(src).css("top"));
  $(dst).css("top", "+=" + xoff);
}

function layout() {
  posx("#LSFRc", "#Jc", 50);
  posy("#LSFRc", "#LSARc", 50);
  posx("#Jc", "#LSARc", 0);
  posy("#Jc", "#LSARc", 50);
  posy("#LSARc", "#LSc", 50);
  posy("#LSc", "#PSWc", 150);
  posx("#PSWc", "#Lc", 150);
  posx("#Lc", "#Rc", 100);
  posx("#Rc", "#MDc", 100);
  posx("#MDc", "#Fc", 50);
  posx("#Fc", "#Qc", 50);
  posx("#Qc", "#Mc", 50);
  posx("#Mc", "#Hc", 100);

}

function animate() {
  if (!running) {
    return;
  }
  requestAnimationFrame(animate);
  var now = Date.now();
  var elapsed = now - then;
  if (elapsed > 500) {
    then = now;
    step();
  }
}
function step() {
    //ctx.fillStyle = 'yellow';
    //ctx.fillRect(xpos, 0, 100, 100);
    var hexaddr = addr.toString(16).padStart(4, '0').toLowerCase();
    var result = decode(hexaddr.toString(16), data[hexaddr]);
    addr += 1;
    div2.innerHTML = result.join('\n');
}
