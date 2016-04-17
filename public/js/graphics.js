/* Graphics APIs */
"use strict"

var CAR_BODY_COLOR="#FF00FF"
var CAR_PANEL_COLOR="#FF0000"
var CAR_GLASS_COLOR="#6699ff"

var backgroundcanvas;

function drawBuilding(ctx, pos_x, pos_y, width, height)
{
  //BODY
  ctx.fillStyle = "#101010";
  ctx.fillRect(pos_x, pos_y, width, height);
}

function drawCar(ctx, x, y, width, height, rotation)
{
  x -= width/2;
  y -= height/2;

  function tx(a){return x+a*width;}
  function ty(a){return y+a*height;}
  function bx(a){return a*width;}
  function by(a){return a*height;}

  //BODY
  ctx.fillStyle = CAR_BODY_COLOR;
  ctx.fillRect(x,y,width,height);
  //BONNET
  ctx.fillStyle = CAR_PANEL_COLOR;
  ctx.fillRect(tx(0),ty(0),bx(1),by(0.20));
  //WINDSHIELD
  ctx.fillStyle = CAR_GLASS_COLOR;
  ctx.fillRect(tx(0.05),ty(0.25),bx(0.9),by(0.15));
  //ROOF
  ctx.fillStyle = CAR_PANEL_COLOR;
  ctx.fillRect(tx(0.05),ty(0.45),bx(0.90),by(0.15));
  //BACKWINDSHIELD
  ctx.fillStyle = CAR_GLASS_COLOR;
  ctx.fillRect(tx(0.05),ty(0.65),bx(0.90),by(0.15));
  //BOOT
  ctx.fillStyle = CAR_PANEL_COLOR;
  ctx.fillRect(tx(0),ty(0.85),bx(1),by(0.20));
}

function initbackground()
{
  backgroundcanvas = document.createElement("canvas");
}

function getCarLocalCoords(player, canvas, x, y)
{
  // Return coordinates for the user's canvas based when
  // given global coordinates.
  return {
           x:(player.x-x),
           y:(player.y-y)
         };
 }

function drawPlayer(player, canvas, ctx)
{
  var x=canvas.width/2;
  var y=canvas.height/2;
  drawCar(ctx, x, y, player.w, player.h, 0);
  var playerText = "Player: " + player.x + " x " + player.y;
  ctx.fillText(playerText, 38, 40);
}

function drawObjects(objects, opponents, player, canvas, ctx)
{
  var i, x, y;

  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(-(player.angle-90)*Math.PI/180);

  for(i = 0; i < objects.length; i++)
  {
    var coords = getCarLocalCoords(player, canvas, objects[i].x, objects[i].y);
    drawBuilding(ctx,
                 coords.x,
                 coords.y,
                 50,//objects[i].w,
                 50);//objects[i].h);
    var buildingText = "Buildings: " + coords.x + " x " + coords.y;
    ctx.fillText(buildingText, 38, 50 + i*10);
  }

  for(i = 0; i < opponents.length; i++)
  {
    var coords = getCarLocalCoords(player, canvas, opponents[i].x, opponents[i].y);
    if(opponents[i].id != player.id)
    {
      drawCar(ctx,
            coords.x,
            coords.y,
            opponents[i].w,
            opponents[i].h,
            opponents[i].angle);

      var playerText = "Players: " + opponents[i].x + " x " + opponents[i].y;
      ctx.fillText(playerText, 38, 200 + i*10);
      var playerText = "Players: " + coords.x + " x " + coords.y;
      ctx.fillText(playerText, 38, 300 + i*10);
    }
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
  drawCar(12,12);
  drawbackground(objects, 5, canvas);
}
