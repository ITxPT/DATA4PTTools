const name = "stop-point-names";
const description = "Make sure every ScheduledStopPoint have a name";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames")
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints", "ScheduledStopPoint");

function main(context) {
  const { log, nodeContext } = context;
  const errors = [];
  const stopPoints = xpath.find(nodeContext, scheduledStopPointsPath);

  stopPoints.forEach(stopPoint => {
    const id = xpath.findValue(nodeContext, "@id", stopPoint);
    const name = xpath.findValue(nodeContext, xpath.join("Name"), stopPoint);
    if (!name) {
      errors.push(`Missing name in ScheduledStopPoint(@id=${id})`);
    }
  });

  return errors;
}
