import React from "react";
import ReactDOM from "react-dom";
import ReactDOMClient from "react-dom/client";
import { init, loadRemote } from "@module-federation/runtime";

import * as userLib from "@user-lib";

window.React = React;
window.ReactDOMClient = ReactDOMClient;
window.ReactDOM = ReactDOM;
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
const initMain = async () => {
  const remotesCfg = {
    name: "main",
    remotes: [],
  };
  const rootElements = document.getElementsByClassName("_sc_react-view");
  for (const rootElement of rootElements) {
    const viewName = rootElement.getAttribute("view-name");
    if (remotesCfg.remotes.some((r) => r.name === viewName)) continue;
    remotesCfg.remotes.push({
      name: viewName,
      entry: `./plugins/public/react/${viewName}_remote.js`,
    });
  }

  init(remotesCfg);
  for (const rootElement of rootElements) {
    const viewName = rootElement.getAttribute("view-name");
    const tableName = rootElement.getAttribute("table-name");
    const state = rootElement.getAttribute("state");
    const query = rootElement.getAttribute("query");
    const rows = rootElement.getAttribute("rows");
    const remote = await loadRemote(viewName);
    const props = { tableName, state, query, rows };
    const root = ReactDOMClient.createRoot(rootElement);
    root.render(React.createElement(remote.default, props));
  }
};

if (isBuilder) document.addEventListener("preview-loaded", initMain);
else document.addEventListener("DOMContentLoaded", initMain);
