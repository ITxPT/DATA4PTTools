const name = "xsd"
const description = "General XSD schema validation"

function main(context, lib) {
  const { log, schema, document } = context
  const { validateSchema } = lib
  const [n, errors] = validateSchema(schema, document)

  if (!n) {
    log.info("validation completed without any errors")
  } else {
    log.info("validation completed with '%d' errors", n)
  }

  return errors
}
