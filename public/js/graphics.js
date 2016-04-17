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

function getCarLocalCoords(player, canvas, x, y)
{
  console.log("player.x = " + player.x +
              " player.y = " + player.y +
              " x = " + x +
              " y = " + y);
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
  ctx.rotate(player.angle*Math.PI/180);

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
