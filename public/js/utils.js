/*
 * input:  gapless array of {x, y}
 * output: gapless array of boxes bounding the path
 *         {x, y} = center
 *         {w, h} = width & height
 */
function pathToBoxes(path) {
  var boxes = [];
  var previousStep = path[path.length-1];

  for(var step = 0; step < path.length; step++) {
    var currentStep = path[step];

    boxes.push({
      'x': (previousStep.x + currentStep.x) / 2,
      'y': (previousStep.y + currentStep.y) / 2
      'w': Math.abs(previousStep.x - currentStep.x),
      'h': Math.abs(previousStep.y - currentStep.y),
    });

    previousStep = currentStep;
  }

  return boxes;
}
