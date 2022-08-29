/**
 * @name xsd
 * @overview General XSD schema validation
 * @author Concrete IT
 */
const name = "xsd";
const { Context } = require("types");

/**
 * General XSD schema validation
 * @param {Context} ctx
 */
function main(ctx) {
  ctx.log.debug(`validation using schema "${ctx.config.schema}"`);

  const res = ctx.xsd.validate(ctx.config.schema);

  ctx.log.warn(`xsd -> valid: ${res.isErr()}`);

  if (res.isErr()) {
    return [{
      type: "xsd",
      message: `xsd validation failed`, // TODO fix me
    }]
  }

  return [];
}
