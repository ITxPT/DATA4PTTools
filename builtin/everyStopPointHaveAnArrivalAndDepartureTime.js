/**
 * @name everyStopPointHaveArrivalAndDepartureTime
 * @overview Make sure every Line is referenced from another element
 * @author Concrete IT
 */
const name = "everyStopPointHaveArrivalAndDepartureTime";
const { Context, Node, Result } = require("types");
const xpath = require("xpath");
const journeyPatternsPath = xpath.join(
  xpath.path.FRAMES,
  "ServiceFrame",
  "journeyPatterns",
  "*[contains(name(),'JourneyPattern')]",
);
const stopPointRefPath = xpath.join(
  "pointsInSequence",
  "StopPointInJourneyPattern",
  "ScheduledStopPointRef",
  "@ref",
);
const scheduledStopPointsPath = xpath.join(
  xpath.path.FRAMES,
  "ServiceFrame",
  "scheduledStopPoints",
);
const timetablePath = xpath.join(
  xpath.path.FRAMES,
  "TimetableFrame",
  "vehicleJourneys",
  "ServiceJourney",
  "passingTimes",
  "TimetabledPassingTime",
);
const stopPointIDPath = xpath.join(
  "pointsInSequence",
  "StopPointInJourneyPattern",
  "@id",
);
const departureTimePath = xpath.join("DepartureTime");
const arrivalTimePath = xpath.join("ArrivalTime");

/**
 * Make sure that every StopPointInJourneyPattern contains a arrival/departure 
 * time and that every ScheduledStopPointRef exist.
 * @param {Context} ctx
 */
function main(ctx) {
  ctx.node.find(journeyPatternsPath)
    .getOrElse(() => [])
    .forEach((/** @type {Node} */ n) => ctx.worker.queue("worker", n));

  return ctx.worker.run();
}

/**
 * @param {Context} ctx
 */
function worker(ctx) {
  return [
    ...validateStopPointReferences(ctx),
    ...validatePassingTimes(ctx),
  ];
}

/**
 * @param {Context} ctx
 */
function validateStopPointReferences(ctx) {
  const res = [];

  ctx.node.find(stopPointRefPath)
    .getOrElse(() => [])
    .forEach((/** @type {Node} */ node) => {
      const ref = `ScheduledStopPoint[@id = '${node.value()}']`;
      const stopPath = xpath.join(scheduledStopPointsPath, ref);

      if (!ctx.collection.first(stopPath).get()) {
        res.push({
          type: "consistency",
          message: `Missing ${ref}`,
          line: node.line(),
        });
      }
    });

  return res;
}

/**
 * @param {Context} ctx
 */
function validatePassingTimes(ctx) {
  const res = [];

  ctx.node.find(stopPointIDPath)
    .getOrElse(() => [])
    .forEach((/** @type {Node} */ node, i, nodes) => {
      const id = node.value();
      const ref = `StopPointInJourneyPatternRef[@ref = '${id}']`;
      const passingTimesPath = xpath.join(timetablePath, ref);
      const errorMessageBase = `for <StopPointInJourneyPattern id='${id}' />`;
      const passingTimes = ctx.document.find(passingTimesPath).get();
      const isFirstElement = i === 0;
      const isLastElement = i === nodes.length - 1;

      if (!passingTimes) {
        res.push({
          type: "consistency",
          message: `Expected passing times ${errorMessageBase}`,
        });
        return;
      }

      passingTimes.forEach((n) => {
        const node = n.parent().get();
        const tid = node.valueAt("@id").get();

        if (!tid) {
          res.push({
            message: `Element <TimetabledpassingTime /> is missing attribute @id ${errorMessageBase}`,
            line: node.line(),
          });
        }
        if (!isFirstElement && !node.find(departureTimePath).get()) {
          res.push({
            message: `Expected departure time in <TimetabledpassingTime id='${tid}' /> ${errorMessageBase}`,
            line: node.line(),
          });
        }
        if (!isLastElement && !node.find(arrivalTimePath).get()) {
          res.push({
            message: `Expected arrival time in <TimetabledpassingTime id='${tid}' /> ${errorMessageBase}`,
            line: node.line(),
          });
        }
      });
    });

  return res;
}
