/*
 * input:  gapless array of {x, y}
 * output: gapless array of boxes bounding the path
 *         {x, y} = center
 *         {w, h} = width & height
 */
function pathToBoxes(path) {
  // The box will be at least this large/long
  var minThickness = 2;

  var boxes = [];
  var previousStep = path[path.length-1];

  for(var step = 0; step < path.length; step++) {
    var currentStep = path[step];
    var width  = Math.abs(previousStep.x - currentStep.x);
    var height = Math.abs(previousStep.y - currentStep.y);

    boxes.push({
      'x': (previousStep.x + currentStep.x) / 2,
      'y': (previousStep.y + currentStep.y) / 2,
      'w': Math.max(width,  minThickness),
      'h': Math.max(height, minThickness)
    });

    previousStep = currentStep;
  }

  return boxes;
}
