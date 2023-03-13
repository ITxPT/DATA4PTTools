/**
 * @name everyStopPlaceHasACorrectStopPlaceType
 * @overview Make sure every StopPlace has a stopPlaceType and that it is of correct type.
 * @author Concrete IT
 */
const name = "everyStopPlaceHasACorrectStopPlaceType";
const errors = require("errors");
const types = require("types");
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
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  return ctx.node.find(stopPlacesPath)
    .map(v => v.reduce((res, node) => {
      const id = node.attr("id").get();
      const stopType = node.textAt(stopPlaceTypePath).get();

      if (!stopType) {
        res.push(errors.ConsistencyError(
          `StopPlaceType is not set for StopPlace(@id=${id})`,
          { line: node.line() },
        ));
        return res;
      }

      const isItemInSet = interestingItems.has(stopType);

      if (!isItemInSet) {
        res.push(errors.ConsistencyError(
          `StopPlaceType is not valid for StopPlace(@id=${id})`,
          { line: node.line() },
        ));
      }

      return res;
    }, []))
    .getOrElse(() => []);
}
