// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyStopPointHaveArrivalAndDepartureTime
//  Description : Make sure every Line is referenced from another element
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everyStopPointHaveArrivalAndDepartureTime";
const description = 
`Make sure that every StopPointInJourneyPattern contains a arrival/departure time
 and that every ScheduledStopPointRef exist`;

const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const journeyPatternsPath = xpath.join(framesPath, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]");
const stopPointRefPath = xpath.join("pointsInSequence", "StopPointInJourneyPattern", "ScheduledStopPointRef", "@ref");
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints");
const timetablePath = xpath.join(framesPath, "TimetableFrame", "vehicleJourneys", "ServiceJourney", "passingTimes", "TimetabledPassingTime"); 
const stopPointIDPath = xpath.join("pointsInSequence", "StopPointInJourneyPattern", "@id")
const departureTimePath = xpath.join("DepartureTime");
const arrivalTimePath = xpath.join("ArrivalTime");

// entry point in script
function main(ctx) {
  const journeyPatterns = ctx.xpath.find(journeyPatternsPath);

  ctx.log.debug(`creating ${journeyPatterns.length} tasks`);

  // queue worker tasks
  journeyPatterns.forEach(node => ctx.worker.queue("worker", node));

  // execute worker tasks
  const errors = ctx.worker.execute();

  return errors;
}

// worker logic done in separate threads
function worker(ctx) {
  return [
    ...validateStopPointReferences(ctx),
    ...validatePassingTimes(ctx),
  ];
}

function validateStopPointReferences(ctx) {
  const errors = [];
  const refNodes = ctx.xpath.find(stopPointRefPath, ctx.node);
  const sharedDataDoc = ctx.importDocument("_shared_data");

  return refNodes.map(n => [n, xpath.value(n)])
    .reduce((errors, ref) => {
      const stopPath = xpath.join(scheduledStopPointsPath, `ScheduledStopPoint[@id = '${ref[1]}']`);
      const n = xpath.first(sharedDataDoc || ctx.nodeContext, stopPath);

      if (!n) {
        errors.push({
          type: "consistency",
          message: `Missing ScheduledStopPoint(@id=${ref[1]})`,
          line: ctx.xpath.line(ref[0]),
        });
      }

      return errors;
    }, []);
}

function validatePassingTimes(ctx) {
  const errors = [];
  const stopPoints = ctx.xpath.find(stopPointIDPath, ctx.node);

  for (let i = 0; i < stopPoints.length; i++) {
    const stopPoint = stopPoints[i]
    const id = xpath.value(stopPoint);
    const passingTimesPath = xpath.join(timetablePath, `StopPointInJourneyPatternRef[@ref = '${id}']`);
    const errorMessageBase = `for StopPointInJourneyPattern(@id='${id}')`;
    const passingTimes = ctx.xpath.find(passingTimesPath, ctx.document);
    if (passingTimes.length === 0) {
      errors.push({
        type: "consistency",
        message: `Expected passing times ${errorMessageBase}`,
      });
      continue;
    }

    for (let n = 0; n < passingTimes.length; n++) {
      const passingTime = passingTimes[n];
      const timetabledPassingTime = xpath.parent(passingTime);

      const tid = ctx.xpath.findValue("@id", timetabledPassingTime);

      if (i !== stopPoints.length - 1) {
        const departureTime = ctx.xpath.findValue(departureTimePath, timetabledPassingTime);
        if (departureTime === "") {
          errors.push({
            message: `Expected departure time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`,
          });
        }
      }
      if (i !== 0) {
        const arrivalTime = ctx.xpath.findValue(arrivalTimePath, timetabledPassingTime);
        if (arrivalTime === "") {
          errors.push({
            message: `Expected arrival time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`,
          });
        }
      }
    }
  }

  return errors;
}