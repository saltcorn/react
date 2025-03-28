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
            {rows && rows.length > 0 ? (
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

// check if it's a preview in the builder
const scripts = document.getElementsByTagName("script");
let isBuilder = false;
for (const script of scripts) {
  if (script.src.includes("builder_bundle.js")) {
    isBuilder = true;
    break;
  }
}

// find all divs with class "_sc_react-view"
// and render the App component in each of them
const init = () => {
  const rootElements = document.getElementsByClassName("_sc_react-view");
  for (const rootElement of rootElements) {
    const tableName = rootElement.getAttribute("table-name");
    const viewName = rootElement.getAttribute("view-name");
    const state = rootElement.getAttribute("state");
    const query = rootElement.getAttribute("query");
    const rows = rootElement.getAttribute("rows");
    const root = createRoot(rootElement);
    root.render(
      <App
        tableName={tableName}
        viewName={viewName}
        state={state ? JSON.parse(decodeURIComponent(state)) : null}
        query={query ? JSON.parse(decodeURIComponent(query)) : null}
        rows={rows ? JSON.parse(decodeURIComponent(rows)) : null}
      />
    );
  }
};

if (isBuilder) document.addEventListener("preview-loaded", init);
else init();
