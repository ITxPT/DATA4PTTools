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
  const {config} = ctx;

  ctx.log.debug(`validation using schema "${config.schema}"`);

  return ctx.xsd.validate(config.schema).get();
}
