const name = "stop-point-names";
const description = "Make sure every ScheduledStopPoint have a name";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames")
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints", "ScheduledStopPoint");

function main(context) {
  const { log, nodeContext } = context;
  const errors = [];
  const [stopPoints] = xpath.find(nodeContext, scheduledStopPointsPath);

  stopPoints.forEach(stopPoint => {
    setContextNode(nodeContext, stopPoint);

    const [id] = xpath.findValue(nodeContext, "@id");
    const [name] = xpath.findValue(nodeContext, xpath.join("Name"));
    if (!name) {
      errors.push(`Missing name in ScheduledStopPoint(@id=${id})`);
    }
  });

  return errors;
}
