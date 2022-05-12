// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : xsd
//  Description : General XSD schema validation
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "xsd";
const description = "General XSD schema validation";

function main(ctx) {
  ctx.log.debug("running xsd validation");

  const [n, errors] = ctx.xsd.validate();

  return errors
}
