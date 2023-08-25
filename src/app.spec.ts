// Import the dependencies for testing
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from './app.js';

// Configure chai
chai.use(chaiHttp);
chai.should();

describe('journey request', () => {
    const baseRequest = {
        to: "Duisburg Hbf",
        from: "Berlin Hbf",
        departure: "2022-05-08T06:30:00",
        departureTZOffset: "-60"
    };

    describe("works with the base request", () => {
        it("works", (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    // If this breaks, check if baseleg.departureTime is in the past and if Hafas has problems.
                    done();
                });
        }).timeout(10000);
    });

    describe('cries on', () => {
        it('missing `from` param', (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    from: ""
                })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('missing `to` param', (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    to: ""
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('missing `departure` param', (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    departure: ""
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('missing `departureTZOffset` param', (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    departureTZOffset: ""
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('`from` == `to` param', (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    to: baseRequest.from
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('via is given and `from` == `via` param', (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    via: baseRequest.from
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it('via is given and `to` == `via` param', (done) => {
            chai.request(app)
                .get('/journeys')
                .query({
                    ...baseRequest,
                    via: baseRequest.to
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });
    });
});