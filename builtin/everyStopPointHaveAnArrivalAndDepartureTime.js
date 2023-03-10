/**
 * @name everyStopPointHaveArrivalAndDepartureTime
 * @overview Make sure every Line is referenced from another element
 * @author Concrete IT
 */
const name = "everyStopPointHaveArrivalAndDepartureTime";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const serviceJourneyPath = xpath.join(
  xpath.path.FRAMES,
  "TimetableFrame",
  "vehicleJourneys",
  "ServiceJourney",
);
const passingTimesPath = xpath.join("passingTimes", "TimetabledPassingTime");
const departureTimePath = xpath.join("DepartureTime");
const arrivalTimePath = xpath.join("ArrivalTime");

/**
 * Make sure that every StopPointInJourneyPattern contains a arrival/departure 
 * time and that every ScheduledStopPointRef exist.
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  ctx.node.find(serviceJourneyPath)
    .getOrElse(() => [])
    .forEach((/** @type {types.Node} */ n) => {
      ctx.worker.queue("worker", n)
    });

  return ctx.worker.run().get();
}

function worker(ctx) {
  const res = [];

  ctx.node.find(passingTimesPath)
    .getOrElse(() => [])
    .forEach((/** @type {types.Node} */ node, i, nodes) => {
      const line = node.line();
      const id = node.attr("id").get();
      const isFirstElement = i === 0;
      const isLastElement = i === nodes.length - 1;

      if (!id) {
        res.push(errors.ConsistencyError(
          `Element <TimetabledpassingTime /> is missing attribute @id`,
          { line },
        ));
      }
      if (!isLastElement && node.find(departureTimePath).isErr()) {
        res.push(errors.ConsistencyError(
          `Expected departure time in <TimetabledpassingTime id='${id}' />`,
          { line },
        ));
      }
      if (!isFirstElement && node.find(arrivalTimePath).isErr()) {
        res.push(errors.ConsistencyError(
          `Expected arrival time in <TimetabledpassingTime id='${id}' />`,
          { line },
        ));
      }
    })

  return res;
}
