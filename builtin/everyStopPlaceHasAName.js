/**
 * @name everyStopPlaceHasAName
 * @overview Make sure every StopPlace has a name
 * @author Concrete IT
 */
const name = "everyStopPlaceHasAName";
const errors = require("errors");
const { Context } = require("types");
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
 * @param {Context} ctx
 */
function main(ctx) {
  return ctx.node.find(stopPlacesPath)
    .map(v => v.reduce((res, node) => {
      const id = node.valueAt("@id").get();

      if (!id) {
        res.push({
          type: "consistency",
          message: `StopPlace is missing attribute @id`,
          line: node.line(),
        });
        return res;
      }

      const name = node.valueAt(namePath).get();
      const shortName = node.valueAt(shortNamePath).get();

      if (!name && !shortName) {
        res.push({
          type: "consistency",
          message: `Missing name for StopPlace(@id=${id})`,
          line: node.line(),
        });
      }

      return res;
    }, []))
    .getOrElse(err => {
      if (err == errors.NODE_NOT_FOUND) {
        return [];
      } else if (err) {
        return [{
          type: "internal",
          message: err,
          line: 0,
        }];
      }
    });
}
