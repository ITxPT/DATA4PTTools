/**
 * @name locationsAreReferencingTheSamePoint
 * @overview Make sure every Location in StopPlace and ScheduledStopPoint for the same StopAssignment are pointing to the same coordinates
 * @author Concrete IT
 */
const name = "locationsAreReferencingTheSamePoint";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const passengerStopAssignmentsPath = xpath.join(
  xpath.path.FRAMES,
  "ServiceFrame",
  "stopAssignments",
  "PassengerStopAssignment",
);
const stopPlacesPath = xpath.join(
  xpath.path.FRAMES,
  "SiteFrame",
  "stopPlaces",
);
const scheduledStopPointsPath = xpath.join(
  xpath.path.FRAMES,
  "ServiceFrame",
  "scheduledStopPoints",
);
const scheduledStopPointRefPath = xpath.join("ScheduledStopPointRef");
const stopPlaceRefPath = xpath.join("StopPlaceRef");
const spLongitudePath = xpath.join("Centroid", "Location", "Longitude");
const spLatitudePath = xpath.join("Centroid", "Location", "Latitude");
const sspLongitudePath = xpath.join("Location", "Longitude");
const sspLatitudePath = xpath.join("Location", "Latitude");

/**
 * Make sure every Location in StopPlace and ScheduledStopPoint for the same
 * StopAssignment are pointing to the same coordinates
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  ctx.node.find(passengerStopAssignmentsPath)
    .getOrElse(() => [])
    .forEach(n => ctx.worker.queue("worker", n));

  return ctx.worker.run().get();
}

function worker(ctx) {
  const { node } = ctx;
  const config = { distance: 100, ...ctx.config };
  const id = node.attr("id").get();
  const scheduledStopPoint = node.first(scheduledStopPointRefPath)
    .map(n => n.attr("ref").get())
    .map(n => xpath.join(scheduledStopPointsPath, `ScheduledStopPoint[@id='${n}']`))
    .map(p => ctx.document.first(p).get())
    .get();

  if (!scheduledStopPoint) {
    return [errors.ConsistencyError(
      `Missing ScheduledStopPoint (PassengerStopAssignment @id=${id})`,
      { line: node.line() },
    )];
  }

  const stopPlace = node.first(stopPlaceRefPath)
    .map(n => n.attr("ref").get())
    .map(n => xpath.join(stopPlacesPath, `StopPlace[@id='${n}']`))
    .map(p => ctx.document.first(p).get())
    .get();

  if (!stopPlace) {
    return [errors.ConsistencyError(
      `Missing StopPoint (PassengerStopAssignment @id=${id})`,
      { line: node.line() },
    )];
  }

  const distance = getDistance(stopPlace, scheduledStopPoint); // argument order is important!
  if (distance > config.distance) {
    return [errors.ConsistencyError(
      `ScheduledStopPoint and StopPlace is too far apart (PassengerStopAssignment @id=${id})`,
      { line: node.line() },
    )];
  }

  return [];
}

/**
 * Calculate the distance between two nodes
 * @param {types.Node} n1
 * @param {types.Node} n2
 * @returns {number}
 */
function getDistance(n1, n2) {
  const lonx = parseFloat(n1.textAt(spLongitudePath).get());
  const latx = parseFloat(n1.textAt(spLatitudePath).get());
  const lony = parseFloat(n2.textAt(sspLongitudePath).get());
  const laty = parseFloat(n2.textAt(sspLatitudePath).get());
  const d = getDistanceFromLatLonInKm(lonx, latx, lony, laty);

  return Math.round(d * 1000);
}

/**
 * Calculate the distance between two points
 * https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number}
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // distance in km

  return d;
}

/**
 * @param {number} deg
 * @returns {number}
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
