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
  {"x":50,"y":50,"w":50,"h":50},
  {"x":150,"y":50,"w":50,"h":50},
  {"x":250,"y":50,"w":50,"h":50},
  {"x":50,"y":150,"w":50,"h":50},
  {"x":50,"y":250,"w":50,"h":50},
  {"x":50,"y":350,"w":50,"h":50}
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
      forwardAcc = 100;
    } else if (p.keyState[KEY_CODES.DOWN]) {
      forwardAcc = -100;
    }

    p.angle = (p.angle + rotationDirection * p.rotationSpeed * delta) % 360;
    if (p.angle < 0) p.angle += 360;
    var engineAccelerationX = forwardAcc * Math.cos(RADIANS_PER_DEG * p.angle);
    var engineAccelerationY = forwardAcc * Math.sin(RADIANS_PER_DEG * p.angle);
    p.vX += engineAccelerationX * delta;
    p.vY += engineAccelerationY * delta;
    p.vX *= (1 - (0.8 * delta)) // Dampening
    p.vY *= (1 - (0.8 * delta)) // Dampening
    if (Math.abs(p.vY) < 0.1) p.vY = 0;
    if (Math.abs(p.vX) < 0.1) p.vX = 0;
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
  var objectsToSend = [];

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
      for (var i = 0; i < objectIndexGrid[x][y].length; i++) {
        var o = objects[objectIndexGrid[x][y][i]];
        if (typeof(o) != 'undefined') {
          objectsToSend.push(objects[objectIndexGrid[x][y][i]]);
        } else {
          log('WARNING: Object in grid is undefined.');
        }
      }
    }
  }
  return {
    players: playersToSend,
    objects: objectsToSend
  };
}

function checkForCollosions(p, objects) {
  // Check for collisions between a player and a set of objects.
  // Removes the velocity component perpendicular to the line the player collides with.
  var socket = io.sockets.connected[p.id];
  var pCorners = [
    [p.x - p.w / 2, p.y - p.h / 2],
    [p.x + p.w / 2, p.y - p.h / 2],
    [p.x - p.w / 2, p.y + p.h / 2],
    [p.x + p.w / 2, p.y + p.h / 2]
  ];

  // Rotate 
  for (var i = 0; i < 4; i++) {
    pCorners[i] = [
      p.x + (pCorners[i][0] - p.x) * Math.cos(p.angle) - (pCorners[i][1] - p.y) * Math.sin(p.angle),
      p.y + (pCorners[i][0] - p.x) * Math.sin(p.angle) + (pCorners[i][1] - p.y) * Math.cos(p.angle)
    ];
  }

  var pLines = [
    [pCorners[0], pCorners[1]],
    [pCorners[1], pCorners[2]],
    [pCorners[2], pCorners[3]],
    [pCorners[3], pCorners[0]]
  ];

  for (var i = 0; i < objects.length; i++) {
    var o = objects[i];
    var lines = []
    var oCorners = [
      [p.x - p.w / 2, p.y - p.h / 2],
      [p.x + p.w / 2, p.y - p.h / 2],
      [p.x - p.w / 2, p.y + p.h / 2],
      [p.x + p.w / 2, p.y + p.h / 2]
    ];

    // Rotate 
    for (var i = 0; i < 4; i++) {
      oCorners[i] = [
        p.x + (oCorners[i][0] - p.x) * Math.cos(0) - (oCorners[i][1] - p.y) * Math.sin(0),
        p.y + (oCorners[i][0] - p.x) * Math.sin(0) + (oCorners[i][1] - p.y) * Math.cos(0)
      ];
    }
    
    var oLines = [
      [oCorners[0],oCorners[1]],
      [oCorners[1],oCorners[2]],
      [oCorners[2],oCorners[3]],
      [oCorners[3],oCorners[0]]
    ];

    for (var j = 0; j < pLines.length; j++) {
      for (var k = 0; k < oLines.length; k++) {
        var intersection = lineIntersection(
          pLines[j][0][0],
          pLines[j][0][1],
          pLines[j][1][0],
          pLines[j][1][1],
          oLines[k][0][0],
          oLines[k][0][1],
          oLines[k][1][0],
          oLines[k][1][1]
        )

        if (intersection.onLine1 && intersection.onLine2) {
          // Only keep the velocity in the direction of the line the player hit.
          var magnitude = Math.sqrt(Math.pow(p.vX,2) + Math.pow(p.vY,2));
          p.vX = magnitude * Math.cos(Math.atan2(oLines[k][0][1] - oLines[k][1][1], oLines[k][0][0] - oLines[k][1][0]))
          p.vY = magnitude * Math.sin(Math.atan2(oLines[k][0][1] - oLines[k][1][1], oLines[k][0][0] - oLines[k][1][0]))
        }
      }
    }
  }
}

function lineIntersection(l1StartX, l1StartY, l1EndX, l1EndY, l2StartX, l2StartY, l2EndX, l2EndY) {
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
  var denominator, a, b, numerator1, numerator2, result = {
      x: null,
      y: null,
      onLine1: false,
      onLine2: false
  };
  denominator = ((l2EndY - l2StartY) * (l1EndX - l1StartX)) - ((l2EndX - l2StartX) * (l1EndY - l1StartY));
  if (denominator == 0) {
      return result;
  }
  a = l1StartY - l2StartY;
  b = l1StartX - l2StartX;
  numerator1 = ((l2EndX - l2StartX) * a) - ((l2EndY - l2StartY) * b);
  numerator2 = ((l1EndX - l1StartX) * a) - ((l1EndY - l1StartY) * b);
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = l1StartX + (a * (l1EndX - l1StartX));
  result.y = l1StartY + (a * (l1EndY - l1StartY));

  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a > 0 && a < 1) {
      result.onLine1 = true;
  }
  // if line2 is a segment and line1 is infinite, they intersect if:
  if (b > 0 && b < 1) {
      result.onLine2 = true;
  }
  // if line1 and line2 are segments, they intersect if both of the above are true
  return result;
}

function sendUpdates() {
  var playerIndexGrid = sortObjectsIntoGrids(players);

  for (var i = 0; i < players.length; i++) {
    var p = players[i];

    //var objsToSend = getObjectsForPlayer(p, playerIndexGrid, objectIndexGrid);
    //objsToSend['scores'] = scores;

    var objsToSend = {
      "players": players,
      "objects": objects,
      "scores": scores
    }
  
    // Check for collisions between player and local objects.
    //checkForCollosions(p, objsToSend.objects);

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
