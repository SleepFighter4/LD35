function Player(id, name) {
  this.id = id;
  this.name = name;
  this.x = 100.0;
  this.y = -100.0;
  this.w = 60;
  this.h = 90;
  this.vX = 0.0;
  this.vY = 0.0;
  this.angle = -90.0;
  this.rotationSpeed = 45.0;
  this.shiftFactor = 1.0;
  this.keyState = {};
  this.lastMovedTime = Date.now();
  this.canvasSize = {"x":1920,"y":1080};
  this.xGrid = null;
  this.yGrid = null;
  this.lastXGrid = null;
  this.lastYGrid = null;
  this.ping = 0;
  this.pingStart = Date.now();
  this.checkPoint = 0;
  this.participating = true;;
}
exports.Player = Player;
