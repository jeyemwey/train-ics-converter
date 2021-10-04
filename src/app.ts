import express from 'express';
import { client, Journey, Leg } from './hafas-client';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Please hit the /journeys request.');
});


const lineDesc = (l: Leg) => {
    if (typeof l.line !== "undefined" ){
        return l.line?.name;
    }
    
    if (l.walking!) {
        return "zu Fuß gehen"
    }

    return "other"
}
const journeyDebug = (j: Journey) => `${j.legs[0].departure} => ${j.legs[j.legs.length - 1].arrival}, ${j.legs.map(lineDesc).join(", ")}`

/**
 * @route GET /journeys
 * @queryparam from Name of the departure station
 * @queryparam to Name of the arrival station
 * @queryparam departure Time of departure in RFC3339/ISO8601 (e.g. 2021-10-06T08:05:00+02:00)
 */
app.get('/journeys', async (req, res) => {
    const from = await client.locations(req.query.from as string, { results: 1 })
    const to = await client.locations(req.query.to as string, { results: 1 })
    const departure = new Date(req.query.departure as string);

    if (departure.getTime() === NaN ) {
        return res.status(400).send({error: "Bad Request: Bad departure time"})
    }
    
    const journeys = (await client.journeys(from[0], to[0], {
        results: 10,
        departure: req.query.departure as string
    })).journeys.map(journeyDebug)
    
    return res.send({ journeys })
 })

app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});