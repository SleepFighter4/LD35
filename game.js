"use strict"

// Modules
var ioStart = require('socket.io');
var io;

// Classes
var Player = require('./Player').Player;

// Globals
var loop;
var players = [];
var objects = [
  {"x":50,
  "y":50,
  "w":50,
  "h":50}
];
var scores = [];
var frameDelay = 40;
var KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32
};
var RADIANS_PER_DEG = Math.PI/180;
var vMax = 200; // px / sec
var friction = 1;
var mapCurrXLimits = [-10000,10000];
var mapCurrYLimits = [-10000,10000];

//Grid variables
var gridSize = 200;
var numNegXGrids = -Math.min(Math.floor(mapCurrXLimits[0] / gridSize), 0);
var numNegYGrids = -Math.min(Math.floor(mapCurrYLimits[0] / gridSize), 0);
var lastXGridIndex = Math.ceil((mapCurrXLimits[1] - mapCurrXLimits[0]) / gridSize);
var lastYGridIndex = Math.ceil((mapCurrYLimits[1] - mapCurrYLimits[0]) / gridSize);
var objectIndexGrid = sortObjectsIntoGrids(objects);
var playerIndexGrid = setupObjectGrids(players);

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
  socket.emit('ping','');

  socket.on('key update', function(keyState) {
    if (typeof(player) != 'undefined') {
      player.keyState = keyState;
      player.lastMovedTime = Date.now();
    }
  });  
  socket.on('canvas size', function(cs) {
    player.canvasSize.x = (cs.x && cs.x > 0 && cs.x < 4000) ? cs.x : 1980;
    player.canvasSize.y = (cs.y && cs.y > 0 && cs.y < 2000) ? cs.y : 1080;
  });
  socket.on('ping response', function(data) {
    if (typeof(player) != 'undefined') {
      player.ping = Date.now() - player.pingStart;
      setTimeout(function(){socket.emit('ping',''); player.pingStart = Date.now();},2000);
    }
  });
  socket.on('disconnect', function() {
    if (typeof(player) != 'undefined') {
      players.splice(players.indexOf(player), 1);
      if (players.length == 1) log('A user disconnected. There is now 1 user.');
      else log('A user disconnected. There are now ' + (players.length).toString() + ' users.');
    }
  });
}

function movePlayers() {
  playerIndexGrid = setupObjectGrids(players);
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    var delta = (Date.now() - p.lastMovedTime) / 1000.0;
    var rotationDirection = 0;
    var forwardAcc = 0;

    if (p.keyState[KEY_CODES.LEFT]) {
      rotationDirection = -1;
    } else if (p.keyState[KEY_CODES.RIGHT]) {
      rotationDirection = 1;
    }

    if (p.keyState[KEY_CODES.UP]) {
      forwardAcc = 20;
    } else if (p.keyState[KEY_CODES.DOWN]) {
      forwardAcc = -20;
    }

    p.angle = (p.angle + rotationDirection * p.rotationSpeed * delta) % 360;
    if (p.angle < 0) p.angle += 360;
    var engineAccelerationX = forwardAcc * Math.cos(RADIANS_PER_DEG * p.angle);
    var engineAccelerationY = forwardAcc * Math.sin(RADIANS_PER_DEG * p.angle);

    p.vX += engineAccelerationX * delta;
    p.vY += engineAccelerationY * delta;
    p.vX *= (1 - (0.4 * delta)) // Dampening
    p.vY *= (1 - (0.4 * delta)) // Dampening

    p.x += p.vX * delta;
    p.y += p.vY * delta;
    p.lastMovedTime = Date.now();
    p.xGrid = Math.floor(p.x / gridSize) + numNegXGrids;
    p.yGrid = Math.floor(p.y / gridSize) + numNegYGrids;
    playerIndexGrid[p.xGrid][p.yGrid].push(i);
  }
}

/*function updateGrid() {
  // Calculate players position in the grid.
  p.xGrid = Math.floor(p.x / gridSize) + numNegXGrids;
  p.yGrid = Math.floor(p.y / gridSize) + numNegYGrids;
  if (p.xGrid != p.lastXGrid || p.yGrid != p.lastYGrid) {
    // If this has changed, need to recalculate the set of objects sent to the player.
    if (p.lastXGrid != null && p.lastYGrid != null && playerIndexGrid[p.lastXGrid] && playerIndexGrid[p.lastXGrid][p.lastYGrid])
  }
  p.lastXGrid = p.xGrid;
  p.lastYGrid = p.yGrid;
}*/

function setupObjectGrids(objects) {
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
  return grids;
}

function sortObjectsIntoGrids(objects) {
  // Bin sort object indices into grids based on object location.
  var grids = setupObjectGrids(objects);
  for (var i = 0; i < objects.length; i++) {
    grids[Math.floor(objects[i].x / gridSize) + numNegXGrids][Math.floor(objects[i].y / gridSize) + numNegYGrids].push(i);
  }
  return grids;
}

function getObjectsForPlayer(p, playerIndexGrid, objectIndexGrid) {
  var playersToSend = [];
  //var playersToSendInds = [];
  var objectsToSend = [];
  //var objectsToSendInds = [];

  var startXGrid = Math.max(Math.floor((p.x - (p.canvasSize.x / 2)) / gridSize) + numNegXGrids, 0);
  var endXGrid = Math.min(Math.floor((p.x + (p.canvasSize.x / 2)) / gridSize) + numNegXGrids, lastXGridIndex);
  var startYGrid = Math.max(Math.floor((p.y - (p.canvasSize.y / 2)) / gridSize) + numNegYGrids, 0);
  var endYGrid = Math.min(Math.floor((p.y + (p.canvasSize.y / 2)) / gridSize) + numNegYGrids,lastYGridIndex);

  for (var x = startXGrid; x <= endXGrid; x++) {
    for (var y = startYGrid; y <= endYGrid; y++) {
      for (var i = 0; i < playerIndexGrid[x][y].length; i++) {
        var p = players[playerIndexGrid[x][y][i]];
        if (typeof(p) != 'undefined') {
          playersToSend.push(players[playerIndexGrid[x][y][i]]);
        } else {
          log('WARNING: Player in grid is undefined.');
        }
      }
      //playersToSendInds = playersToSendInds.concat(playerIndexGrid[x][y])
      for (var i = 0; i < objectIndexGrid[x][y].length; i++) {
        var o = objects[objectIndexGrid[x][y][i]];
        if (typeof(o) != 'undefined') {
          objectsToSend.push(objects[objectIndexGrid[x][y][i]]);
        } else {
          log('WARNING: Player in grid is undefined.');
        }
      }
      //objectsToSendInds = objectsToSendInds.concat(objectIndexGrid[x][y])
    }
  }
  return {
    players: playersToSend,
    objects: objectsToSend
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
  var playerIndexGrid = sortObjectsIntoGrids(players);
  //console.log(playerIndexGrid);

  for (var i = 0; i < players.length; i++) {
    var p = players[i];

    var objsToSend = getObjectsForPlayer(p, playerIndexGrid, objectIndexGrid);
    objsToSend['scores'] = scores;
    //console.log(objsToSend);
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