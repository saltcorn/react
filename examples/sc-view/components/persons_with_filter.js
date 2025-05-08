import React from "react";
import { ScView } from "@saltcorn/react-lib/components";

/**
 * Shows a Filter and a List of persons under it.
 *
 * For this to work you have to create the views "Persons_Filter" and "Persons_List"
 * on your Saltcorn dashboard.
 **/
export default function PersonsWithFilter({ query }) {
  return (
    <div>
      <ScView name="Persons_Filter" query={query} />
      <ScView name="Persons_List" query={query} />
    </div>
  );
}
