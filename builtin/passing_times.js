const name = "passing-times";
const description = "Makes sure passing times have increasing have increasing times and day offsets";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const timetablePath = xpath.join(framesPath, "TimetableFrame", "vehicleJourneys", "ServiceJourney", "passingTimes");
const stopPointPath = xpath.join(framesPath, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]", "pointsInSequence");
const stopPointRefPath = xpath.join("StopPointInJourneyPatternRef/@ref");
const arrivalTimePath = xpath.join("ArrivalTime");
const arrivalOffsetPath = xpath.join("ArrivalDayOffset");
const departureTimePath = xpath.join("DepartureTime");
const departureOffsetPath = xpath.join("DepartureDayOffset");

function main(ctx) {
  const passingTimes = ctx.xpath.find(timetablePath);

  ctx.log.debug(`creating ${passingTimes.length} tasks`);

  // queue worker tasks
  passingTimes.forEach(node => ctx.worker.queue("worker", node));

  // execute worker tasks
  const errors = ctx.worker.execute();

  return errors;
}

function worker(ctx) {
  const errors = [];
  const serviceJourney = ctx.xpath.first("parent::netex:ServiceJourney", ctx.node);
  const passingTimes = ctx.xpath.find(xpath.join("TimetabledPassingTime"), ctx.node);
  const id = ctx.xpath.findValue("@id", serviceJourney);
  let prevArrivalDayOffset;
  let prevDepartureTime;
  let prevDepartureDayOffset;

  for (let i = 0; i < passingTimes.length; i++) {
    const passingTime = passingTimes[i];
    const line = ctx.xpath.line(passingTime);
    const stopPointID = ctx.xpath.findValue(stopPointRefPath, passingTime);
    const arrivalTime = ctx.xpath.findValue(arrivalTimePath, passingTime);
    const arrivalDayOffset = ctx.xpath.findValue(arrivalOffsetPath, passingTime);
    const departureTime = ctx.xpath.findValue(departureTimePath, passingTime);
    const departureDayOffset = ctx.xpath.findValue(departureOffsetPath, passingTime);
    const tid = ctx.xpath.findValue("@id", passingTime);
    if (i !== 0) {
      if (prevDepartureTime >= arrivalTime && arrivalDayOffset === prevArrivalDayOffset) {
        errors.push({
          type: "consistency",
          message: `Expected passing time to increase in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`,
          line,
        });
      }
    }
    if (arrivalDayOffset && prevArrivalDayOffset && arrivalDayOffset < prevArrivalDayOffset) {
      errors.push({
        type: "consistency",
        message: `ArrivalDayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`,
        line,
      });
    }
    if (departureDayOffset && prevDepartureDayOffset && departureDayOffset < prevDepartureDayOffset) {
      errors.push({
        type: "consistency",
        message: `DepartureDayOffset must not decrease in sequence in ServiceJourney(@id=${id}), TimetabledPassingTime(@id=${tid})`,
        line,
      });
    }

    prevArrivalDayOffset = arrivalDayOffset;
    prevDepartureTime = departureTime;
    prevDepartureDayOffset = departureDayOffset;

    if (!ctx.xpath.first(xpath.join(stopPointPath, `StopPointInJourneyPattern[@id = '${stopPointID}']`), ctx.document)) {
      errors.push({
        type: "consistency",
        message: `Expected StoPointInJourneyPattern(@id=${id}`,
        line,
      });
    }
  }

  return errors;
}
