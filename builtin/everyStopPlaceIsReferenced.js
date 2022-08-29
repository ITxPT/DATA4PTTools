/**
 * @name everyStopPlaceIsReferenced
 * @overview Make sure every StopPlace is referenced from another element
 * @author Concrete IT
 */
const name = "everyStopPlaceIsReferenced";
const errors = require("errors");
const { Context } = require("types");
const xpath = require("xpath");
const stopPlacesPath = xpath.join(xpath.path.FRAMES, "SiteFrame", "stopPlaces", "StopPlace");

/**
 * Make sure every StopPlace is referenced from another element
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

      const stopPlaceRefs = xpath.join("./", `StopPlaceRef[@ref='${id}']`);
      const refs = ctx.document.find(stopPlaceRefs).get();

      if (!refs || refs.length === 0) {
        res.push({
          type: "consistency",
          message: `Missing reference for StopPlace(@id=${id})`,
          line: node.line(),
        });
      }
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
