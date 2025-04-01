import React from "react";
import ReactDOM from "react-dom/client";

function App({ viewName }) {
  return (
    <div className="container mt-4">
      <h2 className="mb-4">Tableless view {viewName}</h2>
    </div>
  );
}

window.App = App;
