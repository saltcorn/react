const View = require("@saltcorn/data/models/view");
const Table = require("@saltcorn/data/models/table");
const User = require("@saltcorn/data/models/user");

module.export = (cfg) => ({
  title: "Generate React View",
  function_name: "generate_react_view",
  description: "Generate React View",
  async json_schema() {
    const roles = await User.get_roles();

    return {
      type: "object",
      required: ["react_code", "view_name"],
      properties: {
        react_code: {
          description: "JavaScript code that constitutes the react component",
          type: "string",
        },
        view_name: {
          description: `The name of the view, this should be a short name which is part of the url. `,
          type: "string",
        },
        view_description: {
          description: "A description of the purpose of the view.",
          type: "string",
        },
        min_role: {
          description:
            "The minimum role needed to access the view. For vies accessible only by admin, use 'admin', pages with min_role 'public' is publicly accessible and also available to all users",
          type: "string",
          enum: roles.map((r) => r.role),
        },
      },
    };
  },
  system_prompt() {
    return `Use the generate_react_view tool to generate a react view. Here is an example of a 
valid generated react code:
    
\`\`\`import React from "react";

export default function App({}) {
  return <h1>Hello world</h1>;
}
\`\`\`

You must include the react import, and your generated code should export default the component.`;
  },
  render_html({ react_code, view_name }) {
    return div({ class: "mb-3" }, view_name) + pre(code(react_code));
  },
  async execute({ react_code, view_name, view_description, min_role }) {
    const name = view_name;
    const roles = await User.get_roles();
    const min_role_id = roles.find((r) => r.role === min_role).id;
    const viewCfg = {
      name: view_name,
      viewtemplate: "React",
      min_role: min_role_id,
      configuration: { build_mode: "production", user_code: react_code },
    };
    await View.create(viewCfg);
    return {
      postExec:
        "View created. " +
        a(
          { target: "_blank", href: `/view/${name}`, class: "me-1" },
          "Go to view"
        ) +
        " | " +
        a(
          {
            target: "_blank",
            href: `/viewedit/config/${name}`,
            class: "ms-1",
          },
          "Configure view"
        ),
    };
  },
});
