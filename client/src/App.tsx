
import React, { MouseEventHandler, ReactElement, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  InputGroup,
  Navbar,
  Row,
  Spinner,
  Table } from 'react-bootstrap';

import "./App.scss";
import { BACKEND_URL } from './constants';

type JourneyResponse = {
  journeyText: string;
  refreshToken: string;
}

const formatInputDateTime = (d: Date): string => {
  if (isNaN(d.getTime())) {
    return "";
  }

  const out = new Date(d); // don't modify the date object
  out.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  const str = out.toISOString().slice(0, 16);
  return str;
}

function App() {
  const [departure, setDeparture] = useState<Date>(new Date());
  const [formattedDeparture, setFormattedDeparture] = useState<string>(formatInputDateTime(departure));
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [journeys, setJourneys] = useState<JourneyResponse[]>([]);
  const [fromInvalid, setFromInvalid] = useState(false);
  const [toInvalid, setToInvalid] = useState(false);
  const [departureInvalid, setDepartureInvalid] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [includeMarudorLink, setIncludeMarudorLink] = useState(false);
  const [includeTrwlLink, setIncludeTrwlLink] = useState(false);

  useEffect(() => {
    setFormattedDeparture(formatInputDateTime(departure));
  }, [departure]);

  const handleSwapFromAndTo = () => {
    setTo(from);
    setFrom(to);
  }

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

    if (isNaN(departure.getTime())) {
      setDepartureInvalid(true);
    } else {
      setDepartureInvalid(false);
    }

    if (from === "" || to === "" || isNaN(departure.getTime())) {
      return
    }

    setPending(true);
    fetch(BACKEND_URL + "journeys?" + new URLSearchParams({
      from,
      to,
      departure: departure.toISOString(),
      departureTZOffset: departure.getTimezoneOffset().toString()
    }))
      .then(res => res.json())
      .then(({ journeys, error }: { journeys?: JourneyResponse[], error?: string }) => {
        setError(error)

        if (journeys) {
          setJourneys(journeys)
        }
      })
      .catch(error => setError(error.toString()))
      .finally(() => setPending(false))
  }

  const icalButton = (refreshToken: string): ReactElement =>
    <Button href={BACKEND_URL + "cal?" + new URLSearchParams({
      refreshToken,
      departureTZOffset: departure.getTimezoneOffset().toString(),
      includeTrwlLink: includeTrwlLink ? "true" : "false",
      includeMarudorLink: includeMarudorLink ? "true" : "false"
    })}>Kalender</Button>;

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
          <Col md={6}>
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
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Ort der Ankunft"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    required
                    isInvalid={toInvalid} />
                  <Button
                    variant="outline-secondary"
                    id="swapOriginAndDepartureButton"
                    onClick={handleSwapFromAndTo}
                  >🔃</Button>
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3" controlId="formDestination">
                <Form.Label>Abfahrtzeit</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formattedDeparture}
                  onChange={e => setDeparture(new Date(e.target.value))}
                  required
                  isInvalid={departureInvalid} />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDestination">
                <Form.Check
                  type={"checkbox"}
                  id={"includeMarudorLink"}
                  label={"Marudor-Link einfügen"}
                  checked={includeMarudorLink}
                  onChange={e => setIncludeMarudorLink(e.target.checked)}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formDestination">
                <Form.Check
                  type={"checkbox"}
                  id={"includeTrwlLink"}
                  label={"Träwelling Check-in-Link einfügen"}
                  checked={includeTrwlLink}
                  onChange={e => setIncludeTrwlLink(e.target.checked)}
                />
              </Form.Group>

              <Button variant="primary" type="submit" onClick={handleSubmit} disabled={pending}>
                {pending ? <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                /> : "Submit"}
              </Button>
            </Form>
          </Col>
          <Col md={6}>
            {journeys.length === 0 ? <p></p> :
              <Table striped bordered hover style={{ marginBottom: "2rem" }}>
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
            }

            {error && <Alert variant={'danger'} style={{ marginBottom: "2rem" }}>{error}</Alert>}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
