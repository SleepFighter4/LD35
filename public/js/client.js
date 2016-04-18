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
    map = m
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

/*function drawObjects() {
  for (var i = 0; i < objects.length; i++) {
    var coords = getLocalCoords(objects[i].x, objects[i].y);
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(coords.x, coords.y, 50, 50);
  }
}*/

/*Function drawPlayers() {
  if (typeof(players) != 'undefined' && typeof(player) != 'undefined') {
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      var coords = getLocalCoords(p.x, p.y);
      ctx.save();
      ctx.translate(coords.x, coords.y);
      ctx.rotate(p.angle * RADIANS_PER_DEG);
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(coords.x - p.w / 2, coords.y - p.h / 2, p.w, p.h);
      ctx.rect(coords.x - p.w / 2, coords.y - p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }
}*/

function initUI() {
  ui.ping = document.getElementById('ui-ping');
  ui.speed = document.getElementById('ui-speed');
  ui.fps = document.getElementById('ui-fps');

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

  ui.frameCount++;
}
