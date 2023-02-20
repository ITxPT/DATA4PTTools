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
const scheduledStopPointRefPath = xpath.join("ScheduledStopPointRef/@ref");
const stopPlaceRefPath = xpath.join("StopPlaceRef/@ref");
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
  const config = { distance: 100, ...ctx.config };

  return ctx.node.find(passengerStopAssignmentsPath)
    .map(v => v.reduce((res, node) => {
      const id = node.attr("id").get();
      const scheduledStopPoint = node.first(scheduledStopPointRefPath)
        .map(n => xpath.join(
          scheduledStopPointsPath,
          `ScheduledStopPoint[@id='${n.text()}']`,
        ))
        .map(p => ctx.document.first(p).get())
        .get();
      const stopPlace = node.first(stopPlaceRefPath)
        .map(n => xpath.join(
          stopPlacesPath,
          `StopPlace[@id='${n.text()}']`),
        )
        .map(p => ctx.document.first(p).get())
        .get();

      if (!scheduledStopPoint) {
        res.push(errors.ConsistencyError(
          `Missing ScheduledStopPoint (PassengerStopAssignment @id=${id})`,
          { line: node.line() },
        ));
      }
      if (!stopPlace) {
        res.push(errors.ConsistencyError(
          `Missing StopPoint (PassengerStopAssignment @id=${id})`,
          { line: node.line() },
        ));
      }
      if (!scheduledStopPoint || !stopPlace) {
        return res;
      }

      const distance = getDistance(stopPlace, scheduledStopPoint); // argument order is important!
      if (distance > config.distance) {
        res.push(errors.ConsistencyError(
          `ScheduledStopPoint and StopPlace is too far apart (PassengerStopAssignment @id=${id})`,
          { line: node.line() },
        ));
      }

      return res;
    }, []))
    .getOrElse(err => {
      if (err == errors.NODE_NOT_FOUND) {
        return [];
      } else if (err) {
        return [errors.GeneralError(err)];
      }
    });
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
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  const R = 6371; // radius of the earth in km
  const dLat = deg2rad(lat2-lat1); // deg2rad below
  const dLon = deg2rad(lon2-lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // distance in km

  return d;
}

/**
 * @param {number} deg
 * @returns {number}
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}
