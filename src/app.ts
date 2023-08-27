import * as url from "url";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ex from 'express';
import { decode, encode } from './binary-utils.js';
import { toShortDate } from './date-utils.js';
import { client, Journey, Leg } from './hafas-client.js';
import { toCalendar } from './ical.js';

const lineDesc = (l: Leg) => {
	if (typeof l.line !== "undefined") {
		return l.line?.name;
	}

	if (l.walking!) {
		return "zu Fuß gehen"
	}

	return "other"
}
const journeyText = (j: Journey, departureTZOffset: number) => `${toShortDate(j.legs[0].departure, departureTZOffset)} → ${toShortDate(j.legs[j.legs.length - 1].arrival, departureTZOffset)}: ${j.legs.map(lineDesc).join(", ")}`


export function createServer(express: typeof ex) {

	const app = express();

	app.use(function (_req, res, next) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET');
		res.setHeader('Access-Control-Allow-Headers', 'content-type');
		next();
	});


	/**
 * @route GET /journeys
 * @param from Name of the departure station
 * @param to Name of the arrival station
 * @param departure Time of departure in RFC3339/ISO8601 (e.g. 2021-10-06T08:05:00+02:00)
 */
	app.get('/journeys', async (req, res) => {
		if (!req.query.from) {
			return res.status(400).send({ error: "Bad Request: Bad from" })
		}

		if (!req.query.to) {
			return res.status(400).send({ error: "Bad Request: Bad to" })
		}

		const departure = new Date(req.query.departure as string);
		const departureTZOffset = parseInt(req.query.departureTZOffset as string);

		if (Object.is(departureTZOffset, NaN)) {
			return res.status(400).send({ error: "Bad Request: Bad departureTZOffset" })
		}

		if (Object.is(departure.getTime(), NaN)) {
			return res.status(400).send({ error: "Bad Request: Bad departure time" })
		}

		if (req.query.from === req.query.to) {
			return res.status(400).send({ error: "Bad Request: Origin equals Destination" })
		}

		if (req.query.from === req.query.via || req.query.via === req.query.to) {
			return res.status(400).send({ error: "Bad Request: Via stop cannot be used as Origin or Destination" })
		}

		const from = await client.locations(req.query.from as string, { results: 1 })
		const to = await client.locations(req.query.to as string, { results: 1 })
		const via = req.query.via ? await client.locations(req.query.via as string, { results: 1 }) : null

		const journeys = (await client.journeys(from[0], to[0], {
			results: 10,
			departure: departure,
			via: via ? via[0] : null // stationRef or null if not given
		}))
			.journeys.map(j => ({
				journeyText: journeyText(j, departureTZOffset),
				refreshToken: encode(j.refreshToken)
			}))

		return res.send({ journeys })
	})

	/**
 * @route GET /cal
 * @param refreshToken Token that identifies a journey including all legs on a specific day
 * @param includeTrwlLink Include the träwelling link in the calendar description
 */
	app.get("/cal", async (req, res) => {
		const token_encoded = req.query.refreshToken;
		if (!token_encoded)
			return res.status(400).send({ error: "Bad Request: refreshToken is not valid" })

		const token = decode(token_encoded as string);

		const reqDepartureTZOffset = parseInt(req.query.departureTZOffset as string)
		if (Object.is(reqDepartureTZOffset, NaN)) {
			return res.status(400).send({ error: "Bad Request: Bad departureTZOffset" })
		}

		const departureTZOffset = reqDepartureTZOffset - new Date().getTimezoneOffset(); // also remove the server tz offset

		const includeTrwlLink = (req.query.includeTrwlLink as string) === "true"
		const includeBahnExpertLink = (req.query.includeBahnExpertLink as string) === "true"
		const includeTravelynxLink = (req.query.includeTravelynxLink as string) === "true"

		const journey = (await client.refreshJourney(token, { stopovers: true })).journey;
		const calendar = toCalendar({ journey, departureTZOffset, includeTrwlLink, includeBahnExpertLink, includeTravelynxLink });

		return calendar.serve(res);
	});


	app.get('/_health', (_req, res) => {
		res.status(200).send('ok')
	})

	const ___dirname = dirname(fileURLToPath(import.meta.url))
	app.use(express.static(___dirname + "/public"));
	app.use(express.static("client/build")); // for local development

	return app;
}


// if (import.meta.main) { // does not wokr in node (only deno)
// (import.meta.url === ('file:///'+process.argv[1].replace(/\\/g,'/')).replace(/\/{3,}/,'///')) // works in node 18+
if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
	// module was not imported but called directly
	const app = createServer(ex);
	const port = process.env.PORT ?? 8080;
	app.listen(port, () => console.log(`server is listening on ${port}, running in ${process.env.NODE_ENV} mode`));
}
