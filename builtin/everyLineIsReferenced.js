/**
 * @name everyLineIsReferenced
 * @overview Make sure every Line is referenced from another element
 * @author Concrete IT
 */

// Define a constant variable for the script name
const name = "everyLineIsReferenced";
// Import necessary modules
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
// Define the XPath path to access the lines in the service frame
const linesPath = xpath.join(xpath.path.FRAMES, "ServiceFrame", "lines", "Line");

/**
 * Make sure every Line is referenced from another element
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  // Find all Line elements in the specified path
  return ctx.node.find(linesPath)
    // For each Line element, perform validation
    .map(v => v.reduce((res, node) => {
      // Extract the id attribute from the Line element
      const id = node.attr("id").get();

      // Check if the id attribute is missing
      if (!id) {
        res.push(errors.ConsistencyError(
          `Line missing attribute @id`,
          { line: node.line() },
        ));
        return res;
      }

      // Check if there is a reference to the Line element in LineRef elements
      const refExist = ctx.document
        .find(".//LineRef")
        .getOrElse(() => [])
        .find((/** @type {types.Node} n */ n) => n.attr("ref").get() === id);

      // If no reference exists, add a ConsistencyError to the result array
      if (!refExist) {
        res.push(errors.ConsistencyError(
          `Missing reference for Line(@id=${id})`,
          { line: node.line() },
        ));
      }

      // Return the result array
      return res;
    }, []))
    // Handle errors during the find operation
    .getOrElse(err => {
      if (err == errors.NODE_NOT_FOUND) {
        return [];
      // If there is any other error, return a GeneralError in an array
      } else if (err) {
        return [errors.GeneralError(err)];
      }
    });
}
