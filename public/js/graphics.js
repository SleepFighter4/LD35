/* Graphics APIs */
"use strict"

var CAR_BODY_COLOR="#FF00FF"
var CAR_PANEL_COLOR="#FF0000"
var CAR_GLASS_COLOR="#6699ff"

var backgroundcanvas;

function drawbuilding(ctx, pos_x, pos_y, width, height)
{
  console.log("OH HEY");
  //BODY
  ctx.fillStyle = #101010;
  ctx.fillRect(pos_x, pos_y, width, height);
}

function drawcar(x,y)
{
  var canvas = document.getElementById('car-canvas');
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
  ctx.rotate(30*Math.PI/180);
}

function initbackground()
{
  backgroundcanvas = document.createElement("canvas");
}

function getLocalCoords(player, canvas, x, y)
{
// Return coordinates for the user's canvas based when
// given global coordinates.
  return {
           x:canvas.width/2 - (player.x-x),
           y:canvas.height/2 - (player.y-y)
         };
}

function drawObjects(objects, player, canvas)
{
  var ctx = canvas.getContext("2d");*/
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(rotation*Math.PI/180);
  var i;
  for(i = 0; i < objects.length; i++)
  {
    getLocalCoords(player, canvas, x, y);
    drawbuilding(ctx,
                 objects[i].pos_x,
                 objects[i].pos_y,
                 objects[i].width,
                 objects[i].height);
  }
  ctx.restore();
}

function building(color, pos_x, pos_y, width, height)
{
  this.color = color;
  this.pos_x = pos_x;
  this.pos_y = pos_y;
  this.width = width;
  this.height = height;
}

/*var objects = [
  new building("#00FF00", 50, 50, 100, 100),
  new building("#00FF00", 100, 100, 100, 100)
]*/

function draw(canvas)
{
  drawcar(12,12);
  drawbackground(objects, 5, canvas);
}
