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

//Utilities
var usedKeys = [37, 38, 39, 40, 32];
var KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32
}
var RADIANS_PER_DEG = Math.PI/180; 

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

function registerSocketHooks() {
  socket = io();
  socket.on('player', function(p) {
    player = p;
  })
  socket.on('game data', function(obj) {
    players = obj.players;
    objects = obj.objects;
    scores = obj.scores;
  })
  socket.on('ping', function(p){
    socket.emit('ping response', p);
  });
}

function updateCanvas() {
  requestAnimationFrame(updateCanvas);
  if (typeof(player) != 'undefined') {
    //Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawObjects();
    drawPlayers();
    drawUI();
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

function drawObjects() {
  for (var i = 0; i < objects.length; i++) {
    var coords = getLocalCoords(objects[i].x, objects[i].y);
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(coords.x, coords.y, 50, 50);
  }
}

function drawPlayers() {
  if (typeof(players) != 'undefined' && typeof(player) != 'undefined') {
    for (var i = 0; i < players.length; i++) {
      var coords = getLocalCoords(players[i].x, players[i].y);
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(coords.x, coords.y, 50, 100);
    }
  }
}

function drawUI() {
  if (typeof(player) != player.ping) {
    //Display ping.
    ctx.fillStyle="#fff";
    ctx.font="12px Arial";
    var pingText = "Ping: " + player.ping;
    ctx.fillText(pingText, 38, 30);
  }
}