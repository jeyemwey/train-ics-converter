import { Leg, Remark } from "./hafas-client"

export const getEmoji = (leg: Leg): string => {
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


export const getRemarkEmoji = (r: Remark): string => {
    switch (r.code) {
        case "55":
            return "🚭";
        case "boarding-ramp":
        case "EA":
        case "EI":
        case "ER":
            return '♿';
        case "BW":
        case "KG":
        case "MN":
        case "on-board-bistro":
        case "on-board-restaurant":
            return '🍴';
        case "komfort-checkin":
            return '🧸';
        case "GL":
            return '👥';
        case "ice-sprinter":
            return '⚡';
        case "journey-cancelled":
            return '⛔';
        case "parents-childrens-compartment":
            return '👪';
        case "power-sockets":
            return '🔌';
        case "SA":
            return '🍼';
        case "SL":
        case "SW":
            return '🛏️';
        case "snacks":
            return '🥨';
        case "wifi":
            return '📡';
        case "air-conditioned":
            return '🥶';
        case "RE":
        case "NJ":
            return '🎟';
        case "text.journeystop.product.or.direction.changes.journey.message":
            return '🛸';
    }

    if (r.code && (r.code.includes("barrier") || r.code.includes("wheelchair")) || (r.text && r.text.includes("wheelchair users"))) {
        return '♿';
    }

    if (r.text && (r.text.includes("Baustelle")
        || r.text.includes("Baumaßnahmen")
        || r.text.includes("Bauarbeiten")
        || r.text.includes("Reparatur")
        || r.text.toLowerCase().includes("construction")
        || r.text.toLowerCase().includes("train rerouting"))) {
        return '🚧';
    }

    if (r.code && (r.code.includes("bicycle"))) {
        return '🚲';
    }

    if (r.text && r.text.toLowerCase().includes("krank")) {
        return '🤒';
    }

    if ((r.text && r.text.toLowerCase().includes("mask")) || r.code === "3G") {
        return '🤿';
    }

    if (r.text && (r.text.includes("restroom") || r.text.includes("toilette") || r.text.includes("WC"))) {
        return '🚾';
    }

    if (r.text && r.text.includes("Aufzug")) {
        return '🛗';
    }

    console.warn(`Found unknown remark type!: ${JSON.stringify(r)}`);

    switch (r.type) {
        case "hint":
            return 'ℹ️';
        case "warning":
            return '⚠️';
        case "status":
            return '📜';
    }

    return '⚠️';
}