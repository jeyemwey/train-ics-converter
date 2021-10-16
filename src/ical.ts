import { Journey, Leg } from "./hafas-client"
import emoji from "node-emoji"
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
            return emoji.get("bus")
        case 'national':
            return emoji.get("high-speed-train")
        case 'nationalExpress':
            return emoji.get("bullet-train")
        case 'subway':
            return emoji.get("metro");
        case 'tram':
            return emoji.get("light-rail")
    }

    switch (leg.mode) {
        case 'bus':
            return emoji.get("bus")
        case 'watercraft':
            return emoji.get("ferry")
        case 'taxi':
            return emoji.get("taxi")
        case 'gondola':
            return emoji.get("aerial_tramway")
        case 'aircraft':
            return emoji.get("airplane")
        case 'car':
            return emoji.get("car")
        case 'bicycle':
            return emoji.get("bicycle")
        case 'walking':
            return emoji.get("person-walking")
        case 'train':
        default:
            return emoji.get("train")
    }
}

const getStopovers = (leg: Leg): string =>
    leg.stopovers.map((s) =>
        `${s.stop.name} (an: ${toShortDate(s.arrival)}${s.arrivalDelay ? ` + ${s.arrivalDelay}min` : ""}, ab: ${toShortDate(s.departure)}${s.departureDelay ? ` + ${s.departureDelay}min` : ""})`
    ).join(", ");

export const legToEvent = (leg: Leg): Event | null => {
    if (leg.mode === "walking" || leg.mode === "bicycle" || leg.walking) {
        return null
    }

    const departurePlatform = leg.departurePlatform ? ` (Gl. ${leg.departurePlatform})` : "";
    const departure = dateWithDelay(leg.departure, leg.departureDelay);

    const arrivalPlatform = leg.arrivalPlatform ? ` (Gl. ${leg.arrivalPlatform})` : "";
    const arrival = dateWithDelay(leg.arrival, leg.arrivalDelay);

    if (typeof leg.stopovers === "undefined") leg.stopovers = [];
    const stopoverList = (leg.stopovers.length !== 0) ? `\nZwischenstop${leg.stopovers.length === 1 ? "" : "s"}: ${getStopovers(leg)}` : "";

    return {
        summary: `${getEmoji(leg)} ${leg.line?.name}: ${leg.origin.name}${departurePlatform} -> ${leg.destination.name}${arrivalPlatform}`,
        description: `${leg.line.operator?.name ? `Betreiber: ${leg.line.operator.name}` : ""}${stopoverList}`,
        start: departure,
        end: arrival,
        location: leg.origin.name
    }
}

export const toCalendar = (journey: Journey): ICalCalendar => {
    const origin = journey.legs[0].origin.name
    const destination = journey.legs[journey.legs.length - 1].destination.name
    const events = journey.legs.map(legToEvent).filter(e => e !== null)

    const calendar = ical({
        name: `Reise von ${origin} nach ${destination}`,
        prodId: "//cal.iamjannik.me//Train-ICS-Converter//EN",
    });

    calendar.timezone({
        name: 'FOO',
        generator: getVtimezoneComponent
    });

    events.forEach((e) => {
        calendar.createEvent(e);
    });

    return calendar;
}