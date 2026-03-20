const View = require("@saltcorn/data/models/view");
const Table = require("@saltcorn/data/models/table");
const User = require("@saltcorn/data/models/user");
const { a, pre, div, code } = require("@saltcorn/markup/tags");
const {
  buildAndUpdateView,
  escapeHtml,
  reactViewSystemPrompt,
} = require("./common");

class GenerateReactViewSkill {
  static skill_name = "Generate React View";

  get skill_label() {
    return "React View";
  }

  constructor(cfg) {
    Object.assign(this, cfg);
  }

  static async configFields() {
    return [];
  }

  async systemPrompt() {
    const roles = await User.get_roles();
    const tables = await Table.find({});

    const tableList = tables.map((t) => t.name).join(", ");
    const roleList = roles.map((r) => r.role).join(", ");

    return (
      reactViewSystemPrompt +
      `Available tables: ${tableList || "none"}
Available roles (for min_role): ${roleList}
`
    );
  }

  provideTools() {
    return [
      {
        type: "function",
        renderToolCall({ view_name, react_code }) {
          return (
            div({ class: "mb-3" }, view_name) +
            pre(code(escapeHtml(react_code)))
          );
        },
        process: async ({
          react_code,
          view_name,
          table,
          view_description,
          min_role,
        }) => {
          const roles = await User.get_roles();
          const min_role_id = min_role
            ? roles.find((r) => r.role === min_role)?.id ?? 100
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
            viewCfg.table_id = tableObj.id;
          }
          if (view_description) viewCfg.description = view_description;
          await View.create(viewCfg);
          await buildAndUpdateView(react_code, "production", view_name);
          return { view_name };
        },
        renderToolResponse: async ({ view_name }) => {
          return (
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
            )
          );
        },
        function: {
          name: "generate_react_view",
          description: "Generate and create a React View in Saltcorn",
          parameters: {
            type: "object",
            required: ["react_code", "view_name"],
            properties: {
              react_code: {
                description: `JavaScript code that constitutes the react component.
You must include the react import at the top, and the code should export default the component.`,
                type: "string",
              },
              view_name: {
                description: `The name of the view, this should be a short name which is part of the url.`,
                type: "string",
              },
              table: {
                description:
                  "Which table is this a view on (optional, omit for tableless views)",
                type: "string",
              },
              view_description: {
                description: "A description of the purpose of the view.",
                type: "string",
              },
              min_role: {
                description:
                  "The minimum role needed to access the view. Use 'admin' for admin-only, 'public' for publicly accessible.",
                type: "string",
              },
            },
          },
        },
      },
    ];
  }
}

module.exports = GenerateReactViewSkill;
