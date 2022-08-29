/**
 * @name everyScheduledStopPointHasAName
 * @overview Make sure every ScheduledStopPoint has a Name or ShortName
 * @author Concrete IT
 */
const name = "everyScheduledStopPointHasAName";
const errors = require("errors");
const { Context } = require("types");
const xpath = require("xpath");
const scheduledStopPointsPath = xpath.join(
  xpath.path.FRAMES,
  "ServiceFrame",
  "scheduledStopPoints",
  "ScheduledStopPoint",
);
const shortNamePath = xpath.join("ShortName");

/**
 * Make sure every ScheduledStopPoint has a Name or ShortName
 *
 * The test goes through all the ScheduledStopPoints in the ServiceFrame and
 * checks that either a Name or a ShortName is specified. If none of the names
 * are specified, the validation will mark the StopPoint as incorrect.
 * @param {Context} ctx
 */
function main(ctx) {
  const res = [];

  return ctx.node.find(scheduledStopPointsPath)
    .map(v => {
      v.forEach((node) => {
        const id = node.valueAt("@id").get();

        if (!id) {
          res.push({
            type: "consistency",
            message: `StopPoint is missing attribute @id`,
            line: node.line(),
          });
          return;
        }

        const name = node.valueAt(xpath.join("Name")).get();
        const shortName = node.valueAt(xpath.join("ShortName")).get();

        if (!name && !shortName) {
          res.push({
            type: "consistency",
            message: `Missing name for ScheduledStopPoint(@id=${id})`,
            line: node.line(),
          });
        }
      });
    })
    .getOrElse(err => {
      if (err == errors.NODE_NOT_FOUND) {
        return [];
      } else if (err) {
        return [{
          type: "internal",
          message: err,
          line: 0,
        }];
      }
    });
}
