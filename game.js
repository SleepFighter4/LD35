"use strict"

// Modules
var ioStart = require('socket.io');
var io;

// Classes
var Player = require('./Player').Player;

// Globals
var loop;
var players = [];
var objects = [];
var scores = [];
var frameDelay = 40;
var KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32
};
var TO_RADIANS = Math.PI/180; 
var vMax = 200; // px / sec
var friction = -50;
var mapCurrXLimits = [-10000,10000];
var mapCurrYLimits = [-10000,10000];

//Grid variables
var gridSize = 200;
var numNegXGrids = -Math.min(Math.floor(mapCurrXLimits[0] / gridSize), 0);
var numNegYGrids = -Math.min(Math.floor(mapCurrYLimits[0] / gridSize), 0);
var lastXGridIndex = Math.ceil((mapCurrXLimits[1] - mapCurrXLimits[0]) / gridSize);
var lastYGridIndex = Math.ceil((mapCurrYLimits[1] - mapCurrYLimits[0]) / gridSize);

function log(obj) {
  console.log((new Date()).toLocaleTimeString() + ": " + obj.toString());
}

function run(http) {
  var loop = setInterval(gameLoop, frameDelay);
  io = ioStart(http);
  io.on('connection', initialiseClient);
  log("Game started.");
}
exports.run = run;

function gameLoop() {
  movePlayers();
  sendUpdates();
}

function initialiseClient(socket) {
  var player = new Player(socket.id);
  players.push(player);
  if (players.length == 1) log('A user connected. There is now 1 user.');
  else log('A user connected. There are now ' + (players.length).toString() + ' users.');

  socket.on('disconnect', function() {
    if (typeof(player) != 'undefined') {
      players.splice(players.indexOf(player), 1);
      if (players.length == 1) log('A user disconnected. There is now 1 user.');
      else log('A user disconnected. There are now ' + (players.length).toString() + ' users.');
    }
  });
}

function movePlayers() {
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    var delta = (Date.now() - p.lastMovedTime) / 1000.0;
    var rotationDirection = 0;
    var forwardAcc = 0;

    if (p.keyState[KEY_CODES.LEFT]) {
      rotationDirection = -1;
    } else if (p.keyState[KEY_CODES.RIGHT]) {
      rotationDirection = 1;
    } else if (p.keyState[KEY_CODES.UP]) {
      forwardAcc = 100;
    }

    p.angle = (p.angle + rotationDirection * p.rotationSpeed * delta) % 360;
    if (p.angle < 0) p.angle += 360;
    var engineAccelerationX = forwardAcc * Math.cos(TO_RADIANS * p.angle) * delta
    var engineAccelerationY = forwardAcc * Math.sin(TO_RADIANS * p.angle) * delta

    // Friction will act in the opposite direction of travel, always dempening the velocity.
    p.vX += (engineAccelerationX) * delta;
    p.vY += (engineAccelerationY) * delta;
    p.vX = Math.min(p.vX, vMax);
    p.vY = Math.min(p.vY, vMax);
    p.x += p.vX * delta * Math.cos(TO_RADIANS * p.angle);
    p.y += p.vY * delta * Math.sin(TO_RADIANS * p.angle);
    p.lastMovedTime = Date.now();
  }
}

function sortObjectsIntoGrids(objects) {
  var grids = [];
  for (var w = mapCurrXLimits[0]; w <= mapCurrXLimits[1]+1; w += gridSize) {
    var gridCol = [];
    for (var h = mapCurrYLimits[0]; h <= mapCurrYLimits[1]+1; h += gridSize) {
      gridCol.push([]);
    }
    grids.push(gridCol);
  }
  var numNegXGrids = -Math.min(Math.floor(mapCurrXLimits[0] / gridSize), 0);
  var numNegYGrids = -Math.min(Math.floor(mapCurrYLimits[0] / gridSize), 0);
  for (var i = 0; i < objects.length; i++) {
    grids[Math.floor(objects[i].x / gridSize) + numNegXGrids][Math.floor(objects[i].y / gridSize) + numNegYGrids].push(i);
  }
  return grids;
}

function calculateRequiredObjects(p,gridPlayers,gridObjects) {
  var playersToSend = [];
  var playersToSendInds = [];
  var startXGrid = Math.max(Math.floor((p.x - (p.canvasSize.width / 2)) / gridSize) + numNegXGrids, 0);
  var endXGrid = Math.min(Math.floor((p.x + (p.canvasSize.width / 2)) / gridSize) + numNegXGrids, lastXGridIndex);
  var startYGrid = Math.max(Math.floor((p.y - (p.canvasSize.height / 2)) / gridSize) + numNegYGrids, 0);
  var endYGrid = Math.min(Math.floor((p.y + (p.canvasSize.height / 2)) / gridSize) + numNegYGrids,lastYGridIndex);
  for (var x = startXGrid; x <= endXGrid; x++) {
    for (var y = startYGrid; y <= endYGrid; y++) {
      for (var i = 0; i < gridPlayers[x][y].length; i++) {
        var o = players[gridPlayers[x][y][i]];
        if (typeof(o) != 'undefined') {
          //playersToSend.push(players[gridPlayers[x][y][i]]);
          playersToSend.push(arrayOfValues);
        } else {
          log('WARNING: Player in grid is undefined at line 485.');
        }
      }
      playersToSendInds = playersToSendInds.concat(gridPlayers[x][y])
    }
  }
  return {
    objectsToSend: {
      players: playersToSend,
      objects: objectsToSend
    },
    inds: {
      playerInds: playersToSendInds,
      objects: objectsToSendInds
    }
  };
}

function checkForCollosions(p,objects,objectInds) {
  // Check for collisions between a player and a set of objects
  var socket = io.sockets.connected[p.id];
  for (var i = 0; i < objectInds.length; i++) {
  var o = objects[objectInds[i]];
    if (squareCollision) {

    }
  }
}

function sendUpdates() {
  // This will be content sent to every player so they can draw the game.
  // Over time this will change to a minimal subset of the players and objects arrays.
  var objsToSend = {
    players: players,
    objects: objects,
    scores: scores
  };

  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    // Get socket of player.
    var socket = io.sockets.connected[p.id];
    if (typeof(socket) != 'undefined') {
      // Send the player's individual object.
      socket.emit('player', p);
      // Send the rest content requried for drawing the game.
      socket.emit('game data', objsToSend);
    }
  }
}