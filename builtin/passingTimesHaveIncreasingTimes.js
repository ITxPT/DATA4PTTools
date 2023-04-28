/**
 * @name passingTimesIsNotDecreasing
 * @overview Makes sure passing times don't have decreasing times and day offsets
 * @author Concrete IT
 */
const name = "passingTimesIsNotDecreasing";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const serviceJourneyPath = xpath.join(xpath.path.FRAMES, "TimetableFrame", "vehicleJourneys", "ServiceJourney");
const timetablePath = xpath.join("passingTimes", "TimetabledPassingTime");
const stopPointPath = xpath.join(xpath.path.FRAMES, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]", "pointsInSequence");
const stopPointRefPath = xpath.join("StopPointInJourneyPatternRef/@ref");
const arrivalTimePath = xpath.join("ArrivalTime");
const arrivalOffsetPath = xpath.join("ArrivalDayOffset");
const departureTimePath = xpath.join("DepartureTime");
const departureOffsetPath = xpath.join("DepartureDayOffset");

/**
 * Makes sure passing times don't have decreasing times and day offsets
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  ctx.node.find(serviceJourneyPath)
    .getOrElse(() => [])
    .forEach((n) => ctx.worker.queue("worker", n));

  return ctx.worker.run().get();
}

function worker(ctx) {
  const res = [];
  const passingTimes = ctx.node.find(timetablePath).get();
  const id = ctx.node.attr("id").get();
  let prevArrivalDayOffset;
  let prevDepartureTime;
  let prevDepartureDayOffset;

  passingTimes.forEach((node, i) => {
    const tid = node.attr("id").get();
    const stopPointID = node.textAt(stopPointRefPath).get();
    const arrivalTime = node.textAt(arrivalTimePath).get();
    const arrivalDayOffset = node.textAt(arrivalOffsetPath).get();
    const departureTime = node.textAt(departureTimePath).get();
    const departureDayOffset = node.textAt(departureOffsetPath).get();

    if (i !== 0) {
      if (prevDepartureTime > arrivalTime && arrivalDayOffset === prevArrivalDayOffset) {
        res.push(errors.ConsistencyError(
          `Expected passing time to not decrease in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`,
          { line: node.line() },
        ));
      }
    }
    if (arrivalDayOffset && prevArrivalDayOffset && arrivalDayOffset < prevArrivalDayOffset) {
      res.push(errors.ConsistencyError(
        `ArrivalDayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`,
        { line: node.line() },
      ));
    }
    if (departureDayOffset && prevDepartureDayOffset && departureDayOffset < prevDepartureDayOffset) {
      res.push(errors.ConsistencyError(
        `DepartureDayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`,
        { line: node.line() },
      ));
    }

    prevArrivalDayOffset = arrivalDayOffset;
    prevDepartureTime = departureTime;
    prevDepartureDayOffset = departureDayOffset;

    if (!ctx.document.find(xpath.join(
      stopPointPath,
      `StopPointInJourneyPattern[@id = '${stopPointID}']`,
    ))) {
      res.push(errors.ConsistencyError(
        `Expected StopPointInJourneyPattern(@id=${id}`,
        { line: node.line() },
      ));
    }
  });

  return res;
}
