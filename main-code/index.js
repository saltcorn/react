import React from "react";
import ReactDOM from "react-dom";
import ReactDOMClient from "react-dom/client";

import * as userLib from "@user-lib";

window.React = React;
window.ReactDOMClient = ReactDOMClient;
window.ReactDOM = ReactDOM;
window.react_ctx = window.react_ctx || {};

window.addReactView = (scViewName, component) => {
  window.react_ctx[scViewName] = component;
};

window.reactUserLib = userLib;

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
    const root = ReactDOMClient.createRoot(rootElement);
    const App = window.react_ctx[viewName];
    if (App)
      root.render(
        <App
          tableName={tableName}
          viewName={viewName}
          state={state ? JSON.parse(decodeURIComponent(state)) : null}
          query={query ? JSON.parse(decodeURIComponent(query)) : null}
          rows={rows ? JSON.parse(decodeURIComponent(rows)) : null}
        />
      );
    else
      root.render(
        <div>
          <h1>View component not found, please expose {viewName}</h1>
        </div>
      );
  }
};

if (isBuilder) document.addEventListener("preview-loaded", init);
else document.addEventListener("DOMContentLoaded", init);
