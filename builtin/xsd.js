const name = "xsd";
const description = "General XSD schema validation";

function main(context) {
  const { log, schema, document } = context;
  const [n, errors] = xsd.validate(schema, document);

  if (!n) {
    log.info("validation completed without any errors");
  } else {
    log.info("validation completed with '%d' errors", n);
  }

  return errors;
}
