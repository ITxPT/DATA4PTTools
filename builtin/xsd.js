const name = "xsd";
const description = "General XSD schema validation";

function main(ctx) {
  const [n, errors] = ctx.xsd.validate();

  if (!n) {
    ctx.log.info("validation completed without any errors");
  } else {
    ctx.log.info("validation completed with '%d' errors", n);
  }

  return errors;
}
