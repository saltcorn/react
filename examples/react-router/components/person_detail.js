import React from "react";
import { useParams, useHistory } from "react-router-dom";
import { useFetchRows } from "@saltcorn/react-lib/hooks";

export default function PersonDetailsPage() {
  const { id } = useParams();
  const history = useHistory();
  const { rows, error } = useFetchRows("Persons", {});

  const person = rows?.find((p) => p.id === parseInt(id));

  if (!person) {
    return (
      <div className="container mt-4">
        <h2>Person not found</h2>
        <button
          className="btn btn-secondary mt-3"
          onClick={() => history.goBack()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Person Details</h2>
      <div className="card p-3 mt-3">
        <p>
          <strong>First Name:</strong> {person.first_name}
        </p>
        <p>
          <strong>Last Name:</strong> {person.last_name}
        </p>
        <p>
          <strong>Birth Date:</strong> {person.birth_date}
        </p>
        <p>
          <strong>Email:</strong> {person.email}
        </p>
        <button
          className="btn btn-secondary mt-3"
          onClick={() => history.goBack()}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
