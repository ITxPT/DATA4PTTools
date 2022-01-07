const name = "passing-times";
const description = "Makes sure passing times have increasing have increasing times and day offsets";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const timetablePath = xpath.join(framesPath, "TimetableFrame", "vehicleJourneys", "ServiceJourney", "passingTimes");
const stopPointPath = xpath.join(framesPath, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]", "pointsInSequence");

function main(context) {
  const { log, nodeContext } = context;
  const [passingTimes, err] = xpath.find(nodeContext, timetablePath);
  if (err) {
    return [err];
  }

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
  const { log, nodeContext } = workerContext;
  const errors = [];
  const [serviceJourney, serr] = xpath.first(nodeContext, "./parent::netex:ServiceJourney");
  if (serr) {
    return [serr];
  }
  const [passingTimes, err] = xpath.find(nodeContext, xpath.join(".", "TimetabledPassingTime"));
  if (err) {
    return [err];
  }

  setContextNode(nodeContext, serviceJourney);

  const [id] = xpath.findValue(nodeContext, "@id");
  let prevDepartureTime;
  let prevDepartureDayOffset;
  for (let i = 0; i < passingTimes.length; i++) {
    const passingTime = passingTimes[i];

    setContextNode(nodeContext, passingTime);

    const stopPointID = xpath.findValue(nodeContext, xpath.join(".", "StopPointInJourneyPatternRef/@ref"));
    const arrivalTime = xpath.findValue(nodeContext, xpath.join(".", "ArrivalTime"));
    const arrivalDayOffset = xpath.findValue(nodeContext, "./netex:ArrivalDayOffset");
    const departureTime = xpath.findValue(nodeContext, "./netex:DepartureTime");
    const departureDayOffset = xpath.findValue(nodeContext, "./netex:DepartureDayOffset");
    const [tid] = xpath.findValue(nodeContext, "@id");
    if (i !== 0) {
      if (prevDepartureTime >= arrivalTime) {
        errors.push(`Passing time does not increase in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`);
      }
    }
    if (arrivalDayOffset && prevDepartureDayOffset && arrivalDayOffset < prevDepartureDayOffset) {
      errors.push(`DayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`);
    }
    if (
      departureDayOffset &&
      (!arrivalDayOffset || departureDayOffset < arrivalDayOffset) &&
      (!prevDepartureDayOffset || departureDayOffset < prevDepartureDayOffset)
    ) {
      errors.push(`DayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`);
    }

    prevDepartureTime = departureTime;
    prevDepartureDayOffset = departureDayOffset;

    if (!stopPointExist(workerContext, id)) {
      errors.push(`Expected StoPointInJourneyPattern(@id=${id}`);
    }
  }

  return errors;
}

function stopPointExist(ctx, id) {
  const { nodeContext, document } = ctx
  const stopIDPath = xpath.join(stopPointPath, `StopPointInJourneyPattern[@id = '${id}']`);

  setContextNode(nodeContext, document);

  const [n] = xpath.first(nodeContext, stopPointPath);

  return !!n;
}
