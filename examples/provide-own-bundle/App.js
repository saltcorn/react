import React from "react";
import { createRoot } from "react-dom/client";

import { useFetchRows } from "@saltcorn/react-lib/hooks";
import { insertRow } from "@saltcorn/react-lib/api";

function App({ rows }) {
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
                <tr key={person.id}>
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

const scriptTag = document.currentScript;
const rootElement = scriptTag.parentElement;
const tableName = rootElement.getAttribute("table-name");
const viewName = rootElement.getAttribute("view-name");
const state = JSON.parse(decodeURIComponent(rootElement.getAttribute("state")));
const query = JSON.parse(decodeURIComponent(rootElement.getAttribute("query")));
const rows = JSON.parse(
  decodeURIComponent(rootElement.getAttribute("rows"))
);
const root = createRoot(rootElement);
root.render(
  <App
    tableName={tableName}
    viewName={viewName}
    state={state}
    query={query}
    rows={rows}
  />
);