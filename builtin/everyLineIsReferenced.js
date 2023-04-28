/**
 * @name everyLineIsReferenced
 * @overview Make sure every Line is referenced from another element
 * @author Concrete IT
 */
const name = "everyLineIsReferenced";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const linesPath = xpath.join(xpath.path.FRAMES, "ServiceFrame", "lines", "Line");

/**
 * Make sure every Line is referenced from another element
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  return ctx.node.find(linesPath)
    .map(v => v.reduce((res, node) => {
      const id = node.attr("id").get();

      if (!id) {
        res.push(errors.ConsistencyError(
          `Line missing attribute @id`,
          { line: node.line() },
        ));
        return res;
      }

      const refExist = ctx.document
        .find(".//LineRef")
        .getOrElse(() => [])
        .find((/** @type {types.Node} n */ n) => n.attr("ref").get() === id);

      if (!refExist) {
        res.push(errors.ConsistencyError(
          `Missing reference for Line(@id=${id})`,
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
