# react

Plugin to integrate React components in your Saltcorn application.

# Example to get started

1. Create a directory for your react code ('my_react_code' for example)
2. In 'my_react_code', create an App.js file with the following content:

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

3. Create a view with the React view pattern (the view table is less important for now)
4. Select 'my_react_code' as Base directory (if the correct directory was already selected, select another one and then select 'my_react_code' again to trigger a save)
5. Click build or finish (the first build takes a little bit longer than following builds)

The component has also access to the properties state, query and initialRows:

```javascript
export default function App({ tableName, viewName, state, query, initialRows })
```
