import { expect, it, describe } from 'vitest';
import supertest from 'supertest';
import ex from 'express';
import { createServer } from './app.js';

const app = createServer(ex);

describe('journey request', () => {
    const baseRequest = {
        to: "Duisburg Hbf",
        from: "Berlin Hbf",
        departure: "2023-09-08T06:30:00",
        departureTZOffset: "-60"
    };

    describe("works with the base request", () => {
        it("works", async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest
                })
		.expect(200)
                .then((value) => {
		    expect(value.body).toBeTruthy();
                    // If this breaks, check if baseleg.departureTime is in the past and if Hafas has problems.
                })
        })
    });

    describe('cries on', () => {
        it('missing `from` param', async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    from: ""
                })
				.expect(400)
                .then(({ body }) => {
					expect(body).toHaveProperty('error');
					expect(body.error).toContain('Bad from');
                    // expect(err).to.be.null;
                });
        });

        it('missing `to` param', async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    to: ""
                })
				.expect(400)
                .then(({ body }) => {
					expect(body).toHaveProperty('error');
					expect(body.error).toContain('Bad to');
                });
        });

        it('missing `departure` param', async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    departure: ""
                })
				.expect(400)
                .then(({ body }) => {
					expect(body).toHaveProperty('error');
					expect(body.error).toContain('Bad departure');
                });
        });

        it('missing `departureTZOffset` param', async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    departureTZOffset: ""
                })
				.expect(400)
                .then(({ body }) => {
					expect(body).toHaveProperty('error');
					expect(body.error).toContain('Bad departureTZOffset');
                });
        });

        it('`from` == `to` param', async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    to: baseRequest.from
                })
				.expect(400)
                .then(({ body }) => {
					expect(body).toHaveProperty('error');
					expect(body.error).toContain('Origin equals Destination');
                });
        });

        it('via is given and `from` == `via` param', async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    via: baseRequest.from
                })
				.expect(400)
                .then(({ body }) => {
					expect(body).toHaveProperty('error');
					expect(body.error).toContain('Via stop cannot be used');
                });
        });

        it('via is given and `to` == `via` param', async () => {
            await supertest(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    via: baseRequest.to
                })
				.expect(400)
                .then(({ body }) => {
					expect(body).toHaveProperty('error');
					expect(body.error).toContain('Via stop cannot be used');
                });
        });
    });
});
