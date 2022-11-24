import { Leg, Product } from "./hafas-client";

export const getTrwlLink = (leg: Leg): string => {
    const base_url = "https://traewelling.de/trains/trip?";

    const args = {
        tripID: leg.tripId,
        lineName: leg.line.name,
        start: leg.origin.id,
        departure: leg.departure
    }

    return `\n\nTräwelling-Check In: ` + base_url + new URLSearchParams(args).toString()
}

export const getBahnExpertLink = (leg: Leg): string => {
    // bahn.expert only offers details for a subset of transport services
    if ((["national", "nationalExpress", "regional", "regionalExp", "suburban"] as Product[]).includes(leg.line.product) === false) {
        return "";
    }

    const base_url = "https://bahn.expert/api/hafas/v1/detailsRedirect/";

    return `\n\nbahn.expert-Link: ` + base_url + encodeURIComponent(leg.tripId);
}

export const getTravelynxLink = (leg: Leg): string => {
    const base_url = "https://travelynx.de/s/";

    return `\n\nTravelynx-Link: ${base_url}${leg.origin.id}?train=` + encodeURIComponent(`${leg.line.productName} ${leg.line.fahrtNr}`);
}