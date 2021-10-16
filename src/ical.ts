import { Journey, Leg} from "./hafas-client"
import emoji from "node-emoji"
import { dateWithDelay, toShortDate } from "./date-utils"

export type Event = {
    summary: string;
    description: string;
    location: string;

    start: Date;
    end: Date;
}

const getEmoji = (leg: Leg): string => {
    switch (leg.line.product) {
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
        `${s.stop.name} (an: ${toShortDate(s.arrival)}${s.arrivalDelay ? ` + ${s.arrivalDelay}min`: ""}, ab: ${toShortDate(s.departure)}${s.departureDelay ? ` + ${s.departureDelay}min`: ""})`
    ).join(", ");

export const legToEvent = (leg: Leg): Event => {
    const departurePlatform = leg.departurePlatform ? ` (Gl. ${leg.departurePlatform})` : "";
    const departure = dateWithDelay(leg.departure, leg.departureDelay);
    
    const arrivalPlatform = leg.arrivalPlatform ? ` (Gl. ${leg.arrivalPlatform})` : "";
    const arrival = dateWithDelay(leg.arrival, leg.arrivalDelay);
    
    const stopoverList = (leg.stopovers.length !== 0) ? `\nZwischenstop${leg.stopovers.length === 1 ? "" : "s"}: ${getStopovers(leg)}` : "";

    return {
        summary: `${getEmoji(leg)} ${leg.line.name}: ${leg.origin.name}${departurePlatform} -> ${leg.destination.name}${arrivalPlatform}`,
        description: "Betreiber: " + leg.operator.name + stopoverList,
        start: departure,
        end: arrival,
        location: leg.origin.name
    }
}

export const journeyToIcals = (journey: Journey): Event[] => {
    return journey.legs.map(legToEvent)
}