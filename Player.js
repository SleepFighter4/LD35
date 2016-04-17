function Player(id) {
  this.id = id;
  this.x = 0.0;
  this.y = 0.0;
  this.vX = 0.0;
  this.vY = 0.0;
  this.angle = 90.0;
  this.rotationSpeed = 45.0;
  this.shiftFactor = 1.0;
  this.keyState = {};
  this.lastMovedTime = Date.now();
  this.canvasSize = {"x":1920,"y":1080};
  this.xGrid = null;
  this.yGrid = null;
  this.lastXGrid = null;
  this.lastYGrid = null;
}
exports.Player = Player;