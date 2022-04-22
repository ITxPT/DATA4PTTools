// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everySceduledStopPointHasAName
//  Description : Make sure every ScheduledStopPoint has a Name or ShortName
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everySceduledStopPointHasAName";
const description = "Make sure every ScheduledStopPoint has a Name or ShortName";

const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames")
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
