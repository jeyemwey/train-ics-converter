import { ArrivingDepartingWithPossibleDelay } from "./date-utils";

const createClient = require('hafas-client')
const dbProfile = require('hafas-client/p/db')

type Id = never
export type Mode = 'train' | 'bus' | 'watercraft' | 'taxi' | 'gondola' | 'aircraft' | 'car' | 'bicycle' | 'walking';
type Product = 'nationalExpress'| 'national'| 'regionalExp'| 'regional'| 'suburban'| 'bus'| 'ferry'| 'subway'| 'tram'| 'taxi';

type Price = { amount: number, currency: 'EUR' | 'GBP' | 'CHF' /* ISO 4217 code, required */ } | { amount: null, hint?: string }
export type Stopover = ArrivingDepartingWithPossibleDelay & {
	type: 'stopover',
	stop: StationRef,
	arrivalPlatform?: string,
	departurePlatform?: string,
}
type StationRef = Id | Station | Stop
type Station = {
    type: 'station',
    id: Id,
    name: string,
    location?: Location,
    regions?: Id[]
}
export type Stop = {
    type: 'stop',
    id: Id,
    name: string,
    station: StationRef,
    location?: Location,
    products: {
        [K in Product]: Boolean
    }
}
export type Location = {
    type: 'location', // required
    name?: string,
    address?: string,
    longitude?: number,
    latitude?: number,
    altitude?: number
}
type Operator = { type: 'operator', id: Id, name: string }

export type Leg = ArrivingDepartingWithPossibleDelay & {
    type: 'leg', // required
    id?: Id, // unique, optional
    origin: StationRef,
    destination: StationRef,
    departurePlatform?: string, // string, optional
    arrivalPlatform?: string,
    stopovers: Stopover[],
    schedule: Id,
    mode: Mode,
    subMode: never,
    public: boolean,
    operator: Operator | Id,
    price: Price,
    loadFactor?: 'very-high' | string,
    line: Line,
    walking?: Boolean
}
type Line = {
    type: "line",
    id: Id,
    fahrtNr: Id,
    name: string,
    public: Boolean,
    adminCode: string,
    productName: string,
    mode: Mode,
    product: Product,
    operator: Operator
}

export type Journey = {
    type: 'journey', // required
    id?: Id, // unique, optional
    legs: Leg[], // array of leg objects, required, must contain at least one entry
    price?: Price,
    refreshToken: string
}

type HafasClient = {
    locations: (query: string, opt?: {
        fuzzy?: Boolean, // find only exact matches?
        results?: Number, // how many search results?
        stops?: Boolean, // return stops/stations?
        addresses?: Boolean,
        poi?: Boolean, // points of interest
        subStops?: Boolean, // parse & expose sub-stops of stations?
        entrances?: Boolean, // parse & expose entrances of stops/stations?
        linesOfStops?: false, // parse & expose lines at each stop/station?
        language?: 'en' // language to get results in
    }) => Promise<(Station | Stop | Location)[]>,
    journeys: (from: StationRef | Location, to: StationRef | Location, opt: ({ departure?: Date| string, arrival?: null } | { departure?: null, arrival?: Date| string }) & {
        earlierThan?: never, // ref to get journeys earlier than the last query
        laterThan?: never, // ref to get journeys later than the last query
        results?: null | Number, // number of journeys – `null` means "whatever HAFAS returns"
        via?: null | StationRef, // let journeys pass this station
        stopovers?: Boolean, // return stations on the way?
        transfers?: -1 | Number, // Maximum nr of transfers. Default?: Let HAFAS decide.
        transferTime?: Number, // minimum time for a single transfer in minutes
        accessibility?: 'none' | 'partial' | 'complete', // 'none', 'partial' or 'complete'
        bike?: Boolean, // only bike-friendly journeys
        walkingSpeed?: 'slow' | 'normal' | 'fast', // 'slow', 'normal', 'fast'
        // Consider walking to nearby stations at the beginning of a journey?
        startWithWalking?: Boolean,
        products?: {
            // these entries may vary from profile to profile
            suburban?: Boolean,
            subway?: Boolean,
            tram?: Boolean,
            bus?: Boolean,
            ferry?: Boolean,
            express?: Boolean,
            regional?: Boolean
        },
        tickets?: Boolean, // return tickets? only available with some profiles
        polylines?: Boolean, // return a shape for each leg?
        subStops?: Boolean, // parse & expose sub-stops of stations?
        entrances?: Boolean, // parse & expose entrances of stops/stations?
        remarks?: Boolean, // parse & expose hints & warnings?
        scheduledDays?: Boolean, // parse which days each journey is valid on
        language?: 'en', // language to get results in
    }) => Promise<{
        earlierRef: never,
        laterRef: never,
        journeys: Journey[],
        realtimeDataFrom: number | null,
    }>,
    refreshJourney: (token: string, opt?: {
        stopovers?: Boolean, // return stations on the way?
        polylines?: Boolean, // return a shape for each leg?
        tickets?: Boolean, // return tickets? only available with some profiles
        subStops?: Boolean, // parse & expose sub-stops of stations?
        entrances?: Boolean, // parse & expose entrances of stops/stations?
        remarks?: Boolean, // parse & expose hints & warnings?
        language?: 'en' // language to get results in
    }) => Promise<Journey>
}

// create a client with the Deutsche Bahn profile
export const client = createClient(dbProfile, 'my-awesome-program') as HafasClient