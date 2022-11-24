import { Journey, Leg, Product, Remark } from "./hafas-client"
import { dateWithDelay, toShortDate } from "./date-utils"
import ical, { ICalCalendar } from 'ical-generator';
import { getEmoji, getRemarkEmoji } from "./emojis";
import { getBahnExpertLink, getTravelynxLink, getTrwlLink } from "./external-links";

export type Event = {
    summary: string;
    description: string;
    location: string;

    start: Date;
    end: Date;
}

export type UserConfig = {
    departureTZOffset: number;
    includeTrwlLink: boolean;
    includeBahnExpertLink: boolean;
    includeTravelynxLink: boolean;
}

const getCancelledEmoji = ({ cancelled }: Leg): string => cancelled ? "⛔" : "";

const getCancelledText = ({ cancelled }: Leg): string => cancelled ? "🚨🚨 Achtung! Zug fällt aus! 🚨🚨\n\n" : "";

const getStopovers = (leg: Leg, departureTZOffset: number): string => {
    // drop the first and last leg
    leg.stopovers.shift();
    leg.stopovers.pop();

    return leg.stopovers.map((s) => {
        const arrival = s.arrival === null ? "" : `an: ${toShortDate(s.arrival, departureTZOffset)}${s.arrivalDelay ? ` + ${s.arrivalDelay / 60}min` : ""}`;
        const splitter = s.arrival !== null && s.departure !== null ? ", " : "";
        const departure = s.departure === null ? "" : `ab: ${toShortDate(s.departure, departureTZOffset)}${s.departureDelay ? ` + ${s.departureDelay / 60}min` : ""}`;
        return `${s.stop.name} (${arrival}${splitter}${departure})`;
    }
    ).join(", ");
}

const getRemarks = (remarks: Remark[] | null): string => {
    if (!remarks) return '';

    const allRemarks = remarks.map(r => getRemarkEmoji(r) + " " + r.text).join("\n");

    return `\n\nHinweise:\n${allRemarks}`;
}

export const legToEvent = ({ leg, departureTZOffset, includeTrwlLink, includeBahnExpertLink, includeTravelynxLink }: UserConfig & { leg: Leg }): Event | null => {
    if (leg.mode === "walking" || leg.mode === "bicycle" || leg.walking) {
        return null
    }

    const departurePlatform = leg.departurePlatform ? ` (Gl. ${leg.departurePlatform})` : "";
    const departure = dateWithDelay(leg.departure ?? leg.plannedDeparture, (leg.departureDelay / 60) - departureTZOffset);

    const arrivalPlatform = leg.arrivalPlatform ? ` (Gl. ${leg.arrivalPlatform})` : "";
    const arrival = dateWithDelay(leg.arrival ?? leg.plannedArrival, (leg.arrivalDelay / 60) - departureTZOffset);

    if (typeof leg.stopovers === "undefined"
        || leg.stopovers.length === 2) { // origin and destination are part of the stopovers list, if available
        leg.stopovers = [];
    }
    // legs.stopovers is 3 long for [origin, stopover, destination].
    const stopoverList = (leg.stopovers.length !== 0)
        ? "\nZwischenstop" + (leg.stopovers.length === 3 ? "" : "s") + ": " + getStopovers(leg, departureTZOffset)
        : "";

    return {
        summary: getEmoji(leg) + getCancelledEmoji(leg) + " " + leg.line?.name + ": " + leg.origin.name + departurePlatform + " → " + leg.destination.name + arrivalPlatform,
        description: getCancelledText(leg)
            + (leg.line.operator?.name ? `Betreiber: ${leg.line.operator.name}` : "")
            + stopoverList
            + (includeTrwlLink ? getTrwlLink(leg) : "")
            + (includeTravelynxLink ? getTravelynxLink(leg) : "")
            + (includeBahnExpertLink ? getBahnExpertLink(leg) : "")
            + getRemarks(leg.remarks),
        start: departure,
        end: arrival,
        location: leg.origin.name
    }
}

export const toCalendar = ({ journey, departureTZOffset, includeTrwlLink, includeBahnExpertLink, includeTravelynxLink }: UserConfig & { journey: Journey }): ICalCalendar => {
    const origin = journey.legs[0].origin.name
    const destination = journey.legs[journey.legs.length - 1].destination.name
    const events = journey.legs.map(leg => legToEvent({ leg, departureTZOffset, includeTrwlLink, includeBahnExpertLink, includeTravelynxLink })).filter(e => e !== null)

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