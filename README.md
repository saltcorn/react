# react

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

The component also has access to **state**, **query** and **initialRows**:

```javascript
export default function App({ tableName, viewName, state, query, initialRows })
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

function App({ tableName, viewName, state, query, initialRows }) { ... }

window.App = App;
```

- **Run ESLint**: You can run ESLint on your code before building the bundle. If activated and there are any ESLint errors, the build fails. (only available if **Provide your own bundle** is not selected)

# react-lib

wip
