/* Graphics APIs */
"use strict"

var CAR_BODY_COLOR="#FF00FF"
var CAR_PANEL_COLOR="#FF0000"
var CAR_GLASS_COLOR="#6699ff"

function drawbuilding(color,x,y)
{
	var canvas = $("#building-canvas")[0];
	var ctx = canvas.getContext("2d");

	//BODY
	ctx.fillStyle = color;
	ctx.fillRect(0,0,x,y);
}

function drawcar()
{
	var canvas = $("#car-canvas")[0];
	var ctx = canvas.getContext("2d");

	//BODY
	ctx.fillStyle = CAR_BODY_COLOR;
	ctx.fillRect(0,0,50,100);
	//BONNET
	ctx.fillStyle = CAR_PANEL_COLOR;
	ctx.fillRect(0,0,50,20);
	//WINDSHIELD
	ctx.fillStyle = CAR_GLASS_COLOR;
	ctx.fillRect(5,25,40,15);
	//ROOF
	ctx.fillStyle = CAR_PANEL_COLOR;
	ctx.fillRect(5,45,40,15);
	//BACKWINDSHIELD
	ctx.fillStyle = CAR_GLASS_COLOR;
	ctx.fillRect(5,65,40,15);
	//BOOT
	ctx.fillStyle = CAR_PANEL_COLOR;
	ctx.fillRect(0,85,50,20);
}
