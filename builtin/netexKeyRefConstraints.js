/**
 * @name netexKeyRefConstraints
 * @overview
 * @author Concrete IT
 */
const name = "netexKeyRefConstraints";
const errors = require("errors");
const types = require("types");

/**
 * Make sure every Line is referenced from another element
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  const xsd = ctx.xsd.parse("netex@1.2").get();
  const keys = mapConstraints(xsd, ".//xsd:key");

  mapConstraints(xsd, ".//xsd:keyref")
    .map(n => [keys.find(v => v.name === n.refer), n])
    .forEach(v => ctx.worker.queue("keyRefConstraints", ctx.document, {
      key: v[0],
      ref: v[1],
    }));

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
        refer: n.attr("refer").map(v => v.split(":")[1]).getOrElse(() => ""),
      };
    });
}

/**
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function keyRefConstraints(ctx) {
  const res = [];
  const refs = ctx.node.find(ctx.params.ref.selector).getOrElse(() => []);
  if (refs.length === 0) {
    return res;
  }

  const keyMap = ctx.node.find(ctx.params.key.selector)
    .getOrElse(() => [])
    .reduce((/** @type {Set<string>} */ o, /** @type {types.Node} */ n) => {
      o.add(attrHash(n, ctx.params.key.fields));

      if (ctx.params.key.fields.includes("@version")) {
        const f = [...ctx.params.key.fields];

        f[ctx.params.key.fields.indexOf("@version")] = "_notfound_";

        o.add(attrHash(n, f));
      }
      return o;
    }, new Set());

  refs.forEach((/** @type {types.Node} n */ n) => {
    const k = attrHash(n, ctx.params.ref.fields);

    if (!keyMap.has(k)) {
      res.push(errors.ConsistencyError(
        `In violation of key-ref constraint, missing key reference "${ctx.params.ref.name}" (key: ${k})`,
        { line: n.line() },
      ));
    }
  });

  return res;
}

/**
 * @param {types.Node} node
 * @param {string[]} fields
 * @return {string}
 */
function attrHash(node, fields) {
  return fields.map((/** @type {string} */ v) => {
    return node.attr(v.slice(1).toString()).get();
  })
    .join(";");
}
