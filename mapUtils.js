"use strict";

var leftPath = [
  {"x":    0,"y":    0},
  {"x":    0,"y":-1000},
  {"x": -200,"y":-1200},
  {"x": -800,"y":-1200},
  {"x": -800,"y": -600},
  {"x":-1500,"y": -600},
  {"x":-1500,"y":-1800},
  {"x":  200,"y":-1800},
  {"x":  300,"y":-1500},
  {"x":  600,"y":-1500},
  {"x": 1000,"y":-1000},
  {"x": 1000,"y":    0}
];
var width = 200;
var map = [leftPath, generateRightPath(leftPath, width)];
exports.map = map;

function generateRightPath(leftPath, width) {
  var rightPath = [];
  var rightLines = [];
  var leftPathAngles = [];

  function modLen(i) {
    return (leftPath.length + i) % leftPath.length;
  }

  for(var i = 0; i < leftPath.length; i++) {
    // Let each right piece of the track be a line parallel
    // the left piece, 'width' distance away.
    var startAngle = Math.atan2(
      leftPath[modLen(i+1)].y - leftPath[i].y,
      leftPath[modLen(i+1)].x - leftPath[i].x
    );
    var perpendicularAngle = (startAngle + Math.PI / 2);
    rightLines.push({
      "x": leftPath[i].x + width * Math.cos(perpendicularAngle),
      "y": leftPath[i].y + width * Math.sin(perpendicularAngle),
      "x2": leftPath[modLen(i+1)].x + width * Math.cos(perpendicularAngle),
      "y2": leftPath[modLen(i+1)].y + width * Math.sin(perpendicularAngle)
    });
  }

  for(var i = 0; i < rightLines.length; i++) {
    // Find the intersection of the current last line with the current one.
    // Add the intersection point to the right path.
    var L1 = rightLines[modLen(i-1)];
    var L2 = rightLines[i];
    var intersection = lineIntersection(L1.x,L1.y,L1.x2,L1.y2,L2.x,L2.y,L2.x2,L2.y2);
    rightPath.push({
      "x": intersection.x,
      "y": intersection.y
    });
  }
  return rightPath;
}

function lineIntersection(l1StartX, l1StartY, l1EndX, l1EndY, l2StartX, l2StartY, l2EndX, l2EndY) {
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
  var denominator, a, b, numerator1, numerator2, result = {
      x: null,
      y: null,
      onLine1: false,
      onLine2: false
  };
  denominator = ((l2EndY - l2StartY) * (l1EndX - l1StartX)) - ((l2EndX - l2StartX) * (l1EndY - l1StartY));
  if (denominator == 0) {
      return result;
  }
  a = l1StartY - l2StartY;
  b = l1StartX - l2StartX;
  numerator1 = ((l2EndX - l2StartX) * a) - ((l2EndY - l2StartY) * b);
  numerator2 = ((l1EndX - l1StartX) * a) - ((l1EndY - l1StartY) * b);
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = l1StartX + (a * (l1EndX - l1StartX));
  result.y = l1StartY + (a * (l1EndY - l1StartY));

  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a > 0 && a < 1) {
      result.onLine1 = true;
  }
  // if line2 is a segment and line1 is infinite, they intersect if:
  if (b > 0 && b < 1) {
      result.onLine2 = true;
  }
  // if line1 and line2 are segments, they intersect if both of the above are true
  return result;
}