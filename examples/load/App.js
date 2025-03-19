import React from "react";
import { useFetchRows } from "@saltcorn/react-lib/hooks";

export default function App({ tableName, query }) {
  const { rows, error } = useFetchRows(tableName, query);

  if (error) {
    return <div className="container mt-4 text-danger">Error: {error}</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Persons List</h2>
      <div className="table-responsive">
        <table className="table table-striped table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Birth Date</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((person, index) => (
                <tr key={person.person_id}>
                  <td>{index + 1}</td>
                  <td>{person.first_name}</td>
                  <td>{person.last_name}</td>
                  <td>{person.birth_date}</td>
                  <td>{person.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
