import React from "react";
import ReactDOM from "react-dom";
import ReactDOMClient from "react-dom/client";
import { init, loadRemote } from "@module-federation/runtime";

import * as userLib from "@user-lib";

const isNode = typeof window === "undefined";

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
      entry: isNode
        ? `/plugins/public/react/${viewName}_remote.js`
        : // TODO get the version from the plugin, for now hardcoded in any release
          `http://localhost/sc_plugins/public/react@0.1.2/${viewName}_remote.js`,
    });
  }

  init(remotesCfg);
  for (const rootElement of rootElements) {
    const viewName = rootElement.getAttribute("view-name");
    const state = JSON.parse(
      decodeURIComponent(rootElement.getAttribute("state"))
    );
    const query = JSON.parse(
      decodeURIComponent(rootElement.getAttribute("query"))
    );
    const tableName = rootElement.getAttribute("table-name");
    const rows = JSON.parse(
      decodeURIComponent(rootElement.getAttribute("rows"))
    );
    const user = JSON.parse(
      decodeURIComponent(rootElement.getAttribute("user"))
    );
    try {
      const remote = await loadRemote(`${viewName}/${viewName}`);
      const props = { tableName, viewName, state, query, rows, user };
      const root = ReactDOMClient.createRoot(rootElement);
      root.render(React.createElement(remote.default, props));
    } catch (e) {
      console.error(`Error loading remote ${viewName}:`, e);
      rootElement.innerHTML = `<div>Error loading ${viewName}</div>`;
    }
  }
};

if (isBuilder) document.addEventListener("preview-loaded", initMain);
else {
  document.addEventListener("DOMContentLoaded", initMain);
  document.addEventListener("pjax-loaded", initMain);
}
