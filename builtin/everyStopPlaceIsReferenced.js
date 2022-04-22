// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyStopPlaceIsReferenced
//  Description : Make sure every StopPlace is referenced from another element
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everyStopPlaceIsReferenced";
const description = "Make sure every StopPlace is referenced from another element";

const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames")
const stopPlacesPath = xpath.join(framesPath, "SiteFrame", "stopPlaces", "StopPlace");

function main(ctx) {
  const errors = [];

  const stopPlaces = ctx.xpath.find(stopPlacesPath);

  stopPlaces.forEach(stopPlace => {
    const id = ctx.xpath.findValue("@id", stopPlace);
    const stopPlaceRefs = xpath.join("./", `StopPlaceRef[@ref='${id}']`);
    const references = ctx.xpath.find(stopPlaceRefs, ctx.document);

    if (references == null || references.length === 0) {
      errors.push({
        type: "consistency",
        message: `Missing reference for StopPlace(@id=${id})`,
        line: ctx.xpath.line(stopPlace),
      });
    }
  });

  return errors;
}
