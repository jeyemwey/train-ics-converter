import React, { FunctionComponent } from "react";
import { Form } from "react-bootstrap";

interface LocationInputProps {
    invalid: boolean;
    placeholder: string;
    value: string;
    valueSetter: (newValue: string) => void;
}
 
const LocationInput: FunctionComponent<LocationInputProps> = (props) => {
    return <Form.Control
        type="text"
        placeholder={props.placeholder}
        value={props.value}
        onChange={e => props.valueSetter(e.target.value)}
        required
        isInvalid={props.invalid} />;
}
 
export default LocationInput;