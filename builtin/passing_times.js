const name = "passing-times";
const description = "Makes sure passing times have increasing have increasing times and day offsets";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const timetablePath = xpath.join(framesPath, "TimetableFrame", "vehicleJourneys", "ServiceJourney", "passingTimes");
const stopPointPath = xpath.join(framesPath, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]", "pointsInSequence");

function main(context) {
  const { log, nodeContext, document } = context;
  const passingTimes = xpath.find(nodeContext, timetablePath);

  log.debug(`creating '${passingTimes.length} tasks`);

  // queue worker tasks
  passingTimes.forEach(node => context.queue("worker", node));

  // execute worker tasks
  const errors = context.execute();

  if (errors.length === 0) {
    log.info("validation without any errors");
  } else {
    log.info("validation completed with '%d' errors", errors.length);
  }

  return errors;
}

function worker(workerContext) {
  const { log, nodeContext, document, node } = workerContext;
  const errors = [];
  const serviceJourney = xpath.first(nodeContext, "./parent::netex:ServiceJourney", node);
  const passingTimes = xpath.find(nodeContext, xpath.join(".", "TimetabledPassingTime"), node);
  const id = xpath.findValue(nodeContext, "@id", serviceJourney);
  let prevArrivalDayOffset;
  let prevDepartureTime;
  let prevDepartureDayOffset;

  for (let i = 0; i < passingTimes.length; i++) {
    const passingTime = passingTimes[i];
    const stopPointID = xpath.findValue(nodeContext, xpath.join(".", "StopPointInJourneyPatternRef/@ref"), passingTime);
    const arrivalTime = xpath.findValue(nodeContext, xpath.join(".", "ArrivalTime"), passingTime);
    const arrivalDayOffset = xpath.findValue(nodeContext, "./netex:ArrivalDayOffset", passingTime);
    const departureTime = xpath.findValue(nodeContext, "./netex:DepartureTime", passingTime);
    const departureDayOffset = xpath.findValue(nodeContext, "./netex:DepartureDayOffset", passingTime);
    const tid = xpath.findValue(nodeContext, "@id", passingTime);
    if (i !== 0) {
      if (prevDepartureTime >= arrivalTime && arrivalDayOffset === prevArrivalDayOffset) {
        errors.push(`Expected passing time to increase in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`);
      }
    }
    if (arrivalDayOffset && prevArrivalDayOffset && arrivalDayOffset < prevArrivalDayOffset) {
      errors.push(`ArrivalDayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`);
    }
    if (departureDayOffset && prevDepartureDayOffset && departureDayOffset < prevDepartureDayOffset) {
      errors.push(`DepartureDayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`);
    }

    prevArrivalDayOffset = arrivalDayOffset;
    prevDepartureTime = departureTime;
    prevDepartureDayOffset = departureDayOffset;

    if (!stopPointExist(workerContext, stopPointID)) {
      errors.push(`Expected StoPointInJourneyPattern(@id=${id}`);
    }
  }

  return errors;
}

function stopPointExist(ctx, id) {
  const { log, nodeContext, document } = ctx
  const stopIDPath = xpath.join(stopPointPath, `StopPointInJourneyPattern[@id = '${id}']`);

  return !!xpath.first(nodeContext, stopIDPath, document);
}
