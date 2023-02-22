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
  "JourneyPattern",
  // TODO issue with this query for some reason
  // "*[contains(name(),'JourneyPattern')]", TODO
);
const stopPointRefPath = xpath.join(
  "pointsInSequence",
  "StopPointInJourneyPattern",
  "ScheduledStopPointRef",
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
  // been disabled to fix issue with parent and collection api
/*   ctx.node.find(journeyPatternsPath)
 *     .getOrElse(() => [])
 *     .forEach(([>* @type {types.Node} <] n) => ctx.worker.queue("worker", n));
 *
 *   return ctx.worker.run().get(); */
  return [];
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
      const line = node.line();
      const refID = node.attr("ref").get();
      const ref = `ScheduledStopPoint[@id = '${refID}']`;
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
      const line = node.line();
      const id = node.attr("id").get();
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
        const tid = node.attr("id").get();

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
