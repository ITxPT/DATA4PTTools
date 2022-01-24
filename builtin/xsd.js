const name = "xsd";
const description = "General XSD schema validation";

function main(ctx) {
  ctx.log.debug("running validation");

  const [n, errors] = ctx.xsd.validate();

  return errors;
}
