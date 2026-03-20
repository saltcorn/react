const View = require("@saltcorn/data/models/view");
const Table = require("@saltcorn/data/models/table");
const User = require("@saltcorn/data/models/user");
const { a, pre, div, code } = require("@saltcorn/markup/tags");
const { getState } = require("@saltcorn/data/db/state");
const { handleUserCode, escapeHtml, reactViewSystemPrompt } = require("./common");

module.exports = (cfg) => ({
  title: "Generate React View",
  function_name: "generate_react_view",
  description: "Generate a React View",
  async json_schema() {
    const roles = await User.get_roles();
    const tables = await Table.find({});

    return {
      type: "object",
      required: ["react_code", "view_name"],
      properties: {
        react_code: {
          description: `JavaScript code that constitutes the react component.
You must include the react import at the top, and the code should export default the component.`,
          type: "string",
        },
        view_name: {
          description: `The name of the view, this should be a short name which is part of the url. `,
          type: "string",
        },
        table: {
          description: "Which table is this a view on",
          type: "string",
          enum: tables.map((t) => t.name),
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
    return reactViewSystemPrompt;
  },
  render_html({ react_code, view_name }) {
    return (
      div({ class: "mb-3" }, view_name) + pre(code(escapeHtml(react_code)))
    );
  },
  async execute({ react_code, view_name, table, view_description, min_role }) {
    const roles = await User.get_roles();
    const min_role_id = min_role
      ? roles.find((r) => r.role === min_role).id
      : 100;
    const viewCfg = {
      name: view_name,
      viewtemplate: "React",
      min_role: min_role_id,
      configuration: { build_mode: "production", user_code: react_code },
    };
    if (table) {
      const tableObj = Table.findOne({ name: table });
      if (!tableObj) throw new Error(`Table ${table} not found`);
      else viewCfg.table_id = tableObj.id;
    }
    if (view_description) viewCfg.description = view_description;
    await View.create(viewCfg);
    await getState().refresh_views();
    await handleUserCode(react_code, "production", view_name);
    return {
      postExec:
        "View created. " +
        a(
          { target: "_blank", href: `/view/${view_name}`, class: "me-1" },
          "Go to view"
        ) +
        " | " +
        a(
          {
            target: "_blank",
            href: `/viewedit/config/${view_name}`,
            class: "ms-1",
          },
          "Configure view"
        ),
    };
  },
});
