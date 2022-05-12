// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : locationsAreReferencingTheSamePoint
//  Description : Make sure every Location in StopPlace and ScheduledStopPoint for the same StopAssignment are pointing to the same koordinates
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "locationsAreReferencingTheSamePoint";
const description = "Make sure StopPlace and ScheduledStopPoint has the same Location";
const xpath = require("xpath");
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames")
const passengerStopAssignmentsPath = xpath.join(framesPath, "ServiceFrame", "stopAssignments", "PassengerStopAssignment");
const scheduledStopPointRefPath = xpath.join("ScheduledStopPointRef/@ref");
const stopPlaceRefPath = xpath.join("StopPlaceRef/@ref");
const spLongitudePath = xpath.join("Centroid", "Location", "Longitude");
const spLatitudePath = xpath.join("Centroid", "Location", "Latitude");
const sspLongitudePath = xpath.join("Location", "Longitude");
const sspLatitudePath = xpath.join("Location", "Latitude");

function main(ctx) {
  const errors = [];
  const stopAssignments = ctx.xpath.find(passengerStopAssignmentsPath);

  stopAssignments.forEach(stopAssignment => {
    const id = ctx.xpath.findValue("@id", stopAssignment);
    const scheduledStopPointId = ctx.xpath.findValue(scheduledStopPointRefPath, stopAssignment);
    const stopPlaceId = ctx.xpath.findValue(stopPlaceRefPath, stopAssignment);
    const scheduledStopPointPath = xpath.join("./", `ScheduledStopPoint[@id='${scheduledStopPointId}']`);
    const scheduledStopPoint = ctx.xpath.first(scheduledStopPointPath, ctx.document);
    const stopPlacePath = xpath.join("./", `StopPlace[@id='${stopPlaceId}']`);
    const stopPlace = ctx.xpath.first(stopPlacePath, ctx.document);

    if (scheduledStopPoint == null || stopPlace == null) {
      errors.push({
        type: "consistency",
        message: `Missing StopPlace or ScheduledStopPoint (PassengerStopAssignment @id=${id})`,
        line: ctx.xpath.line(stopAssignment),
      });

      return;
    }

    const spLong = ctx.xpath.findValue(spLongitudePath, stopPlace);
    const spLat = ctx.xpath.findValue(spLatitudePath, stopPlace);
    const sspLong = ctx.xpath.findValue(sspLongitudePath, scheduledStopPoint);
    const sspLat = ctx.xpath.findValue(sspLatitudePath, scheduledStopPoint);
    const distance = Math.round(getDistanceFromLatLonInKm(spLat, spLong, sspLat, sspLong) * 1000);

    if (distance > 100) {
      errors.push({
        type: "consistency",
        message: `ScheduledStopPoint and StopPlace is too far apart (PassengerStopAssignment @id=${id})`,
        line: ctx.xpath.line(stopAssignment),
      });
    }
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
