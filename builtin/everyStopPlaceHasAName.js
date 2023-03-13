/**
 * @name everyStopPlaceHasAName
 * @overview Make sure every StopPlace has a name
 * @author Concrete IT
 */
const name = "everyStopPlaceHasAName";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const stopPlacesPath = xpath.join(
  xpath.path.FRAMES,
  "SiteFrame",
  "stopPlaces",
  "StopPlace",
);
const namePath = xpath.join("Name");
const shortNamePath = xpath.join("ShortName");

/**
 * Make sure every StopPlace has a name
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  return ctx.node.find(stopPlacesPath)
    .map(v => v.reduce((res, node) => {
      const id = node.attr("id").get();

      if (!id) {
        res.push(errors.ConsistencyError(
          `StopPlace is missing attribute @id`,
          { line: node.line() },
        ));
        return res;
      }

      const name = node.textAt(namePath).get();
      const shortName = node.textAt(shortNamePath).get();

      if (!name && !shortName) {
        res.push(errors.ConsistencyError(
          `Missing name for StopPlace(@id=${id})`,
          { line: node.line() },
        ));
      }

      return res;
    }, []))
    .getOrElse(err => {
      if (err == errors.NODE_NOT_FOUND) {
        return [];
      } else if (err) {
        return [errors.GeneralError(err)];
      }
    });
}
