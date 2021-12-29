const name = "passing-times"
const description = `Make sure that every StopPointInJourneyPattern contains a arrival and departure time`

// entry point in script
function main(context, lib) {
  const { log, nodeContext } = context
  const { findNodes } = lib
  const [journeyPatterns, err] = findNodes(nodeContext, ".//netex:journeyPatterns/*[contains(name(), 'JourneyPattern')]")
  if (err) {
    return [err]
  }

  log.debug(`creating '${journeyPatterns.length}' tasks`)

  // queue worker tasks
  journeyPatterns.forEach(node => context.queue("worker", node))

  // execute worker tasks
  const errors = context.execute()

  if (errors.length === 0) {
    log.info("validation without any errors")
  } else {
    log.info("validation completed with '%d' errors", errors.length)
  }

  return errors
}

// worker logic done in separate threads
function worker(workerContext, lib) {
  const { log, nodeContext, document } = workerContext
  const { findNodes, findValue, nodeValue, parentNode, setContextNode } = lib
  const errors = []
  const [stopPoints, err] = findNodes(nodeContext, ".//netex:pointsInSequence/netex:StopPointInJourneyPattern/@id")
  if (err) {
    return [err]
  }

  for (let i = 0; i < stopPoints.length; i++) {
    setContextNode(nodeContext, document) // switch to root context (time tabled passing times are located elsewhere)

    const stopPoint = stopPoints[i]
    const id = nodeValue(stopPoint)
    const passingTimesPath = `.//netex:TimetabledPassingTime/netex:StopPointInJourneyPatternRef[@ref = '${id}']`
    const errorMessageBase = `for StopPointInJourneyPattern(@id='${id}')`
    const [passingTimes, err] = findNodes(nodeContext, passingTimesPath)
    if (err) {
      errors.push(err)
      continue
    } else if (passingTimes.length === 0) {
      errors.push(`Expected passing times ${errorMessageBase}`)
      continue
    }

    for (let n = 0; n < passingTimes.length; n++) {
      const passingTime = passingTimes[n]
      const [timetabledPassingTime, err] = parentNode(passingTime)
      if (err) {
        errors.push(err)
        continue
      }

      setContextNode(nodeContext, timetabledPassingTime) // traverse down the tree

      const tid = findValue(nodeContext, "@id")

      if (i !== stopPoints.length - 1) {
        const departureTime = findValue(nodeContext, "./netex:DepartureTime")
        if (departureTime === "") {
          errors.push(`Expected departure time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`)
        }
      }
      if (i !== 0) {
        const arrivalTime = findValue(nodeContext, "./netex:ArrivalTime")
        if (arrivalTime === "") {
          errors.push(`Expected arrival time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`)
        }
      }
    }
  }

  return errors
}
