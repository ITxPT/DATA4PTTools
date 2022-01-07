const name = "journey-pattern-timings";
const description = "Make sure that every StopPointInJourneyPattern contains a arrival/departure time and that every ScheduledStopPointRef exist";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const journeyPatternsPath = xpath.join(framesPath, "ServiceFrame", "journeyPatterns", "*[contains(name(), 'JourneyPattern')]");
const stopPointRefPath = xpath.join("pointsInSequence", "StopPointInJourneyPattern", "ScheduledStopPointRef", "@ref");
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints");
const timetablePath = xpath.join(framesPath, "TimetableFrame", "vehicleJourneys", "ServiceJourney", "passingTimes", "TimetabledPassingTime"); 

// entry point in script
function main(context) {
  const { log, nodeContext } = context;
  const [journeyPatterns, err] = xpath.find(nodeContext, journeyPatternsPath);
  if (err) {
    return [err];
  }

  log.debug(`creating '${journeyPatterns.length}' tasks`);

  // queue worker tasks
  journeyPatterns.forEach(node => context.queue("worker", node));

  // execute worker tasks
  const errors = context.execute();

  if (errors.length === 0) {
    log.info("validation without any errors");
  } else {
    log.info("validation completed with '%d' errors", errors.length);
  }

  return errors;
}

// worker logic done in separate threads
function worker(workerContext) {
  return [
    ...validateStopPointReferences(workerContext),
    ...validatePassingTimes(workerContext),
  ];
}

function validateStopPointReferences(workerContext) {
  const { log, document, nodeContext, importDocument } = workerContext;
  const errors = [];
  const [refNodes, refErr] = xpath.find(nodeContext, stopPointRefPath);
  if (refErr) {
    return [err];
  }

  const [sharedDataDoc] = importDocument("_shared_data");

  setContextNode(nodeContext, document);

  return refNodes.map(n => xpath.value(n))
    .reduce((errors, ref) => {
      const stopPath = xpath.join(scheduledStopPointsPath, `ScheduledStopPoint[@id = '${ref}']`);
      const [n] = xpath.first(sharedDataDoc || nodeContext, stopPath);

      if (!n) {
        errors.push('missing node');
      }

      return errors;
    }, []);
}

function validatePassingTimes(workerContext) {
  const { log, nodeContext, document, importDocument } = workerContext;
  const errors = [];
  const [stopPoints, err] = xpath.find(nodeContext, "./netex:pointsInSequence/netex:StopPointInJourneyPattern/@id");
  if (err) {
    return [err];
  }

  for (let i = 0; i < stopPoints.length; i++) {
    setContextNode(nodeContext, document); // switch to root context (time tabled passing times are located elsewhere)

    const stopPoint = stopPoints[i]
    const id = xpath.value(stopPoint);
    const passingTimesPath = xpath.join(timetablePath, `StopPointInJourneyPatternRef[@ref = '${id}']`);
    const errorMessageBase = `for StopPointInJourneyPattern(@id='${id}')`;
    const [passingTimes, err] = xpath.find(nodeContext, passingTimesPath);
    if (err) {
      errors.push(err);
      continue;
    } else if (passingTimes.length === 0) {
      errors.push(`Expected passing times ${errorMessageBase}`);
      continue;
    }

    for (let n = 0; n < passingTimes.length; n++) {
      const passingTime = passingTimes[n];
      const [timetabledPassingTime, err] = xpath.parent(passingTime);
      if (err) {
        errors.push(err);
        continue;
      }

      setContextNode(nodeContext, timetabledPassingTime); // traverse down the tree

      const [tid] = xpath.findValue(nodeContext, "@id");

      if (i !== stopPoints.length - 1) {
        const departureTime = xpath.findValue(nodeContext, xpath.join(".", "DepartureTime"));
        if (departureTime === "") {
          errors.push(`Expected departure time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`);
        }
      }
      if (i !== 0) {
        const arrivalTime = xpath.findValue(nodeContext, xpath.join(".", "ArrivalTime"));
        if (arrivalTime === "") {
          errors.push(`Expected arrival time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`);
        }
      }
    }
  }

  return errors;
}