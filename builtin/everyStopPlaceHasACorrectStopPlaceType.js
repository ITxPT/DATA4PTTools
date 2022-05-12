// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyStopPlaceHasAName
//  Description : Make sure every StopPlace has a stopPlaceType and that
//                it is of correct type.
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everyStopPlaceHasACorrectStopPlaceType";
const description = "Make sure every StopPlace has a name";
const xpath = require("xpath");
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const stopPlacesPath = xpath.join(framesPath, "SiteFrame", "stopPlaces", "StopPlace");
const stopPlaceTypePath = xpath.join("StopPlaceType");
const interestingItems = new Set([
  "onstreetBus",
  "onstreetTram",
  "busStation",
  "airport",
  "railStation",
  "metroStation",
  "coachStation",
  "ferryPort",
  "harbourPort",
  "ferryStop",
  "liftStation",
  "tramStation",
  "vehicleRailInterchange",
  "taxiStand",
  "other",
]);

function main(ctx) {
  const errors = [];
  const stopPlaces = ctx.xpath.find(stopPlacesPath);

  stopPlaces.forEach(stopPlace => {
    const id = ctx.xpath.findValue("@id", stopPlace);
    const type = ctx.xpath.findValue(stopPlaceTypePath, stopPlace);

    if (type == null || type == "") {
      errors.push({
        type: "consistency",
        message: `StopPlaceType is not set for StopPlace(@id=${id})`,
        line: ctx.xpath.line(stopPlace),
      });

      return;
    }

    const isItemInSet = interestingItems.has(type);

    if (!isItemInSet) {
      errors.push({
        type: "consistency",
        message: `StopPlaceType is not valid for StopPlace(@id=${id})`,
        line: ctx.xpath.line(stopPlace),
      });
    }
  });

  return errors;
}
