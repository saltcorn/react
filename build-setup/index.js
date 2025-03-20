import React from "react";
import { createRoot } from "react-dom/client";
import App from "../app-code/App.js";

const scriptTag = document.currentScript; // check on mobile
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
