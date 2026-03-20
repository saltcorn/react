const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const Table = require("@saltcorn/data/models/table");
const View = require("@saltcorn/data/models/view");
const { div, script } = require("@saltcorn/markup/tags");
const { getState } = require("@saltcorn/data/db/state");
const {
  stateFieldsToWhere,
  readState,
} = require("@saltcorn/data/plugin-helper");
const db = require("@saltcorn/data/db");

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises;

const buildViewBundle = async (buildMode, viewName, timestamp) => {
  const tenant = db.getTenantSchema() || "public";
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npm",
      [
        "run",
        buildMode === "development" ? "build_view_dev" : "build_view",
        "--",
        "--env",
        `view_name=${viewName}`,
        "--env",
        `tenant_name=${tenant}`,
        "--env",
        `timestamp=${timestamp}`,
        "--env",
        `bundle_name=${viewName}.bundle.js`,
      ],
      {
        cwd: __dirname,
      }
    );
    child.stdout.on("data", (data) => {
      getState().log(5, data.toString());
    });
    child.stderr?.on("data", (data) => {
      getState().log(2, data.toString());
    });
    child.on("exit", function (code, signal) {
      getState().log(5, `child process exited with code ${code}`);
      resolve(code);
    });
    child.on("error", (msg) => {
      getState().log(2, `child process failed: ${msg.code}`);
      reject(msg.code);
    });
  });
};

const buildSafeViewName = (viewName) => viewName.replace(/[^a-zA-Z0-9]/g, "_");

const handleUserCode = async (
  userCode,
  buildMode,
  viewName,
  oldTimestamp,
  newTimestamp
) => {
  const tenant = db.getTenantSchema() || "public";
  const userCodeDir = path.join(__dirname, "user-code", tenant);
  const codeDirExists = await fs
    .access(userCodeDir)
    .then(() => true)
    .catch(() => false);
  if (!codeDirExists) await fs.mkdir(userCodeDir, { recursive: true });
  const safeViewName = buildSafeViewName(viewName);
  await fs.writeFile(
    path.join(userCodeDir, `${safeViewName}.js`),
    userCode,
    "utf8"
  );
  if ((await buildViewBundle(buildMode, safeViewName, newTimestamp)) !== 0) {
    throw new Error("Build failed please check your server logs");
  }
  try {
    await fs.rm(
      path.join(__dirname, "public", tenant, `${safeViewName}_${oldTimestamp}`),
      { recursive: true, force: true }
    );
  } catch (err) {
    getState().log(
      2,
      "Error removing old directory: " + err.message || "Unknown error"
    );
  }
};

const reactViewSystemPrompt = `Use the generate_react_view tool to generate a react view. Here is an example of a
valid generated react code:

\`\`\`import React from "react";

export default function App({}) {
  return <h1>Hello world</h1>;
}
\`\`\`

The generated code must include the react import at the top, and your generated code should export default the component.

A react view can be tableless or table-based. A tableless react view could for example show the current time, a table based view could show the data of one or multiple persons.

When a react view is tabless, it gets this properties:
\`\`\`import React from "react";
export default function App({viewName, query}) {...}
\`\`\`
When a react view is table based, it gets this properties:
\`\`\`import React from "react";
export default function App({viewName, query, tableName, rows, state}) {...}
\`\`\`
- viewName: the name of the view
- query: the query parameters of the view
- tableName: the name of the Saltcorn table
- rows: the rows of the table, this is an array of objects, each object is a row of the table
- state: the state of the view, this is an object with the state of the view

A react-view has access to bootstrap 5 styles. react-bootstrap is not available please use the normal bootstrap classes.

A react-view can use the function set_state_field(key, value, e) to change the current query of the browser window.
By changing the query you can act as a filter. For example if you show a list of persons, you can filter by name, age, etc.
Key is the name of the field, value is the value you want to set, and e is the event that triggered the change.
A react-filter-view can exist independent of other views, it only has to call set_state_field.

A react-view hast accees to the react-lib npm package. This is a module with hooks and functions to interact with the Saltcorn system. You can import it like this:
\`\`\`
  import { useFetchOneRow, useFetchRows } from "@saltcorn/react-lib/hooks";
  import { fetchOneRow, fetchRows, insertRow, updateRow, deleteRow } from "@saltcorn/react-lib/api";
\`\`\`
Please note that hooks are in the hooks submodule and functions are in the api submodule.

useFetchOneRow and useFetchRows are hooks to fetch rows from a Saltcorn table. Table-based views receive the initial rows in the rows property,
useFetchOneRow and useFetchRows can load data at runtime. This can be useful when the initial data changes,
or for loading data from another table than the table of the view, or for tableless views.

Parameters of useFetchOneRow:
- tableName: the name of the table
- query: the query to fetch the row as an object
- dependencies: an array of dependencies, when one of the dependencies changes, useFetchOneRow will fetch the row again
Returns an object with:
- isLoading: boolean indicating if the data is loading
- error: string describing the error or null
- row: an object with the data of the row

useFetchRows has the same signature, but returns an array of rows instead of a single row.

Example of useFetchRows:
\`\`\`
  import React, { useState } from "react";
  import { useFetchRows } from "@saltcorn/react-lib/hooks";
  export default function App({query, tableName}) {
    const { rows, isLoading, error } = useFetchRows("persons", query || {});
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    return (
      <div>
        {rows.map((row) => (
          <div key={row.id}>
            {row.name} - {row.age}
          </div>
        ))}
      </div>
    );
  }

When you do not want to use the hooks, you can use fetchOneRow and fetchRows. fetchRows example:
\`\`\`
  import React, { useState, useEffect } from "react";
  import { fetchOneRow, fetchRows } from "@saltcorn/react-lib/api";
  export default function App({query, tableName}) {
    // load rows once
    const [rows, setRows] = useState([]);
    useEffect(() => {
      fetchRows(tableName, query).then((rows) => setRows(rows));
    }, [tableName, query]);
  }
\`\`\`
fetchRows returns an empty array if nothing was found and throws an error if something goes wrong.

fetchOneRow example:
\`\`\`
  import React, { useState, useEffect } from "react";
  import { fetchOneRow } from "@saltcorn/react-lib/api";
  export default function App({query, tableName}) {
    // load row once
    const [row, setRow] = useState(null);
    useEffect(() => {
      fetchOneRow(tableName, query).then((row) => setRow(row));
    }, [tableName, query]);
  }
\`\`\`
fetchOneRow returns null if nothing was found and throws an error if something goes wrong.

Under "@saltcorn/react-lib/api" you also find the functions insertRow, updateRow and deleteRow.
They all throw an error if something goes wrong.

Parameters of insertRow:
- tableName: the name of the table
- row: the row to insert as an object
Example:
\`\`\`
  import React, { useState } from "react";
  import { insertRow } from "@saltcorn/react-lib/api";
  export default function App({query, tableName}) {
    const [row, setRow] = useState(null);
    const handleInsert = () => {
      insertRow(tableName, row).then((row) => setRow(row));
    }
  }
\`\`\`

Parameters of updateRow:
- tableName: the name of the table
- id: the id of the row to update
- row: the row to update as an object
\`\`\`
  import React, { useState } from "react";
  import { updateRow } from "@saltcorn/react-lib/api";
  export default function App({query, tableName}) {
    const [row, setRow] = useState(null);
    const handleUpdate = () => {
      updateRow(tableName, row).then((row) => setRow(row));
    }
  }
\`\`\`

Parameters of deleteRow:
- tableName: the name of the table
- id: the id of the row to delete
Example:
\`\`\`
  import React, { useState } from "react";
  import { deleteRow } from "@saltcorn/react-lib/api";
  export default function App({query, tableName}) {
    const [row, setRow] = useState(null);
    const handleDelete = () => {
      deleteRow(tableName, row.id).then(() => setRow(null));
    }
  }
\`\`\`

`;

const escapeHtml = (unsafe) =>
  unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildAndUpdateView = async (
  user_code,
  build_mode,
  viewname,
  oldTimestamp
) => {
  const newTimestamp = new Date().valueOf();
  await handleUserCode(
    user_code,
    build_mode,
    viewname,
    oldTimestamp,
    newTimestamp
  );
  const view = View.findOne({ name: viewname });
  await View.update(
    {
      configuration: { ...(view.configuration || {}), timestamp: newTimestamp },
    },
    view.id
  );
  await getState().refresh_views();
};

module.exports = {
  buildSafeViewName,
  handleUserCode,
  buildAndUpdateView,
  escapeHtml,
  reactViewSystemPrompt,
};
