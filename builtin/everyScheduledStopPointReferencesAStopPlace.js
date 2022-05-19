// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : everyScheduledStopPointReferencesAStopPlace
//  Description : Make sure every ScheduledStopPoint has a reference to a
//                StopPlace via PassengerStopAssingment
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

// <PassengerStopAssignment id="at:oov:PassengerStopAssignment:at-44-43507-0-1:" version="any" order="11935">
//   <ScheduledStopPointRef ref="at:oov:ScheduledStopPoint:at-44-43507-0-1:" version="any" />
//   <StopPlaceRef ref="at:oov:StopPlace:at-44-43507:" version="any" />
//   <QuayRef ref="at:oov:Quay:at-44-43507-0-1:" version="any" />
// </PassengerStopAssignment> 

const name = "everyScheduledStopPointReferencesAStopPlace";
const description = "Make sure every ScheduledStopPoint has a reference to a StopPlace via PassengerStopAssingment";

const xpath = require("xpath");
const framesPath = xpath.join(".", "PublicationDelivery", "dataObjects", "CompositeFrame", "frames");
const scheduledStopPointsPath = xpath.join(framesPath, "ServiceFrame", "scheduledStopPoints", "ScheduledStopPoint");


function main(ctx) {
  const errors = [];
  const stopPoints = ctx.xpath.find(scheduledStopPointsPath);

  stopPoints.forEach(stopPoint => {
    const id = ctx.xpath.findValue("@id", stopPoint);

    const stopPointRefs = xpath.join("./", `ScheduledStopPointRef[@ref='${id}']/parent::netex:PassengerStopAssignment`);
    const passengerStopAssignments = ctx.xpath.find(stopPointRefs, ctx.document);  

    if (passengerStopAssignments == null || passengerStopAssignments.length == 0) {    
      errors.push({
        type: "consistency",
        message: `ScheduledStopPoint is not associated a PassengerStopAssignment (@id=${id})`,
        line: ctx.xpath.line(stopPoint),
      });
    }    
    passengerStopAssignments.forEach(passengerStopAssignment => {

      const stopPlaceRefPath = xpath.join(".", "StopPlaceRef");
      const stopPlaceRef = ctx.xpath.first(stopPlaceRefPath, passengerStopAssignment); 
      const ref = ctx.xpath.findValue("@ref", stopPlaceRef);     

      const stopPlacePath = xpath.join("./", `StopPlace[@id='${ref}']`);
      const stopPlace = ctx.xpath.first(stopPlacePath, ctx.document);

      if (stopPlace == null) {    
        errors.push({
          type: "consistency",
          message: `ScheduledStopPoint is not associated with a StopPlace via any PassengerStopAssignment (@id=${id})`,
          line: ctx.xpath.line(stopPoint),
        });
      }
    });      
  });

  return errors;
}
