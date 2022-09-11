/**
 * @name passingTimesHaveIncreasingTimes
 * @overview Makes sure passing times have increasing times and day offsets
 * @author Concrete IT
 */
const name = "passingTimesHaveIncreasingTimes";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const timetablePath = xpath.join(xpath.path.FRAMES, "TimetableFrame", "vehicleJourneys", "ServiceJourney", "passingTimes");
const stopPointPath = xpath.join(xpath.path.FRAMES, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]", "pointsInSequence");
const stopPointRefPath = xpath.join("StopPointInJourneyPatternRef/@ref");
const arrivalTimePath = xpath.join("ArrivalTime");
const arrivalOffsetPath = xpath.join("ArrivalDayOffset");
const departureTimePath = xpath.join("DepartureTime");
const departureOffsetPath = xpath.join("DepartureDayOffset");

/**
 * Makes sure passing times have increasing times and day offsets
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  ctx.node.find(timetablePath)
    .getOrElse(() => [])
    .forEach(n => ctx.worker.queue("worker", n));

  return ctx.worker.run().get();
}

/**
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function worker(ctx) {
  const res = [];
  const serviceJourney = ctx.node.first("parent::netex:ServiceJourney").get();
  const passingTimes = ctx.node.find(xpath.join("TimetabledPassingTime")).get();
  const id = serviceJourney.valueAt("@id").get();
  let prevArrivalDayOffset;
  let prevDepartureTime;
  let prevDepartureDayOffset;

  passingTimes.forEach((node, i) => {
    const tid = node.valueAt("@id").get();
    const stopPointID = node.valueAt(stopPointRefPath).get();
    const arrivalTime = node.valueAt(arrivalTimePath).get();
    const arrivalDayOffset = node.valueAt(arrivalOffsetPath).get();
    const departureTime = node.valueAt(departureTimePath).get();
    const departureDayOffset = node.valueAt(departureOffsetPath).get();

    if (i !== 0) {
      if (prevDepartureTime >= arrivalTime && arrivalDayOffset === prevArrivalDayOffset) {
        res.push(errors.ConsistencyError(
          `Expected passing time to increase in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`,
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
