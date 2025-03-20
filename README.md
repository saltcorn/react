# React

Plugin to integrate React components in your Saltcorn application.

# Example to get started

1. Create a directory for your React code (**my_react_code** for example)
2. In **my_react_code**, create an App.js file with the following content:

```javascript
import React from "react";

export default function App({ tableName, viewName }) {
  return (
    <div>
      <h1>{viewName}</h1>
      <p>Table name: {tableName}</p>
    </div>
  );
}
```

3. Open the plugin configuration, set **Code source** to **Saltcorn folder**, and in the input below, select **my_react_code** <br>(if the correct directory was already selected, select another one and then choose **my_react_code** again to trigger a save).
4. Click build or finish.
5. Create a view with the React view pattern (the view table is less important for now). <br> When you open it, it renders the output from App.js.

When everything went well, you now have a bundle.js of your React code in the public folder of **@saltcorn/react**. Only one bundle can exist, and you decide at runtime what to display for `{tablename, viewname}`.

The component also has access to **state**, **query** and **rows**:

```javascript
export default function App({ tableName, viewName, state, query, rows })
```

# Plugin configuration

The plugin configuration has the following options:

- **Code source**: Describes the source type where you get your React code from. The options are:
  - **Saltcorn folder**: The React code is in a folder in the Saltcorn directory. The folder is selected in the input below.
  - **GitHub**: To get the code from a GitHub repository. To use https://github.com/christianhugoch/react-view-example, enter **christianhugoch/react-view-example** in the **GitHub repository name** input.
  - **Local**: To get the code from a folder on your local server filesystem (**Path to code** input).
- **Build mode**: Build your bundle.js for development or production. Use development for debugging and production for minified deployment code.
- **Provide your own bundle**: You can either provide your React code as shown in the example above and let the system bundle it, or supply your own bundle.js file. The file must be located in a **dist** folder within your **Code source** location. Additionally, please use React version 19 and expose an `App` component in the global scope. Example:

```javascript
import React from "react";

function App({ tableName, viewName, state, query, rows }) { ... }

window.App = App;
```

- **Run ESLint**: You can run ESLint on your code before building the bundle. If activated and there are any ESLint errors, the build fails. (only available if **Provide your own bundle** is not selected)

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
