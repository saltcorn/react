# React

Plugin to integrate React components in your Saltcorn application.

# Example to get started

In this example, you will create two bundle.js files: A global **main-bundle** containing React and your own components, and a second **view-bundle** with shared access to the main file.

### Main bundle

1. Create a directory on your server file system or use the Saltcorn files manager, call it **getting-started-lib**.
2. In getting-started-lib, create a package.json and an index.js file:

```json
{
  "name": "getting-started-lib",
  "version": "0.0.1",
  "description": "Basic components lib",
  "main": "index.js",
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

```javascript
import React from "react";

function PersonsList({ rows }) {
  return (
    <div>
      {rows && rows.length
        ? rows.map((row) => {
            return Object.entries(row).map(([key, value]) => (
              <div key={key}>
                <h3>
                  {key}: {value}
                </h3>
              </div>
            ));
          })
        : "No data available"}
    </div>
  );
}

export const components = {
  PersonsList,
};
```

3. Install the react plugin and open the plugin configuration.
4. Depending on step 1, set Code source to **local** or **Saltcorn folder** and select or enter the directory with the package.json and index.js file.
5. Set the **Build mode** to **development** and click build or Finish.
   <br/>When everything went well, you now have a global main bundle with React and your getting-started-lib.

### View bundle

6. Create a view with the React Pattern, select any table and call the view **gettingStartedView** <br />(Please don't use white spaces or other special characters).
7. In the view configuration, enter this user code:

```javascript
import React from "react";
const { PersonsList } = reactUserLib.components;

export default function App({ rows }) {
  return <PersonsList rows={rows} />;
}
```

and click Build or Finish.

8. Open the view, and you should see a simple listing of your rows.

The component also has access to **state**, **query**, **rows** and the current **user**:

```javascript
export default function App({ tableName, viewName, state, query, rows, user, stateHash, totalCount })
```

- `stateHash` — short hash for this view's state context, used to construct pagination/sort URL params
- `totalCount` — total number of matching rows (only set when a pagesize is active), useful for "page X of Y"

For tableless react-views, only the following properties are available:

```javascript
export default function App({ viewName, query, state, user, stateHash })
```

### Define everything in the view

The above example has `PersonsList` in the main bundle, and the view only uses the component. This makes the component reusable, and you can edit it with your favorite IDE. But you don't have to split it, you could also write everything in the views user-code, and if you want, set **Code source** to **Not set** in the plugin configuration.

The view code would look like this:

```javascript
import React from "react";

export default function App({ rows }) {
  return (
    <div>
      {rows && rows.length
        ? rows.map((row) => {
            return Object.entries(row).map(([key, value]) => (
              <div key={key}>
                <h3>
                  {key}: {value}
                </h3>
              </div>
            ));
          })
        : "No data available"}
    </div>
  );
}
```

# Plugin configuration

The plugin configuration has the following options:

- **Code source**: Describes the source type where you get your React code from. The options are:
  - **Saltcorn folder**: The React code is in a folder in the Saltcorn directory. The folder is selected in the input below.
  - **Local**: To get the code from a folder on your local server file system (**Path to code** input).
  - **Not set**: No code source is set. You define the code completely in the view configuration.
- **Build mode**: Build your bundle.js for development or production. Use development for debugging and production for minified deployment code. The size of the main bundle changes significantly, please avoid **development** in production.

## CSS files & images

To integrate CSS files or images, put them into the project referenced by **Code source** and use the import Syntax. For example:

```javascript
import "../resources/persons_list.css";
import bannerImage from "../resources/banner.png";

export default function PersonsList({ ... }) {
  ...
}
```

## Act as a Filter

A Saltcorn Filter modifies the query of the browser window, for example, with the value from an input. To mimic this, you can create a component with an input field and call `set_state_field` on change (or onblur if you don't want to change it on every keystroke):

```javascript
import React from "react";

export default function App({ viewName, query }) {
  return (
    <div>
      <label htmlFor="nameFilter">Filter by Name:</label>
      <input
        type="text"
        id="nameFilter"
        value={query.name || ""}
        onChange={(e) => {
          set_state_field("name", e.target.value, e);
        }}
      />
    </div>
  );
}
```

You also could set the initial value, with a value from `query` (if there's a matching value).

# react-lib

The system gives you access to [**react-lib**](https://github.com/saltcorn/react-lib). This is a module with hooks, functions and components to interact with the Saltcorn system. To use it, add it as peerDependency in your components-lib.<br>
The following examples are basic, more complete code can be found [here](https://github.com/saltcorn/react/tree/main/examples).

## Read rows

To fetch multiple rows, you can use this structure:

```javascript
import { useFetchRows } from "@saltcorn/react-lib/hooks";

export default function App({ tableName, viewName, state, query }) {
  const { rows, isLoading, error } = useFetchRows(tableName, query);
  return <div>
    {rows && rows.map((row) => (
        ...
    ))}
    {error && <p>Error: {error}</p>}
  </div>
}

```

For only one row:

```javascript
import React from "react";
import { useFetchOneRow } from "@saltcorn/react-lib/hooks";

export default function App({ tableName, viewName, state, query }) {
  const { row, isLoading, error } = useFetchOneRow(tableName, query);
  return <div>...</div>;
}
```

If you don't need hooks:

```javascript
import { fetchRows, fetchOneRow } from "@saltcorn/react-lib/api";
```

### Count rows

```javascript
import React from "react";
import { useCountRows } from "@saltcorn/react-lib/hooks";

export default function App({ viewName, query }) {
  const { count, isCounting, error } = useCountRows("users");

  return (
    <div>
      <h3>
        Row count for users:{" "}
        {isCounting ? "Count..." : error ? "Error fetching data" : count}
      </h3>
    </div>
  );
}
```

Or without hooks:

```javascript
import { countRows } from "@saltcorn/react-lib/api";
```

## Modify rows

To insert, update or delete rows, take a look at this basic examples:

### Insert row

```javascript
import React from "react";
import { insertRow } from "@saltcorn/react-lib/api";

export default function App({ tableName, viewName, state, query }) {
  return (
    <button onClick={() => insertRow(tableName, { name: "John Doe", age: 30 })}>
      Insert row
    </button>
  );
}
```

### Update row

```javascript
import React from "react";
import { updateRow } from "@saltcorn/react-lib/api";

export default function App({ tableName, viewName, state, query }) {
  return (
    <button
      onClick={() => updateRow(tableName, 1, { name: "Jane Doe", age: 31 })}
    >
      Update row
    </button>
  );
}
```

### Delete row

```javascript
import React from "react";
import { deleteRow } from "@saltcorn/react-lib/api";

export default function App({ tableName, viewName, state, query }) {
  return <button onClick={() => deleteRow(tableName, 1)}>Delete row</button>;
}
```

## Run Saltcorn Actions

Use the `runAction` function to trigger Saltcorn actions:

```javascript
import React from "react";
import { runAction } from "@saltcorn/react-lib/api";

export default function App({}) {
  return <button onClick={() => runAction("my_action")}>Run action</button>;
}
```

You'll need a trigger named **my_action** with the When condition **Api call**. `runAction` is asynchronous, and data returned from the run will be set it in the response. The following example uses **run_sql_query** from the [sql](https://github.com/saltcorn/sql) plugin to query all existing users:

```javascript
import React, { useState } from "react";
import { runAction } from "@saltcorn/react-lib/api";

export default function App({ viewName, query }) {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await runAction("select_all_users");
      setUsers(response);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  return (
    <div className="container mt-5">
      <button className="btn btn-primary mb-3" onClick={fetchUsers}>
        Fetch Users
      </button>

      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={index}>
                <td>{user.id}</td>
                <td>{user.email}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

For this, you need a trigger named **select_all_users** with the **Api call** condition, and the action should be **run_sql_query**. In **select_all_users** you can use

`SELECT id, name FROM users;`

### Actions with row

For actions that need a row, call `runAction` like this:

```javascript
await runAction(actionName, row);
```

For example, to count all users that have a specific email ending, you could write this **run_sql_query** trigger:

```sql
SELECT COUNT(*) AS num_endings
FROM users
WHERE email LIKE '%' || $1;
```

Name it **count_email_endings** and set 'Row parameters' to **email_ending**.

With this, you could write a view that takes the ending from an input field and calls the action:

```javascript
import React, { useState } from "react";
import { runAction } from "@saltcorn/react-lib/api";

export default function App({ viewName, query }) {
  const [userCount, setUserCount] = useState(null);
  const [emailEnding, setEmailEnding] = useState("");

  const countUsers = async () => {
    try {
      const response = await runAction("count_email_endings", {
        email_ending: emailEnding,
      });
      setUserCount(response[0]?.num_endings);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter email ending (e.g., gmail.com)"
          value={emailEnding}
          onChange={(e) => setEmailEnding(e.target.value)}
        />
      </div>
      <button className="btn btn-primary mb-3" onClick={countUsers}>
        Fetch Users
      </button>

      {userCount !== null && (
        <div className="alert alert-info">Total Users: {userCount}</div>
      )}
    </div>
  );
}
```


## Components

### ScView

The ScView component allows using normal Saltcorn views in your React component. The following example shows how to use the **list_persons** list-view:

```javascript
import React from "react";
import { ScView } from "@saltcorn/react-lib/components";

export default function App({ viewName, query }) {
  return (
    <div>
      <ScView name="list_persons" query={query} />
    </div>
  );
}
```

## Controlling embedded multi-row views via URL state

A React view can embed and control other Saltcorn views that display multiple rows by reading and writing URL state. When URL state changes via pjax, Saltcorn re-renders the affected views and passes the updated `state` prop to your React component.

> **Note:** Currently only **List** and **Feed** view templates are supported — they expose the pagination metadata that `useManyView` depends on.

Embedded views use URL params prefixed with a short hash unique to each view instance:

| Param | Effect |
|---|---|
| `_${hash}_page` | Current page (1-based) |
| `_${hash}_pagesize` | Rows per page |
| `_${hash}_sortby` | Field name to sort by |
| `_${hash}_sortdesc` | `"on"` for descending order |

Use `set_state_field(key, value)` to update a single param, or `set_state_fields({...})` to update several at once so they land in a single navigation step.

**Full example**

A tableless React controller view that embeds `"persons_feed"` (a **Feed** view — a **List** view works identically) and controls its pagination and sorting. It extracts the server-computed hash from the embedded view on first load, then keeps it in sync with URL state on every pjax navigation.

```javascript
import React from "react";
import { useManyView } from "@saltcorn/react-lib/hooks";
import { ScView } from "@saltcorn/react-lib/components";

export default function App({ state }) {
  const { hash, page, hasNext, ready, viewProps } = useManyView("persons_feed", state);

  if (!ready) return null;

  const sortBy   = state[`_${hash}_sortby`]   || "";
  const sortDesc = !!state[`_${hash}_sortdesc`];

  const setPage = (n) => set_state_field(`_${hash}_page`, n);
  const setSort = (field) => {
    const newDesc = sortBy === field ? (sortDesc ? "" : "on") : "";
    set_state_fields({ [`_${hash}_sortby`]: field, [`_${hash}_sortdesc`]: newDesc });
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 p-2 bg-light rounded">
        <span className="text-muted small">Sort:</span>
        {["first_name", "last_name"].map((f) => (
          <button key={f}
            className={`btn btn-sm ${sortBy === f ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setSort(f)}>
            {f}{sortBy === f ? (sortDesc ? " ▼" : " ▲") : ""}
          </button>
        ))}
        <div className="vr" />
        <button className="btn btn-sm btn-outline-secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}>‹ Prev</button>
        <span className="small">Page {page}</span>
        <button className="btn btn-sm btn-outline-secondary"
          disabled={!hasNext}
          onClick={() => setPage(page + 1)}>Next ›</button>
      </div>
      {/* Hide the feed's built-in paginator — we provide our own above */}
      <style>{`.sc-feed-wrapper ul.pagination { display: none !important; }`}</style>
      <ScView {...viewProps} className="sc-feed-wrapper" />
    </div>
  );
}
```

# Copilot

The Saltcorn copilot can generate react-views. Only views where all the code is stored within the view are possible, an action to change the main bundle does not exist yet. When the chat only gives you the code without a button to apply it, try to be more explicit (for example, it could be that the model still needs to know the min_role).

## Setup

To make the **Generate React View** tool available in the Saltcorn Copilot:

1. Make sure **Agents** is installed.
2. Go to **Actions** and create a new Trigger with the **Agent** action.
3. In the configuration, add **Generate React View** to the skill list.
4. Open the **Saltcorn Copilot** trigger configuration, click the add button and select your **Generate React View** trigger.
