
import React, { MouseEventHandler, ReactElement, useState } from 'react';
import { Button, Col, Container, Form, Navbar, ProgressBar, Row, Table } from 'react-bootstrap';

import "./App.scss";
import { BACKEND_URL } from './constants';

type JourneyResponse = {
  journeyText: string;
  refreshToken: string;
}

const formatInputDateTime = (d: Date): string => {
  const out = new Date(d); // don't modify the date object
  out.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return out.toISOString().slice(0, 16);
}
function App() {
  const [departure, setDeparture] = useState<Date>(new Date());
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [journeys, setJourneys] = useState<JourneyResponse[]>([]);
  const [fromInvalid, setFromInvalid] = useState(false);
  const [toInvalid, setToInvalid] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()

    if (from === "") {
      setFromInvalid(true)
    } else {
      setFromInvalid(false)
    }
    if (to === "") {
      setToInvalid(true)
    } else {
      setToInvalid(false)
    }

    if (from === "" || to === "") {
      return
    }

    setPending(true);
    fetch(BACKEND_URL + "journeys?" + new URLSearchParams({
      from, to, departure: departure.toISOString()
    }))
      .then(res => res.json())
      .then(({ journeys }: { journeys: JourneyResponse[] }) => setJourneys(journeys))
      .finally(() => setPending(false))
  }

  const icalButton = (refreshToken: string): ReactElement =>
    <Button href={BACKEND_URL + "cal?" + new URLSearchParams({ refreshToken })}>Kalender</Button>;

  return (
    <>
      <Navbar collapseOnSelect expand="md">
        <Container>
          <Navbar.Brand href="#home"><img
            src="/train.png"
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="Train icon"
          />{" "}Train ICS Converter</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              <a href="https://github.com/jeyemwey/train-ics-converter">Code on GitHub</a>
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Row>
          <Col>
            <Form style={{ marginBottom: "2rem" }}>
              <Form.Group className="mb-3" controlId="formOrigin">
                <Form.Label>Start</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ort der Abfahrt"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  required
                  isInvalid={fromInvalid} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formDestination">
                <Form.Label>Ziel</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ort der Ankunft"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  required
                  isInvalid={toInvalid} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formDestination">
                <Form.Label>Abfahrtzeit</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formatInputDateTime(departure)}
                  onChange={e => setDeparture(new Date(e.target.value))}
                  required />
              </Form.Group>

              <Button variant="primary" type="submit" onClick={handleSubmit}>
                Submit
              </Button>
            </Form>
          </Col>
          <Col>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Reise</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {journeys.map(journey => <tr>
                  <td>{journey.journeyText}</td>
                  <td>{icalButton(journey.refreshToken)}</td>
                </tr>)}
              </tbody>
            </Table>

            {pending && <ProgressBar animated now={100} />}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
