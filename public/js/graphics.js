/* Graphics APIs */
"use strict"

var CAR_BODY_COLOR="#FF00FF"
var CAR_PANEL_COLOR="#FF0000"
var CAR_GLASS_COLOR="#6699ff"

var backgroundcanvas;

//IMAGES
var car1 = new Image(); car1.src = 'images/GreenCar.png';
var car2 = new Image(); car2.src = 'images/RedCar.png';
var car3 = new Image(); car3.src = 'images/BlueCar.png';
var CAR_NO = 1;

var building1 = new Image(); building1.src = 'images/BuildingPink.png';
var building2 = new Image(); building2.src = 'images/BuildingBlue.png';
var building3 = new Image(); building3.src = 'images/BuildingGreen.png';
var BUILDING_NO = 2

function centerText(canvas, ctx, string)
{
      ctx.fillText(string, (canvas.width/2), (canvas.height/2));
}

function drawBuilding(ctx, x, y, width, height, angle, color)
{
  //ctx.save();
  //ctx.translate(x+width/2, y+height/2);
  //ctx.rotate((angle-90)*Math.PI/180);
  if(color == 1){ctx.drawImage(building1, x-width/2, y-height/2, width, height);}
  else if(color == 2){ctx.drawImage(building2, x-width/2, y-height/2, width, height);}
  else if(color == 3){ctx.drawImage(building3, x-width/2, y-height/2, width, height);}
  else {ctx.drawImage(building1, x-width/2, y-height/2, width, height);}
  //ctx.restore();
  //BODY
  /*ctx.fillStyle = "#101010";
  ctx.fillRect(pos_x, pos_y, width, height);*/
}

function drawCar(ctx, x, y, width, height, angle, color)
{
  x -= width/2;
  y -= height/2;

  ctx.save();
  ctx.translate(x+width/2, y+height/2);
  ctx.rotate((angle-90)*Math.PI/180);
  if(color == 1){ctx.drawImage(car1, -width/2, -height/2, width, height);}
  else if(color == 2){ctx.drawImage(car2, -width/2, -height/2, width, height);}
  else if(color == 3){ctx.drawImage(car3, -width/2, -height/2, width, height);}
  else {ctx.drawImage(car1, -width/2, -height/2, width, height);}
  ctx.restore();
  /*function tx(a){return x+a*width;}
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
  //BOsOT
  ctx.fillStyle = CAR_PANEL_COLOR;
  ctx.fillRect(tx(0),ty(0.85),bx(1),by(0.20));*/
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
  drawCar(ctx, x, y, player.w, player.h, 90, player.c);
  /*var playerText = "Player: " + player.x + " x " + player.y;
  ctx.fillText(playerText, 38, 40);*/
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
                 objects[i].w,
                 objects[i].h,
                 objects[i].c);
    //var buildingText = "Buildings: " + coords.x + " x " + coords.y;
    //ctx.fillText(buildingText, 38, 50 + i*10);
  }

  for(i = 0; i < opponents.length; i++)
  {
    var coords = getCarLocalCoords(player, canvas, opponents[i].x, opponents[i].y);
    if(opponents[i].id != player.id && opponents[i].participating)
    {
      drawCar(ctx,
            coords.x/*-(opponents[i].w/2)*/,
            coords.y/*-(opponents[i].h/2)*/,
            opponents[i].w,
            opponents[i].h,
            opponents[i].angle,
            opponents[i].c);
      //console.log(opponents[i].c);
      /*var playerText = "Players: " + opponents[i].x + " x " + opponents[i].y;
      ctx.fillText(playerText, 38, 200 + i*10);
      var playerText = "Players: " + coords.x + " x " + coords.y;
      ctx.fillText(playerText, 38, 300 + i*10);*/
    } 
  }

  ctx.strokeStyle="#000000"
  ctx.lineWidth = 10;
  for(var side = 0; side < 2; side++)
  {
    var points = map[side];
    for(var p = 0; p < points.length; p++)
    {
      ctx.beginPath();
      var coords = getCarLocalCoords(player,
        canvas,
        points[p].x,
        points[p].y
      )
      ctx.moveTo(coords.x, coords.y);
      var coords = getCarLocalCoords(
        player,
        canvas,
        points[(p + 1) % map[side].length].x,
        points[(p + 1) % map[side].length].y
      )
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  }
/*
  ctx.strokeStyle="#000000"
  ctx.strokeStyle="#ffffff"
  var playerCorners = player.corners

    ctx.strokeStyle="#FFFFFF"
    var coords = getCarLocalCoords(player, canvas, playerCorners[0][0], playerCorners[0][1]);
    ctx.rect(coords.x-1,coords.y-1,2,2);
    ctx.stroke();

    ctx.strokeStyle="#FF0000"
    var coords = getCarLocalCoords(player, canvas, playerCorners[1][0], playerCorners[1][1]);
    ctx.rect(coords.x-1,coords.y-1,2,2);
    ctx.stroke();

    ctx.strokeStyle="#00FF00"
    var coords = getCarLocalCoords(player, canvas, playerCorners[2][0], playerCorners[2][1]);
    ctx.rect(coords.x-1,coords.y-1,2,2);
    ctx.stroke();

    ctx.strokeStyle="#0000FF"
    var coords = getCarLocalCoords(player, canvas, playerCorners[3][0], playerCorners[3][1]);
    ctx.rect(coords.x-1,coords.y-1,2,2);
    ctx.stroke();

  for (i = 0; i < player.collisionPoints.length; i++) {
    console.log(player.collisionPoints[i])
    var coords = getCarLocalCoords(player, canvas, player.collisionPoints[i][0], player.collisionPoints[i][1]);
    ctx.rect(coords.x-1, coords.y-1, 2, 2);
    ctx.stroke();
  }
*/

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


