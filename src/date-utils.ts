export type IsoDate = string 	// ISO 8601 string (with stop/station timezone)

export type ArrivingDepartingWithPossibleDelay = ({
    arrival: IsoDate,
    departure: IsoDate | null
} | {
    arrival: IsoDate | null,
    departure: IsoDate
}) & {
    arrivalDelay?: number,
    departureDelay?: number,

    plannedArrival: IsoDate,
    plannedDeparture?: IsoDate,
}

export const toShortDate = (d: IsoDate): string => {
    const date = new Date(d)
    date.setUTCMinutes(date.getMinutes());

    return new Intl.DateTimeFormat('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

export const toDateObj = (d: IsoDate): Date =>
    new Date(d)

export const dateWithDelay = (d: IsoDate, delay?: number): Date => {
    const scheduled = new Date(d);

    if (typeof delay !== "number" || !delay) {
        return scheduled;
    }

    const date = new Date(scheduled.getTime() + (delay ?? 0) * 60 * 1000);

    return date;
}