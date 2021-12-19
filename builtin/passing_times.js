const name = "passing-times"

// entry point in script
function main(context, stdlib) {
  const { documentContext, workers, fileName } = context
  const { createContext, log, nodeList } = stdlib
  const journeyPatterns = nodeList(documentContext.Find(".//netex:journeyPatterns/*[contains(name(), 'JourneyPattern')]"))

  log.info(`creating '${journeyPatterns.length}' tasks`)

  // queue worker tasks
  journeyPatterns.forEach(node => workers.queue("worker", createContext(node)))

  // execute worker tasks
  workers.execute()
}

// worker logic done in separate threads
function worker(workerContext, stdlib) {
  const { context, document } = workerContext
  const { log, nodeList, nodeValue } = stdlib
  const errors = []
  const stopPoints = nodeList(context.Find(".//netex:pointsInSequence/netex:StopPointInJourneyPattern/@id"))

  for (let i = 0; i < stopPoints.length; i++) {
    context.SetContextNode(document) // switch to root context (time tabled passing times are located elsewhere)

    const stopPoint = stopPoints[i]
    const id = stopPoint.NodeValue()
    const passingTimesPath = `.//netex:TimetabledPassingTime/netex:StopPointInJourneyPatternRef[@ref = '${id}']`
    const passingTimes = nodeList(context.Find(passingTimesPath))
    const errorMessageBase = `for StopPointInJourneyPattern(@id='${id}')`

    if (passingTimes.length === 0) {
      errors.push(`Expected passing times ${errorMessageBase}`)
      continue
    }

    for (let n = 0; n < passingTimes.length; n++) {
      const passingTime = passingTimes[n]
      const timetabledPassingTime = passingTime.ParentNode()

      context.SetContextNode(timetabledPassingTime) // traverse down the tree

      const tid = nodeValue(context.Find("@id"))

      if (i !== stopPoints.length - 1) {
        const departureTime = nodeValue(context.Find("./netex:DepartureTime"))
        if (departureTime === "") {
          errors.push(`Expected departure time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`)
        }
      }
      if (i !== 0) {
        const arrivalTime = nodeValue(context.Find("./netex:ArrivalTime"))
        if (arrivalTime === "") {
          errors.push(`Expected arrival time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`)
        }
      }
    }
  }

  return errors
}
