import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import PersonsListPage from "./components/persons_list";
import PersonDetailsPage from "./components/person_detail";

function PersonsApp() {
  return (
    <Router>
      <Switch>
        <Route
          exact
          path="/view/PersonsReactList"
          component={PersonsListPage}
        />
        <Route
          path="/view/PersonsReactList/:id"
          component={PersonDetailsPage}
        />
      </Switch>
    </Router>
  );
}

export const components = {
  PersonsApp,
};


// use this user-code in your view-config

/*import React, { Suspense } from "react";
const { PersonsApp } = window.reactUserComponents;

function App() {
  return (
    <PersonsApp />
  );
}
window.addReactView("PersonsReactList", App);
*/