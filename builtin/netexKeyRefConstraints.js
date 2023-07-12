/**
 * @name netexKeyRefConstraints
 * @overview
 * @author Concrete IT
 */
const name = "netexKeyRefConstraints";
const errors = require("errors");
const types = require("types");

/**
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
    .map(n => ({
      name: n.attr("name").get(),
      selector: n.first(".//xsd:selector").get().attr("xpath").get().replace(/netex:/g, ""),
      fields: n.find(".//xsd:field").get().map(n => n.attr("xpath").get()),
      refer: n.attr("refer").map(v => v.split(":")[1]).getOrElse(() => ""),
    }));
}

/**
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function keyRefConstraints(ctx) {
  const ref = ctx.params.ref;
  const refs = ctx.node.find(ref.selector)
    .getOrElse(() => [])
    .reduce((
      /** @type {{ matrix: string[][], key: string, name: string, descriptor: string, line: number }[]} */ o,
      /** @type {types.Node} */ n
    ) => {
      if (n.attr("versionRef").get() != null) {
        return o;
      }

      const mx = fieldMatrix(n, ref.fields);
      const fields = mx.map(v => v[1]);
      const descriptor = mx.reduce((
        /** @type {string[]} */ o,
        /** @type {string[]} */ v,
      ) => {
        if (v[1] !== null) {
          o.push(`${v[0]}="${v[1]}"`);
        }
        return o;
      }, [])
        .join(", ");

      if (fields.length) {
        o.push({
          matrix: mx,
          key: fields.join(";"),
          name: ref.name,
          descriptor,
          line: n.line(),
        });
      }

      return o;
    }, []);
  if (!refs.length) {
    return [];
  }

  const keyMap = ctx.node.find(ctx.params.key.selector)
    .getOrElse(() => [])
    .reduce((
      /** @type {Map<string, boolean>} */ o,
      /** @type {types.Node} */ n
    ) => {
      const mx = fieldMatrix(n, ctx.params.key.fields);
      const fields = mx.map(v => v[1]);

      o.set(fields.join(";"), true);

      for (let i = 0; i < fields.length; i++) {
        const f = [...fields];
        f[i] = null;
        o.set(f.join(";"), true);
      }

      return o;
    }, new Map());

  const res = refs.reduce((
    /** @type {errors.ScriptError[]} */ res,
    /** @type {{ matrix: string[][], key: string, name: string, descriptor: string, line: number }} */ ref,
  ) => {
    const { key, name, descriptor, line } = ref;

    if (!keyMap.has(key)) {
      res.push(errors.ConsistencyError(
        `In violation of key-ref constraint, missing key reference "${name}" (${descriptor})`,
        { line },
      ));
    }
    return res;
  }, []);

  return res;
}

/**
 * @param {types.Node} node
 * @param {string[]} fields
 * @return {string[]}
 */
function fieldValues(node, fields) {
  return fields.map((/** @type {string} */ v) => {
    if (v[0] === "@") {
      return node.attr(v.slice(1).toString()).get();
    } else {
      return node.textAt(v).get();
    }
  });
}

/**
 * @param {types.Node} node
 * @param {string[]} fields
 * @return {string[][]}
 */
function fieldMatrix(node, fields) {
  return fields.map((/** @type {string} */ v) => [v, node.textAt(v).get()]);
}