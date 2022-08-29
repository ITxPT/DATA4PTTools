/**
 * @name everyStopPlaceHasACorrectStopPlaceType
 * @overview Make sure every StopPlace has a stopPlaceType and that it is of correct type.
 * @author Concrete IT
 */
const name = "everyStopPlaceHasACorrectStopPlaceType";
const { Context } = require("types");
const xpath = require("xpath");
const stopPlacesPath = xpath.join(
  xpath.path.FRAMES,
  "SiteFrame",
  "stopPlaces",
  "StopPlace",
);
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

/**
 * Make sure every StopPlace has a stopPlaceType and that it is of correct type.
 * @param {Context} ctx
 */
function main(ctx) {
  return ctx.node.find(stopPlacesPath)
    .map(v => v.reduce((res, node) => {
      const id = node.valueAt("@id").get();
      const stopType = node.valueAt(stopPlaceTypePath).get();

      if (!stopType) {
        res.push({
          type: "consistency",
          message: `StopPlaceType is not set for StopPlace(@id=${id})`,
          line: node.line(),
        });
        return res;
      }

      const isItemInSet = interestingItems.has(stopType);

      if (!isItemInSet) {
        res.push({
          type: "consistency",
          message: `StopPlaceType is not valid for StopPlace(@id=${id})`,
          line: node.line(),
        });
      }

      return res;
    }, []))
    .getOrElse(() => []);
}
