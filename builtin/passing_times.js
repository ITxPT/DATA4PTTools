const name = "passing-times"
const description = "Make sure that every StopPointInJourneyPattern contains a arrival and departure time"

// entry point in script
function main(context, stdlib) {
  const { log, nodeContext } = context
  const { nodeList } = stdlib
  const journeyPatterns = nodeList(nodeContext.Find(".//netex:journeyPatterns/*[contains(name(), 'JourneyPattern')]"))

  log.debug(`creating '${journeyPatterns.length}' tasks`)

  // queue worker tasks
  journeyPatterns.forEach(node => context.queue("worker", node))

  // execute worker tasks
  return context.execute()
}

// worker logic done in separate threads
function worker(workerContext, stdlib) {
  const { log, nodeContext, document } = workerContext
  const { nodeList, nodeValue } = stdlib
  const errors = []
  const stopPoints = nodeList(nodeContext.Find(".//netex:pointsInSequence/netex:StopPointInJourneyPattern/@id"))

  for (let i = 0; i < stopPoints.length; i++) {
    nodeContext.SetContextNode(document) // switch to root context (time tabled passing times are located elsewhere)

    const stopPoint = stopPoints[i]
    const id = stopPoint.NodeValue()
    const passingTimesPath = `.//netex:TimetabledPassingTime/netex:StopPointInJourneyPatternRef[@ref = '${id}']`
    const passingTimes = nodeList(nodeContext.Find(passingTimesPath))
    const errorMessageBase = `for StopPointInJourneyPattern(@id='${id}')`

    if (passingTimes.length === 0) {
      errors.push(`Expected passing times ${errorMessageBase}`)
      continue
    }

    for (let n = 0; n < passingTimes.length; n++) {
      const passingTime = passingTimes[n]
      const timetabledPassingTime = passingTime.ParentNode()

      nodeContext.SetContextNode(timetabledPassingTime) // traverse down the tree

      const tid = nodeValue(nodeContext.Find("@id"))

      if (i !== stopPoints.length - 1) {
        const departureTime = nodeValue(nodeContext.Find("./netex:DepartureTime"))
        if (departureTime === "") {
          errors.push(`Expected departure time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`)
        }
      }
      if (i !== 0) {
        const arrivalTime = nodeValue(nodeContext.Find("./netex:ArrivalTime"))
        if (arrivalTime === "") {
          errors.push(`Expected arrival time in TimetabledpassingTime(@id='${tid}') ${errorMessageBase}`)
        }
      }
    }
  }

  return errors
}
