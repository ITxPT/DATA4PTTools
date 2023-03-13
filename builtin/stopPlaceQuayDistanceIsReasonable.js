/**
 * @name stopPlaceQuayDistanceIsReasonable
 * @overview Check the distance between a StopPlace and its Quays
 * @author Concrete IT
 */
const name = "stopPlaceQuayDistanceIsReasonable";
const errors = require("errors");
const types = require("types");
const xpath = require("xpath");
const defaultLocationSystemPath = xpath.join(".", "DefaultLocationSystem");
const framesPath = xpath.join(
  ".",
  "PublicationDelivery",
  "dataObjects",
  "CompositeFrame",
  "frames",
);
const stopPlacesPath = xpath.join(framesPath, "SiteFrame", "stopPlaces", "StopPlace");
const quayPath = xpath.join("quays", "Quay");
const longitudePath = xpath.join("Centroid", "Location", "Longitude");
const latitudePath = xpath.join("Centroid", "Location", "Latitude");

/**
 * Check the distance between a StopPlace and its Quays
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  const config = { distance: 500, ...ctx.config };
  const res = [];
  const frameDefaults = ctx.document.first(xpath.path.FRAME_DEFAULTS).get(); // Find the LocationSystem and verify that it is WGS84 / 4326

  if (!frameDefaults) {
    return [errors.NotFoundError("Document is missing element <FrameDefaults />")];
  }

  const defaultLocationSystem = frameDefaults.textAt(defaultLocationSystemPath).get();

  ctx.log.debug(`defaultLocationSystem: ${defaultLocationSystem}`);
  ctx.log.debug(`configured max distance: ${config.distance}`);

  if (!defaultLocationSystem) {
    return [errors.GeneralError("Element <FrameDefaults /> is missing child <DefaultLocationSystem />")];
  } else if (!(defaultLocationSystem.includes("4326") || defaultLocationSystem.includes("WGS84"))) {
    return [errors.GeneralError("Document coordinates is not in WGS84/EPSG:4326")];
  }

  // Find all stopPlaces and check the distance to the quays
  ctx.node.find(stopPlacesPath)
    .getOrElse(() => [])
    .forEach(node => {
      const id = node.attr("id").get();
      const long = parseFloat(node.textAt(longitudePath).get());
      const lat = parseFloat(node.textAt(latitudePath).get());

      node.find(quayPath)
        .getOrElse(() => [])
        .forEach(quay => {
          const idQuay = quay.attr("id").get();
          const longQuay = parseFloat(quay.textAt(longitudePath).get());
          const latQuay = parseFloat(quay.textAt(latitudePath).get());
          const d = getDistanceFromLatLonInKm(lat, long, latQuay, longQuay);
          const distance = Math.round(d * 1000);

          if (distance > config.distance) {
            res.push(errors.QualityError(
              `Distance between StopPlace and Quay greater than 500m (stopPlace @id=${id}, Quay @id=${idQuay}, distance=${distance}m)`,
              { line: node.line() },
            ))
          }
        });
    });

  return res;
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
  const dLat = deg2rad(lat2-lat1); // deg2rad below
  const dLon = deg2rad(lon2-lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // distance in km
}

/**
 * @param {number} deg
 * @returns {number}
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}
