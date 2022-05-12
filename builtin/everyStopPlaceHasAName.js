// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyStopPlaceHasAName
//  Description : Make sure every StopPlace has a name
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everyStopPlaceHasAName";
const description = "Make sure every StopPlace has a name";
const xpath = require("xpath");
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const stopPlacesPath = xpath.join(framesPath, "SiteFrame", "stopPlaces", "StopPlace");
const namePath = xpath.join("Name");
const shortNamePath = xpath.join("ShortName");

function main(ctx) {
  const errors = [];
  const stopPlaces = ctx.xpath.find(stopPlacesPath);

  ctx.log.debug(`${stopPlaces.length} stopPlaces`);

  stopPlaces.forEach(stopPlace => {
    const id = ctx.xpath.findValue("@id", stopPlace);
    const name = ctx.xpath.findValue(namePath, stopPlace);
    const shortName = ctx.xpath.findValue(shortNamePath, stopPlace);

    if (!name && !shortName) {
      errors.push({
        type: "consistency",
        message: `Missing name for StopPlace(@id=${id})`,
        line: ctx.xpath.line(stopPlace),
      });
    }
  });

  return errors;
}
