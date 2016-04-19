"use strict"

// Globals
var player;
var players = [];
var objects = [];
var scores = [];
var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext("2d");
var canvasSize = {"x":canvas.width,"y":canvas.height};
var keyState = {};
var socket;
var map = [];
var roundStartTime = Date.now();
var roundTimeLimit = 120;

//Utilities
var usedKeys = [37, 38, 39, 40, 32, 65, 83];
var KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  A: 65,
  S: 83
}
var RADIANS_PER_DEG = Math.PI/180; 
var PIXEL_PER_METER = 1;

// Event listeners
window.addEventListener('keydown',function(e){
  if (usedKeys.indexOf(e.which) != -1 && !keyState[e.which]) {
    keyState[e.which] = true;
    socket.emit('key update', keyState);
  }
},true);
window.addEventListener('keyup',function(e){
  if (usedKeys.indexOf(e.which) != -1 && keyState[e.which]) {
    keyState[e.which] = false;
    socket.emit('key update', keyState);
  }
},true);
window.addEventListener("resize", function(){
  updateCanvasSize();
},true);
window.addEventListener("blur", function(){
  keyState = {}
  socket.emit('key update', keyState);
});

// Start program
registerSocketHooks();
updateCanvasSize(); 
updateCanvas();
initUI();

function registerSocketHooks() {
  socket = io();
  socket.on('player', function(p) {
    player = p;
  })
  socket.on('map', function(m) {
    map = m;
  });
  socket.on('round starting', function(startCountdownTime) {
    // Display message "Round starting in 5", 4, ... 1!
    console.log("Round starting soon.");
    roundStartTime = Date.now() + startCountdownTime
  });
  socket.on('round started', function(lengthOfRound) {
    roundTimeLimit = lengthOfRound;
    // Display message "GO!"
    console.log("Round started.");
    roundStartTime = Date.now()
  });
  socket.on('round in progress', function(timeElapsed) {
    console.log("Round in progress. Auto-tracking another player.");
    roundStartTime = Date.now() - timeElapsed;
  });
  socket.on('server message', function(message) {
    // Should be displayed in the middle of the scree.
    console.log(message);
  });
  socket.on('lap times', function(lapTimes) {
    document.getElementById('ui-prevLapTimes').style.display = "none";
    while (ui.prevLapTimes.hasChildNodes()) {
        ui.prevLapTimes.removeChild(ui.prevLapTimes.firstChild);
    }
    if (lapTimes.length > 0) {
      var row = document.createElement("tr");
      var name = document.createElement("th");
      var time = document.createElement("th");
      name.innerText = "Player";
      time.innerText = "Lap Time";
      row.appendChild(name);
      row.appendChild(time);
      ui.prevLapTimes.appendChild(row);

      for (var i = 0; i < lapTimes.length; i++) {
        var row = document.createElement("tr");
        var name = document.createElement("td");
        var time = document.createElement("td");
        name.innerText = lapTimes[i].name; //innerText to prevent XSS
        time.innerText = lapTimes[i].time.toString() + "s";
        row.appendChild(name);
        row.appendChild(time);
        ui.prevLapTimes.appendChild(row);
      }
      document.getElementById('ui-prevLapTimes').style.display = "block";
    }
  });
  socket.on('game data', function(obj) {
    players = obj.players;
    objects = obj.objects;
    scores = obj.scores;
  })
  socket.on('ping', function(p) {
    socket.emit('ping response', p);
  });
}

function updateCanvas() {
  requestAnimationFrame(updateCanvas);
  if (typeof(player) != 'undefined') {
    //Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawObjects(objects, players, player, canvas, ctx);
    drawPlayer(player, canvas, ctx);
    updateUI();
  }
}

function updateCanvasSize() {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  canvasSize.x = canvas.height;
  canvasSize.y = canvas.width;
  socket.emit('canvas size', canvasSize);
}

function getLocalCoords(x, y) {
  // Convert global coords to coords relative to the top left of the user's canvas.
  return {
    "x": canvas.width/2 - (player.x-x),
    "y": canvas.height/2 - (player.y-y)
  };
}

function initUI() {
  ui.ping = document.getElementById('ui-ping');
  ui.speed = document.getElementById('ui-speed');
  ui.fps = document.getElementById('ui-fps');
  ui.playerCount = document.getElementById('ui-playerCount');
  ui.roundTime = document.getElementById('ui-roundTime');
  ui.timeRemaining = document.getElementById('ui-timeRemaining');
  ui.prevLapTimes = document.getElementById('ui-prevLapTimes-table');

  (function updateFPS(lastTime) {
    var currentTime = +(new Date).getTime();
    var timeSpent = currentTime - lastTime;
    setTimeout(updateFPS, 1000, currentTime);
    ui.fps.value = ui.frameCount || 0;
    ui.frameCount = 0;
  })();
}

function updateUI() {
  if (typeof(player) === 'undefined')
    return;

  var speed = Math.sqrt(Math.pow(player.vX, 2) + Math.pow(player.vY, 2)) / PIXEL_PER_METER;

  ui.ping.value = player.ping || -1;
  ui.speed.value = Math.floor(speed * 10)/10;
  ui.playerCount.value = players.length;
  ui.roundTime.value = Math.round(10 * ((Date.now() - roundStartTime) / 1000)) / 10;
  ui.timeRemaining.value = Math.round(10 * (roundTimeLimit - (Date.now() - roundStartTime)/1000)) / 10;

  ui.frameCount++;
}