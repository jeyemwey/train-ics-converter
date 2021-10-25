import 'mocha';
import { strict as assert } from 'assert';
import { Event, legToEvent } from './ical';
import { Leg, Stop, Stopover } from './hafas-client';

describe("leg to calendar event", () => {
    const originStopover = {
        arrival: null,
        departure: "2021-10-16T22:00:00+02:00",
        stop: {name: "Beginn"} as Stop,
    } as Stopover;
    const destinationStopover = {
        arrival: "2021-10-16T22:30:00+02:00",
        departure: null,
        stop: {name: "Ende"} as Stop,
    } as Stopover;
    const baseLeg = {
        departure: "2021-10-16T22:00:00+02:00",
        arrival: "2021-10-16T22:30:00+02:00",
        origin: { name: "Beginn" },
        destination: { name: "Ende" },
        line: { name: "RE 1", mode: "train", product: "regional", operator: { name: "DB Regio NRW" } },
        mode: "train",
        stopovers: [originStopover, destinationStopover]
    } as Leg;
    const TIMEZONE_OFFSET = -120;

    const baseEvent = {
        summary: "🚆 RE 1: Beginn -> Ende",
        location: "Beginn",
        start: new Date("2021-10-16T22:00:00+02:00"),
        end: new Date("2021-10-16T22:30:00+02:00"),
        description: "Betreiber: DB Regio NRW"
    } as Event;

    it("works for simple leg", () => {
        const leg = { ...baseLeg } as Leg;

        const event = legToEvent({leg, departureTZOffset: TIMEZONE_OFFSET, includeTrwlLink: false, includeMarudorLink: true});
        assert.deepStrictEqual(event, baseEvent);
    });

    it("shows platforms if given", () => {
        const leg = {
            ...baseLeg,
            departurePlatform: "104 D-G",
            arrivalPlatform: "9 3/4"
        } as Leg;

        const expected = {
            ...baseEvent,
            summary: "🚆 RE 1: Beginn (Gl. 104 D-G) -> Ende (Gl. 9 3/4)"
        }

        const event = legToEvent({leg, departureTZOffset: TIMEZONE_OFFSET, includeTrwlLink: false, includeMarudorLink: true});
        assert.deepStrictEqual(event, expected);
    });

    it("uses delays if given for whole leg", () => {
        const leg = {
            ...baseLeg,
            departureDelay: 10,
            arrivalDelay: 10,
        } as Leg;

        const expected = {
            ...baseEvent,
            start: new Date("2021-10-16T22:10:00Z"),
            end: new Date("2021-10-16T22:40:00Z")
        }

        const event = legToEvent({leg, departureTZOffset: TIMEZONE_OFFSET, includeTrwlLink: false, includeMarudorLink: true});
        assert.deepStrictEqual(event, expected);
    });

    describe("shows stopovers", () => {
        it("if one stopover", () => {
            const leg = {
                ...baseLeg,
                stopovers: [
                    originStopover,
                    {
                        arrival: "2021-10-16T22:10:00+02:00",
                        departure: "2021-10-16T22:11:00+02:00",
                        stop: {
                            id: "90420" as never,
                            name: "Stopover1",
                            type: "stop"
                        } as Stop
                    } as Stopover,
                    destinationStopover
                ]
            };

            const expected = {
                ...baseEvent,
                description: baseEvent.description + "\nZwischenstop: Stopover1 (an: 22:10, ab: 22:11)"
            } as Event;

            const event = legToEvent({leg, departureTZOffset: TIMEZONE_OFFSET, includeTrwlLink: false, includeMarudorLink: true});
            assert.deepStrictEqual(event, expected);
        });

        it("if more than one", () => {
            const leg = {
                ...baseLeg,
                stopovers: [
                    originStopover,
                    {
                        arrival: "2021-10-16T22:10:00+02:00",
                        departure: "2021-10-16T22:11:00+02:00",
                        stop: {
                            id: "90420" as never,
                            name: "Stopover1",
                            type: "stop"
                        } as Stop
                    } as Stopover,

                    {
                        arrival: "2021-10-16T22:20:00+02:00",
                        departure: "2021-10-16T22:21:00+02:00",
                        stop: {
                            id: "90420" as never,
                            name: "Stopover2",
                            type: "stop"
                        } as Stop
                    } as Stopover,
                    destinationStopover
                ]
            };

            const expected = {
                ...baseEvent,
                description: baseEvent.description + "\nZwischenstops: Stopover1 (an: 22:10, ab: 22:11), Stopover2 (an: 22:20, ab: 22:21)"
            } as Event;

            const event = legToEvent({leg, departureTZOffset: TIMEZONE_OFFSET, includeTrwlLink: false, includeMarudorLink: true});
            assert.deepStrictEqual(event, expected);
        });

        it("if stopover has null departure", () => {
            const leg = {
                ...baseLeg,
                stopovers: [
                    originStopover,
                    {
                        arrival: "2021-10-16T22:10:00+02:00",
                        departure: null,
                        stop: {
                            id: "90420" as never,
                            name: "Stopover1",
                            type: "stop"
                        } as Stop
                    } as Stopover,
                    destinationStopover
                ]
            };

            const expected = {
                ...baseEvent,
                description: baseEvent.description + "\nZwischenstop: Stopover1 (an: 22:10)"
            } as Event;

            const event = legToEvent({leg, departureTZOffset: TIMEZONE_OFFSET, includeTrwlLink: false, includeMarudorLink: true});
            assert.deepStrictEqual(event, expected);
        });

        it("if stopover has null arrival", () => {
            const leg = {
                ...baseLeg,
                stopovers: [
                    originStopover,
                    {
                        arrival: null,
                        departure: "2021-10-16T22:10:00+02:00",
                        stop: {
                            id: "90420" as never,
                            name: "Stopover1",
                            type: "stop"
                        } as Stop
                    } as Stopover,
                    destinationStopover
                ]
            };

            const expected = {
                ...baseEvent,
                description: baseEvent.description + "\nZwischenstop: Stopover1 (ab: 22:10)"
            } as Event;

            const event = legToEvent({leg, departureTZOffset: TIMEZONE_OFFSET, includeTrwlLink: false, includeMarudorLink: true});
            assert.deepStrictEqual(event, expected);
        });
    });
});