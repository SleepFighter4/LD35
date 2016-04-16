/* Graphics APIs */
"use strict"

var CAR_BODY_COLOR="#FF00FF"
var CAR_PANEL_COLOR="#FF0000"
var CAR_GLASS_COLOR="#6699ff"

function drawbuilding(color,pos_x,pos_y, width, height)
{
	//BODY
	ctx.fillStyle = color;
	ctx.fillRect(pos_x, pos_y, width, height);
}

function drawcar(x,y)
{
	var canvas = $("#car-canvas")[0];
	var ctx = canvas.getContext("2d");

	//BODY
	ctx.fillStyle = CAR_BODY_COLOR;
	ctx.fillRect(x,y,50,100);
	//BONNET
	ctx.fillStyle = CAR_PANEL_COLOR;
	ctx.fillRect(x,y,50,20);
	//WINDSHIELD
	ctx.fillStyle = CAR_GLASS_COLOR;
	ctx.fillRect(x+5,y+25,40,15);
	//ROOF
	ctx.fillStyle = CAR_PANEL_COLOR;
	ctx.fillRect(x+5,y+45,40,15);
	//BACKWINDSHIELD
	ctx.fillStyle = CAR_GLASS_COLOR;
	ctx.fillRect(x+5,x+65,40,15);
	//BOOT
	ctx.fillStyle = CAR_PANEL_COLOR;
	ctx.fillRect(x+0,x+85,50,20);
}

function drawbackground(buildingarray, rotation)
{
	var canvas = $("#building-canvas")[0];
	var ctx = canvas.getContext("2d");

	for(i = 0; i < buildingarray.length; i++)
	{
		drawbuilding(
	}
	ctx.rotate(rotation);
}
