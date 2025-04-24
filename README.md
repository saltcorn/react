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
export default function App({ tableName, viewName, state, query, rows, user })
```

For tableless react-views, only the following properties are available:

```javascript
export default function App({ viewName, query, user })
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

The system gives you access to [**react-lib**](https://github.com/saltcorn/react-lib). This is a module with hooks and functions to interact with the Saltcorn system. To use it, add it as peerDependency in your components-lib.<br>
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

## Modify rows

To insert, update or delete rows, take a look at this basic examples:

### Insert row

```javascript
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
import { deleteRow } from "@saltcorn/react-lib/api";

export default function App({ tableName, viewName, state, query }) {
  return <button onClick={() => deleteRow(tableName, 1)}>Delete row</button>;
}
```
