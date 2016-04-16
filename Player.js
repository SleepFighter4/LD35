function Player(id) {
	this.id = id;
	this.x = 0.0;
	this.y = 0.0;
	this.vX = 0.0;
	this.vY = 0.0;
	this.angle = 0.0;
	this.rotationSpeed = 10.0;
	this.shiftFactor = 1.0;
	this.keyState = {};
	this.lastMovedTime = Date.now();

	return {
		id: this.id,
		x: this.x,
		y: this.y,
		vX: this.vX, // Velocity X px / sec
		vY: this.vY, // Velocity Y px / sec
		angle: this.angle, // deg
		rotationSpeed: this.rotationSpeed, // deg / sec
		shiftFactor: this.shiftFactor,
		keyState: this.keyState,
		lastMovedTime: this.lastMovedTime
	};
}
exports.Player = Player;