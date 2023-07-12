/**
 * @name netexUniqueConstraints
 * @overview
 * @author Concrete IT
 */
const name = "netexUniqueConstraints";
const errors = require("errors");
const types = require("types");

/**
 * Make sure every Line is referenced from another element
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  const xsd = ctx.xsd.parse("netex@1.2").get();

  mapConstraints(xsd, ".//xsd:unique")
    .forEach(v => ctx.worker.queue("uniqueConstraints", ctx.document, v));

  return ctx.worker.run().get();
}

/**
 * @param {types.Node} node
 * @param {string} selector
 */
function mapConstraints(node, selector) {
  return node.find(selector)
    .get()
    .map(n => {
      return {
        name: n.attr("name").get(),
        selector: n.first(".//xsd:selector").get().attr("xpath").get().replace(/netex:/g, ""),
        fields: n.find(".//xsd:field").get().map(n => n.attr("xpath").get()),
      };
    });
}

/**
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function uniqueConstraints(ctx) {
  const res = [];

  ctx.node.find(ctx.params.selector)
    .getOrElse(() => [])
    .reduce((/** @type {Record<string, boolean>} */ o, /** @type {types.Node} */ n) => {
      const k = attrHash(n, ctx.params.fields);
      if (o[k]) {
        res.push(errors.ConsistencyError(
          `Duplicate reference violates unique constraint "${ctx.params.name}" (key: ${k})`,
          { line: n.line() },
        ));
      }
      o[k] = true
      return o
    }, {});

  return res
}

/**
 * @param {types.Node} node
 * @param {string[]} fields
 * @return {string}
 */
function attrHash(node, fields) {
  return fields.map((/** @type {string} */ v) => node.textAt(v).get()).join(";");
}
