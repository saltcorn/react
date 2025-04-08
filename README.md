# React

Plugin to integrate React components in your Saltcorn application.

# Example to get started

1. Install the plugin, open the configuration and set **Code source** to **Not set**.
2. Click build or finish.
3. Create a view (**myReactView**) with the React view pattern (the view table is less important for now).
4. In the view configuration, write your React code in the editor. <br> For example:

```javascript
import React from "react";

default function App({ tableName, viewName }) {
  return (
    <div>
      <h1>{viewName}</h1>
      <p>Table name: {tableName}</p>
    </div>
  );
}
window.react_views.myReactView = App;
```

Please make sure to export `App` in `window.react_views` with the name of your view.

5. Click build or finish.

When everything went well, you now have a global main bundle and a view specific bundle of your React code in the public folder of **@saltcorn/react**.

The component also has access to **state**, **query** and **rows**:

```javascript
export default function App({ tableName, viewName, state, query, rows })
```

# Plugin configuration

The plugin configuration has the following options:

- **Code source**: Describes the source type where you get your React code from. The options are:
  - **Saltcorn folder**: The React code is in a folder in the Saltcorn directory. The folder is selected in the input below.
  - **Local**: To get the code from a folder on your local server filesystem (**Path to code** input).
  - **Not set**: No code source is set. You define the code completely in the view configuration.
- **Build mode**: Build your bundle.js for development or production. Use development for debugging and production for minified deployment code.

# react-lib

The system gives you access to [**react-lib**](https://github.com/saltcorn/react-lib). This is a module with hooks and functions to interact with the Saltcorn system. <br>
The following examples are basic, more complete code can be found [here](https://github.com/saltcorn/react/tree/main/examples).

Note: If you provide your own bundle, you need to integrate **react-lib** yourself.

## Read rows

To fetch multiple rows, you can use this structure:

```javascript
import { useFetchRows } from "@saltcorn/react-lib/hooks";

export default function App({ tableName, viewName, state, query }) {
  const { rows, error } = useFetchRows(tableName, query);
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
  const { row, error } = useFetchOneRow(tableName, query);
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
