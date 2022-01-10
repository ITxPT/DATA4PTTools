const name = "journey-pattern-timings";
const description = "Make sure that every StopPointInJourneyPattern contains a arrival/departure time and that every ScheduledStopPointRef exist";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const journeyPatternsPath = xpath.join(framesPath, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]");
const stopPointRefPath = xpath.join("pointsInSequence", "StopPointInJourneyPattern", "ScheduledStopPointRef", "@ref");
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints");
const timetablePath = xpath.join(framesPath, "TimetableFrame", "vehicleJourneys", "ServiceJourney", "passingTimes", "TimetabledPassingTime"); 

// entry point in script
function main(ctx) {
  const journeyPatterns = ctx.xpath.find(journeyPatternsPath);

  ctx.log.debug(`creating '${journeyPatterns.length}' tasks`);

  // queue worker tasks
  journeyPatterns.forEach(node => ctx.worker.queue("worker", node));

  // execute worker tasks
  const errors = ctx.worker.execute();

  if (errors.length === 0) {
    ctx.log.info("validation without any errors");
  } else {
    ctx.log.info("validation completed with '%d' errors", errors.length);
  }

  return errors;
}

// worker logic done in separate threads
function worker(ctx) {
  return [
    ...validateStopPointReferences(ctx),
    ...validatePassingTimes(ctx),
  ];
}

function validateStopPointReferences(ctx) {
  const errors = [];
  const refNodes = ctx.xpath.find(stopPointRefPath, ctx.node);
  const sharedDataDoc = ctx.importDocument("_shared_data");

  return refNodes.map(n => xpath.value(n))
    .reduce((errors, ref) => {
      const stopPath = xpath.join(scheduledStopPointsPath, `ScheduledStopPoint[@id = '${ref}']`);
      const n = xpath.first(sharedDataDoc || ctx.nodeContext, stopPath);

      if (!n) {
        errors.push(`Missing ScheduledStopPoint(@id=${ref})`);
      }

      return errors;
    }, []);
}

function validatePassingTimes(ctx) {
  const errors = [];
  const stopPoints = ctx.xpath.find("./netex:pointsInSequence/netex:StopPointInJourneyPattern/@id", ctx.node);

  for (let i = 0; i < stopPoints.length; i++) {
    const stopPoint = stopPoints[i]
    const id = xpath.value(stopPoint);
    const passingTimesPath = xpath.join(timetablePath, `StopPointInJourneyPatternRef[@ref = '${id}']`);
    const errorMessageBase = `for StopPointInJourneyPattern(@id='${id}')`;
    const passingTimes = ctx.xpath.find(passingTimesPath, ctx.document);
    if (passingTimes.length === 0) {
      errors.push(`Expected passing times ${errorMessageBase}`);
      continue;
    }

    for (let n = 0; n < passingTimes.length; n++) {
      const passingTime = passingTimes[n];
      const timetabledPassingTime = xpath.parent(passingTime);

      const tid = ctx.xpath.findValue("@id", timetabledPassingTime);

      if (i !== stopPoints.length - 1) {
        const departureTime = ctx.xpath.findValue(xpath.join(".", "DepartureTime"), timetabledPassingTime);
        if (departureTime === "") {
          errors.push(`Expected departure time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`);
        }
      }
      if (i !== 0) {
        const arrivalTime = ctx.xpath.findValue(xpath.join(".", "ArrivalTime"), timetabledPassingTime);
        if (arrivalTime === "") {
          errors.push(`Expected arrival time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`);
        }
      }
    }
  }

  return errors;
}
