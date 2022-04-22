// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyLineIsReferenced
//  Description : Make sure every Line is referenced from another element
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "everyLineIsReferenced";
const description = "Make sure every Line is referenced from another element";

const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames")
const linesPath = xpath.join(framesPath, "ServiceFrame", "lines", "Line");

function main(ctx) {
  const errors = [];

  const lines = ctx.xpath.find(linesPath);

  lines.forEach(line => {
    const id = ctx.xpath.findValue("@id", line);
    const lineRefsPath = xpath.join("./", `LineRef[@ref='${id}']`);
    const references = ctx.xpath.find(lineRefsPath, ctx.document);

    if (references == null || references.length === 0) {
      errors.push({
        type: "consistency",
        message: `Missing reference for Line(@id=${id})`,
        line: ctx.xpath.line(line),
      });
    }
  });

  return errors;
}
