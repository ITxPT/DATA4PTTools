// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : stopPlaceQuayDistanceIsReasonable
//  Description : Check the distance between a StopPlace and its Quays
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "stopPlaceQuayDistanceIsReasonable";
const description = "Validate the distance between a StopPlace and its Quays";
const xpath = require("xpath");
const frameDefaultsPath = xpath.join("./", "FrameDefaults");
const defaultLocationSystemPath = xpath.join(".", "DefaultLocationSystem");
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const stopPlacesPath = xpath.join(framesPath, "SiteFrame", "stopPlaces", "StopPlace");
const quayPath = xpath.join("quays", "Quay");
const longitudePath = xpath.join("Centroid", "Location", "Longitude");
const latitudePath = xpath.join("Centroid", "Location", "Latitude");

function main(ctx) {
  const errors = [];
  const frameDefaults = ctx.xpath.first(frameDefaultsPath); // Find the LocationSystem and verify that it is WGS84 / 4326
  if (!frameDefaults) {
    return [{
      type: "not_found",
      message: "Document is missing element FrameDefaults",
    }];
  }

  const defaultLocationSystem = ctx.xpath.findValue(defaultLocationSystemPath, frameDefaults);

  ctx.log.debug("defaultLocationSystem : " + defaultLocationSystem);

  if (!defaultLocationSystem.includes("4326")) {
    return [{
      type: "error",
      message: "Document coordinates is not in WGS84/EPSG:4326",
    }];
  }

  // Find all stopPlaces and check the distance to the quays
  const stopPlaces = ctx.xpath.find(stopPlacesPath);

  stopPlaces.forEach(stopPlace => {
    const id = ctx.xpath.findValue("@id", stopPlace);
    const long = ctx.xpath.findValue(longitudePath, stopPlace);
    const lat = ctx.xpath.findValue(latitudePath, stopPlace);

    const quays = ctx.xpath.find(quayPath, stopPlace);

    quays.forEach(quay => {
    const idQuay = ctx.xpath.findValue("@id", quay);
    const longQuay = ctx.xpath.findValue(longitudePath, quay);
      const latQuay = ctx.xpath.findValue(latitudePath, quay);

      const distance = Math.round(getDistanceFromLatLonInKm(lat, long, latQuay, longQuay) * 1000);
      //ctx.log.debug("Quay Distance : " + distance);

      if (distance > 500) {
        errors.push({
          type: "quality",
          message: `Distance between StopPlace and Quay greater than 500m (stopPlace @id=${id}, Quay @id=${idQuay}, distance=${distance}m)`,
          line: ctx.xpath.line(stopPlace),
        });
      }

    });
  });

  return errors;
}

// calculate the distance between two points
// https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
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

function deg2rad(deg) {
  return deg * (Math.PI/180);
}
