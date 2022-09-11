/**
 * @name xsd
 * @overview General XSD schema validation
 * @author Concrete IT
 */
const name = "xsd";
const errors = require("errors");
const types = require("types");

/**
 * General XSD schema validation
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  ctx.log.debug(`validation using schema "${ctx.config.schema}"`);

  // TODO hydrate validation errors (line no, beautify message etc)
  return ctx.xsd.validate(ctx.config.schema).get()
}
