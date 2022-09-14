/**
 * @name everyStopPointHaveArrivalAndDepartureTime
 * @overview Make sure every Line is referenced from another element
 * @author Concrete IT
 */
const name = "everyStopPointHaveArrivalAndDepartureTime";
const errors = require("errors");
const types = require("types");
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
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  ctx.node.find(journeyPatternsPath)
    .getOrElse(() => [])
    .forEach((/** @type {types.Node} */ n) => ctx.worker.queue("worker", n));

  return ctx.worker.run().get();
}

/**
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function worker(ctx) {
  return [
    ...validateStopPointReferences(ctx),
    ...validatePassingTimes(ctx),
  ];
}

/**
 * @param {types.Context} ctx
 */
function validateStopPointReferences(ctx) {
  const res = [];

  ctx.node.find(stopPointRefPath)
    .getOrElse(() => [])
    .forEach((/** @type {types.Node} */ node) => {
      const line = node.parent().get().line();
      const ref = `ScheduledStopPoint[@id = '${node.value()}']`;
      const stopPath = xpath.join(scheduledStopPointsPath, ref);

      if (!ctx.collection.first(stopPath).get()) {
        res.push(errors.ConsistencyError(
          `Missing ${ref}`,
          { line },
        ));
      }
    });

  return res;
}

/**
 * @param {types.Context} ctx
 */
function validatePassingTimes(ctx) {
  const res = [];

  ctx.node.find(stopPointIDPath)
    .getOrElse(() => [])
    .forEach((/** @type {types.Node} */ node, i, nodes) => {
      const line = node.parent().get().line();
      const id = node.value();
      const ref = `StopPointInJourneyPatternRef[@ref = '${id}']`;
      const passingTimesPath = xpath.join(timetablePath, ref);
      const errorMessageBase = `for <StopPointInJourneyPattern id='${id}' />`;
      const passingTimes = ctx.document.find(passingTimesPath).get();
      const isFirstElement = i === 0;
      const isLastElement = i === nodes.length - 1;

      if (!passingTimes) {
        res.push(errors.ConsistencyError(`Expected passing times ${errorMessageBase}`));
        return;
      }

      passingTimes.forEach((n) => {
        const node = n.parent().get();
        const tid = node.valueAt("@id").get();

        if (!tid) {
          res.push(errors.ConsistencyError(
            `Element <TimetabledpassingTime /> is missing attribute @id ${errorMessageBase}`,
            { line },
          ));
        }
        if (!isFirstElement && !node.find(departureTimePath).get()) {
          res.push(errors.ConsistencyError(
            `Expected departure time in <TimetabledpassingTime id='${tid}' /> ${errorMessageBase}`,
            { line },
          ));
        }
        if (!isLastElement && !node.find(arrivalTimePath).get()) {
          res.push(errors.ConsistencyError(
            `Expected arrival time in <TimetabledpassingTime id='${tid}' /> ${errorMessageBase}`,
            { line },
          ));
        }
      });
    });

  return res;
}
