/**
 * @name everyLineIsReferenced
 * @overview Make sure every Line is referenced from another element
 * @author Concrete IT
 */
const name = "everyLineIsReferenced";
const errors = require("errors");
const { Context } = require("types");
const xpath = require("xpath");
const linesPath = xpath.join(xpath.path.FRAMES, "ServiceFrame", "lines", "Line");

/**
 * Make sure every Line is referenced from another element
 * @param {Context} ctx
 */
function main(ctx) {
  return ctx.node.find(linesPath)
    .map(v => v.reduce((res, node) => {
      const id = node.valueAt("@id").get();

      if (!id) {
        res.push({
          type: "consistency",
          message: `Line missing attribute @id`,
          line: node.line(),
        });
        return res;
      }

      const lineRefsPath = xpath.join("./", `LineRef[@ref='${id}']`); // TODO very slow lookup in large files
      const refs = ctx.document.find(lineRefsPath).get();

      if (!refs || !refs.length) {
        res.push({
          type: "consistency",
          message: `Missing reference for Line(@id=${id})`,
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
