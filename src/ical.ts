import { Journey, Leg, Product } from "./hafas-client"
import { dateWithDelay, toShortDate } from "./date-utils"
import ical, { ICalCalendar } from 'ical-generator';
import { getVtimezoneComponent } from "@touch4it/ical-timezones";

export type Event = {
    summary: string;
    description: string;
    location: string;

    start: Date;
    end: Date;
}

const getEmoji = (leg: Leg): string => {
    switch (leg.line?.product) {
        case 'bus':
            return "🚌"
        case 'national':
            return "🚄"
        case 'nationalExpress':
            return "🚅"
        case 'subway':
            return "🚇"
        case 'tram':
            return "🚊"
    }

    switch (leg.mode) {
        case 'bus':
            return "🚌"
        case 'watercraft':
            return "🚢"
        case 'taxi':
            return "🚕"
        case 'gondola':
            return "🚡"
        case 'aircraft':
            return "✈️"
        case 'car':
            return "🚗"
        case 'bicycle':
            return "🚲"
        case 'walking':
            return "🚶"
        case 'train':
        default:
            return "🚆"
    }
}

const getStopovers = (leg: Leg, departureTZOffset: number): string => {
    // drop the first and last leg
    leg.stopovers.shift();
    leg.stopovers.pop();
    
    return leg.stopovers.map((s) => {
        const arrival = s.arrival === null ? "" : `an: ${toShortDate(s.arrival, departureTZOffset)}${s.arrivalDelay ? ` + ${s.arrivalDelay}min` : ""}`;
        const splitter = s.arrival !== null && s.departure !== null ? ", " : "";
        const departure = s.departure === null ? "" : `ab: ${toShortDate(s.departure, departureTZOffset)}${s.departureDelay ? ` + ${s.departureDelay}min` : ""}`;
        return `${s.stop.name} (${arrival}${splitter}${departure})`;
    }
    ).join(", ");
}

const getTrwlLink = (leg: Leg): string => {
    const base_url = "https://traewelling.de/trains/trip?";

    const args = {
        tripID: leg.tripId,
        lineName: leg.line.name,
        start: leg.origin.id,
        departure: leg.departure
    }

    return `\n\nTräwelling-Check In: ` + base_url + new URLSearchParams(args).toString()
}

const getMarudorLink = (leg: Leg): string => {
    // marudor.de only offers details for a subset of transport services
    if ((["national", "nationalExpress", "regional", "regionalExp", "suburban"] as Product[]).includes(leg.line.product) === false) {
        return "";
    }

    const base_url = "https://marudor.de/api/hafas/v1/detailsRedirect/";

    return `\n\nMarudor-Link: ` + base_url + encodeURIComponent(leg.tripId);
}

export const legToEvent = ({ leg, departureTZOffset, includeTrwlLink, includeMarudorLink }: { leg: Leg, departureTZOffset: number, includeTrwlLink: boolean, includeMarudorLink: boolean }): Event | null => {
    if (leg.mode === "walking" || leg.mode === "bicycle" || leg.walking) {
        return null
    }

    const departurePlatform = leg.departurePlatform ? ` (Gl. ${leg.departurePlatform})` : "";
    const departure = dateWithDelay(leg.departure, leg.departureDelay - departureTZOffset);

    const arrivalPlatform = leg.arrivalPlatform ? ` (Gl. ${leg.arrivalPlatform})` : "";
    const arrival = dateWithDelay(leg.arrival, leg.arrivalDelay - departureTZOffset);

    if (typeof leg.stopovers === "undefined"
         || leg.stopovers.length === 2) { // origin and destination are part of the stopovers list, if available
        leg.stopovers = [];
    } 
    const stopoverList = (leg.stopovers.length !== 0) ? `\nZwischenstop${leg.stopovers.length === 3 ? "" : "s"}: ${getStopovers(leg, departureTZOffset)}` : "";

    return {
        summary: `${getEmoji(leg)} ${leg.line?.name}: ${leg.origin.name}${departurePlatform} -> ${leg.destination.name}${arrivalPlatform}`,
        description: `${leg.line.operator?.name ? `Betreiber: ${leg.line.operator.name}` : ""}${stopoverList}${includeTrwlLink ? `${getTrwlLink(leg)}` : ""}${includeMarudorLink ? `${getMarudorLink(leg)}` : ""}`,
        start: departure,
        end: arrival,
        location: leg.origin.name
    }
}

export const toCalendar = ({ journey, departureTZOffset, includeTrwlLink, includeMarudorLink }: { journey: Journey, departureTZOffset: number, includeTrwlLink: boolean, includeMarudorLink: boolean }): ICalCalendar => {
    const origin = journey.legs[0].origin.name
    const destination = journey.legs[journey.legs.length - 1].destination.name
    const events = journey.legs.map(leg => legToEvent({ leg, departureTZOffset, includeTrwlLink, includeMarudorLink })).filter(e => e !== null)

    const calendar = ical({
        name: `Reise von ${origin} nach ${destination}`,
        prodId: "//cal.iamjannik.me//Train-ICS-Converter//EN",
    });

    events.forEach((e) => {
        const event = calendar.createEvent(e);
        event.timezone('Europe/Berlin')
    });

    return calendar;
}