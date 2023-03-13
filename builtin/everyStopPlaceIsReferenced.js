/**
 * @name everyStopPlaceIsReferenced
 * @overview Make sure every StopPlace is referenced from another element
 * @author Concrete IT
 */
const name = "everyStopPlaceIsReferenced";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const stopPlacesPath = xpath.join(xpath.path.FRAMES, "SiteFrame", "stopPlaces", "StopPlace");

/**
 * Make sure every StopPlace is referenced from another element
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  ctx.node.find(stopPlacesPath)
    .getOrElse(() => [])
    .forEach((n) => ctx.worker.queue("worker", n));

  return ctx.worker.run().get();
}

function worker(ctx) {
  const res = [];
  const id = ctx.node.attr("id").get();

  if (!id) {
    res.push(errors.ConsistencyError(
      `StopPlace is missing attribute @id`,
      { line: ctx.node.line() },
    ));
    return res;
  }

  const stopPlaceRefs = xpath.join("./", `StopPlaceRef[@ref='${id}']`);
  const refs = ctx.document.find(stopPlaceRefs).get();

  if (!refs || refs.length === 0) {
    res.push(errors.ConsistencyError(
      `Missing reference for StopPlace(@id=${id})`,
      { line: ctx.node.line() },
    ));
  }

  return res;
}
