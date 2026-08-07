const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const Table = require("@saltcorn/data/models/table");
const View = require("@saltcorn/data/models/view");
const { features } = require("@saltcorn/data/db/state");
const { div } = require("@saltcorn/markup/tags");
const {
  stateFieldsToWhere,
  stateFieldsToQuery,
  readState,
} = require("@saltcorn/data/plugin-helper");
const { hashState } = require("@saltcorn/data/utils");
const {
  buildSafeViewName,
  buildAndUpdateView,
  handleUserCode,
  reactViewSystemPrompt,
} = require("./common");

const get_state_fields = () => [];

const defaultUserCode = (tableId) => {
  return `import React from "react";

export default function App({ viewName, query, state${
    tableId ? ", tableName, rows" : ""
  } }) {
  return <h3>Please write your React code here</h3>;
};
`;
};

// TODO default state, joinFields, aggregations, include_fml, exclusion_relation
const run = async (table_id, viewname, { timestamp }, state, extra) => {
  const req = extra.req;
  const query = req.query || {};
  const stateHash = hashState(state, viewname);
  const props = {
    "view-name": buildSafeViewName(viewname),
    query: encodeURIComponent(JSON.stringify(query)),
    user: encodeURIComponent(JSON.stringify(req.user || {})),
    "state-hash": stateHash,
    state: encodeURIComponent(JSON.stringify(state)),
  };
  if (table_id) {
    // with table
    const table = Table.findOne(table_id);
    const fields = table.getFields();
    const where = stateFieldsToWhere({
      fields,
      state,
      table,
      prefix: "a.",
    });
    const q = stateFieldsToQuery({ state, fields, stateHash });
    const rows = await table.getRows(where, {
      ...q,
      forUser: req.user,
      forPublic: !req.user,
    });
    const totalCount = q.limit ? await table.countRows(where) : undefined;
    readState(state, fields, req);
    props["table-name"] = table.name;
    props.rows = encodeURIComponent(JSON.stringify(rows));
    if (totalCount !== undefined) props["total-count"] = String(totalCount);
  }
  return div({
    class: "_sc_react-view",
    ...props,
    ...(timestamp ? { timestamp } : {}),
  });
};

const configuration_workflow = () =>
  new Workflow({
    onDone: async (context) => {
      const newTimestamp = new Date().valueOf();
      await handleUserCode(
        context.user_code || defaultUserCode(context.table_id),
        context.build_mode,
        context.viewname,
        context.timestamp,
        newTimestamp
      );
      context.timestamp = newTimestamp;
      return context;
    },
    steps: [
      {
        name: "User code",
        disablePreview: true,
        form: async (context) => {
          const userCodeUndefined = context?.user_code === undefined;
          return new Form({
            fields: [
              {
                name: "user_code",
                label: "User code",
                input_type: "code",
                required: true,
                attributes: { mode: "application/javascript" },
              },
              {
                name: "build_mode",
                label: "Build mode",
                sublabel: "Bundle your code for production or development",
                type: "String",
                required: true,
                default: "production",
                attributes: {
                  options: ["production", "development"],
                },
              },
            ],
            additionalButtons: [
              {
                id: "build_view_btn_id",
                label: "Build",
                onclick:
                  `view_post('${context.viewname}', 'build_user_code', {}, () => { ` +
                  `setTimeout(() => { restore_old_button('build_view_btn_id'); }, 50); }); ` +
                  "press_store_button(this, true);",
                class: "btn btn-primary",
              },
            ],
            ...(userCodeUndefined
              ? {
                  values: {
                    user_code: defaultUserCode(context?.table_id),
                  },
                }
              : {}),
          });
        },
      },
    ],
  });

// Only admins may rebuild a view's user-code bundle. Uses the centralized
// authorize_view hook when the running core supports it (features.authorize_access_hooks),
// falling back to a plain role check on older cores.
const isBuildUserCodeAuthorized = async (viewname, req) => {
  if (features?.authorize_access_hooks) {
    const view = await View.findOne({ name: viewname });
    return !!(
      view &&
      (await view.authorize(req.user, {
        action: "post",
        route: "build_user_code",
        req,
        body: {},
      }))
    );
  }
  return !!(req.user && req.user.role_id <= 1);
};

const build_user_code = async (
  table_id,
  viewname,
  { user_code, build_mode, timestamp },
  {},
  { req }
) => {
  if (!(await isBuildUserCodeAuthorized(viewname, req))) {
    return { json: { error: "Not authorized" } };
  }
  try {
    await buildAndUpdateView(
      user_code || defaultUserCode(table_id),
      build_mode,
      viewname,
      timestamp
    );
    return { json: { notify_success: "Build successful" } };
  } catch (e) {
    return { json: { error: e.message || "An error occured" } };
  }
};

module.exports = {
  name: "React",
  description: "React view",
  get_state_fields,
  configuration_workflow,
  run,
  routes: { build_user_code },
  copilot_generate_view_prompt: async () => reactViewSystemPrompt,
  copilot_post_create: async ({ name, configuration }) => {
    await buildAndUpdateView(
      configuration.user_code || defaultUserCode(configuration.table_id),
      configuration.build_mode || "production",
      name
    );
  },
  table_optional: true,
};
