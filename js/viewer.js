var data = undefined;
var div = undefined;
var div2 = undefined;

$(document).ready(function() {
  div = $("#div")[0];
  div2 = $("#div2")[0];
  div.innerHTML = '---loading---';
  $.getJSON("data.json", function(indata) {
    data = indata;

    div.innerHTML = '';
    $("#addr").keypress(function(e) {
      if (e.which == 13) {
        redraw($("#addr").val(), true);
      }
    });
    $("#diff2").keypress(function(e) {
      if (e.which == 13) {
        diff();
      }
    });
    $("#label").keypress(function(e) {
      if (e.which == 13) {
        search();
      }
    });
    $("#values").keypress(function(e) {
      if (e.which == 13) {
        search();
      }
    });
    $("#next").click(function(e) {
      redraw(window.nextaddr, true);
    });

    redraw(window.location.hash.substr(1), false);
  }).fail(function() { alert('fail');});

  // Handle back button by going to the anchor (#foo) in the new URL
  $(window).on("popstate", function(e) {
    redraw(window.location.hash.substr(1), false);
  });

});

// Search
function search() {
  var label = $("#label").val()
  var values = $("#values").val().split(',').map(parseInt);
  var keys = Object.keys(data);
  keys.sort();
  var found = '';
  var results = [];
  for (var i = 0; i < keys.length; i++) {
    var addr = keys[i];
    var entry = data[addr];
    var val = entry[label];
    if (values.includes(val)) {
      if (entry['AD'] == undefined) {
        // console.log("I/O: " + addr + ' ' + entry['TR']);
      } else {
        if (entry['SS'] != 38) continue;
        results.push(["Found: " + addr + ' ' + val + ', CE: ' + entry['CE']]);
        found = addr;
      }
    }
  }
  redraw(found, false);
  $("#div3")[0].innerHTML = results.join('\n');
}

function diff() {
  var addr1 = $("#addr").val().padStart(4, '0');
  var addr2 = $("#diff2").val().padStart(4, '0');
  $("#addr").val(addr1);
  $("#diff2").val(addr2);
  var entry1 = data[addr1];
  var entry2 = data[addr2];
  var keys1 = Object.keys(entry1);
  var keys2 = Object.keys(entry2);
  keys1.sort();
  var result = [];
  for (var i = 0; i < keys1.length; i++) {
    var key = keys1[i];
    if (entry1[key] != entry2[key]) {
      result.push(key + ': ' + entry1[key] + ' vs ' + entry2[key]);
    }
  }
  for (var i = 0; i < keys2.length; i++) {
    var key = keys2[i];
    if (!(key in entry1)) {
      result.push(key + ': ' + entry1[key] + ' vs ' + entry2[key]);
    }
  }
  div2.innerHTML = result.join('\n');
}

function redraw(addr, updateHistory) {
  if (addr == '') {
    return;
  }
  if (data == undefined) {
    alert("No data!");
  }
  var addr = addr.padStart(4, '0').toLowerCase();
  if (updateHistory) {
    history.pushState(null, null, '#' + addr);
  }
  $("#addr").val(addr);
  var entry = data[addr];
  if (!entry) {
    div.innerHTML = '--not found--';
    div2.innerHTML = '';
    return;
  }
  div.innerHTML = decode(addr, entry).join('\n');
  div2.innerHTML = dump(entry).join('\n');
  dump(entry);
}
