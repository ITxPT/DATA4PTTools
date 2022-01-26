const name = "stop-point-names";
const description = "Make sure every ScheduledStopPoint have a name";
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames")
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints", "ScheduledStopPoint");
const namePath = xpath.join("Name");

function main(ctx) {
  const errors = [];
  const stopPoints = ctx.xpath.find(scheduledStopPointsPath);

  stopPoints.forEach(stopPoint => {
    const id = ctx.xpath.findValue("@id", stopPoint);
    const name = ctx.xpath.findValue(namePath, stopPoint);
    if (!name) {
      errors.push({
        type: "consistency",
        message: `Missing name in ScheduledStopPoint(@id=${id})`,
        line: ctx.xpath.line(stopPoint),
      });
    }
  });

  return errors;
}
