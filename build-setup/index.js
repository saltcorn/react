import React from "react";
import { createRoot } from "react-dom/client";
import App from "../app-code/App.js";

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
    const state = JSON.parse(
      decodeURIComponent(rootElement.getAttribute("state"))
    );
    const query = JSON.parse(
      decodeURIComponent(rootElement.getAttribute("query"))
    );
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
  }
};

if (isBuilder) document.addEventListener("preview-loaded", init);
else init();
