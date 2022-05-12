// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyScheduledStopPointHasAName
//  Description : Make sure every ScheduledStopPoint has a Name or ShortName
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everyScheduledStopPointHasAName";
const description = `Make sure every ScheduledStopPoint has a Name or ShortName

The test goes through all the ScheduledStopPoints in the ServiceFrame and checks that either a Name or a ShortName is specified.
If none of the names are specified, the validation will mark the StopPoint as incorrect.`;
const xpath = require("xpath");
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints", "ScheduledStopPoint");
const namePath = xpath.join("Name");
const shortNamePath = xpath.join("ShortName");

function main(ctx) {
  const errors = [];
  const stopPoints = ctx.xpath.find(scheduledStopPointsPath);

  stopPoints.forEach(stopPoint => {
    const id = ctx.xpath.findValue("@id", stopPoint);
    const name = ctx.xpath.findValue(namePath, stopPoint);
    const shortName = ctx.xpath.findValue(shortNamePath, stopPoint);

    if (!name && !shortName) {
      errors.push({
        type: "consistency",
        message: `Missing name for ScheduledStopPoint(@id=${id})`,
        line: ctx.xpath.line(stopPoint),
      });
    }
  });

  return errors;
}
