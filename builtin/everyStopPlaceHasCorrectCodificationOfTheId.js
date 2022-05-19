// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyStopPlaceHasCorrectCodificationOfTheId
//  Description : Make sure every StopPlace has a name
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everyStopPlaceHasCorrectCodificationOfTheId";
const description = "Make sure every StopPlace has a correct Id";

const xpath = require("xpath");
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const stopPlacesPath = xpath.join(framesPath, "SiteFrame", "stopPlaces", "StopPlace");

function main(ctx) {
  const errors = [];
  const stopPlaces = ctx.xpath.find(stopPlacesPath);

  stopPlaces.forEach(stopPlace => {
    const id = ctx.xpath.findValue("@id", stopPlace);

    const regex = new RegExp(/^[\S]+:[\S]*:StopPlace:[\S]+:/);

    if (!regex.test(id)) {
      errors.push({
        type: "consistency",
        message: `Invalid name for StopPlace(@id=${id})`,
        line: ctx.xpath.line(stopPlace),
      });
    }
  });

  return errors;
}
