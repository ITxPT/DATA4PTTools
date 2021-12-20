const name = "xsd"
const description = "General XSD schema validation"

function main(context, stdlib) {
  const { log, schema, document } = context

  log.debug("starting xsd validation")

  const [n, errors] = schema.Validate(document)

  log.debug("completed xsd validation with '%d' error(s)", n)

  return errors
}
