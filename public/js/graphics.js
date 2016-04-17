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
  ctx.fillStyle = "#101010";
  ctx.fillRect(pos_x, pos_y, width, height);
}

function drawcar(ctx, x, y, width, height, rotation)
{
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
  ctx.fillRect(x+5,y+65,40,15);
  //BOOT
  ctx.fillStyle = CAR_PANEL_COLOR;
  ctx.fillRect(x+0,y+85,50,20);
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

function drawPlayer(player, canvas, ctx)
{
  var x=canvas.width/2;
  var y=canvas.height/2;
  drawcar(ctx, x, y, player.w, player.h, 0);
}

function drawObjects(objects, opponents, player, canvas, ctx)
{
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(player.angle*Math.PI/180);
  var i, x, y;

  for(i = 0; i < objects.length; i++)
  {
    x = objects[i].x;
    y = objects[i].y;
    getLocalCoords(player, canvas, x, y);
    drawbuilding(ctx,
                 x,
                 y,
                 objects[i].w,
                 objects[i].h);
  }

  for(i = 0; i < objects.length; i++)
  {
    x = opponents[i].x;
    y = opponents[i].y;
    getLocalCoords(player, canvas, x, y);
    drawcar(ctx,
            x,
            y,
            opponents[i].w,
            opponents[i].h,
            opponents[i].angle);
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
