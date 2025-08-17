const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const Table = require("@saltcorn/data/models/table");
const View = require("@saltcorn/data/models/view");
const { div } = require("@saltcorn/markup/tags");
const {
  stateFieldsToWhere,
  readState,
} = require("@saltcorn/data/plugin-helper");
const { handleUserCode, buildSafeViewName } = require("./common");
const { getState } = require("@saltcorn/data/db/state");

const get_state_fields = () => [];

const defaultUserCode = (tableId) => {
  return `import React from "react";

export default function App({ viewName, query${
    tableId ? ", state, tableName, rows" : " "
  } }) {
  return <h3>Please write your React code here</h3>;
};
`;
};

// TODO default state, joinFields, aggregations, include_fml, exclusion_relation
const run = async (table_id, viewname, { timestamp }, state, extra) => {
  const req = extra.req;
  const query = req.query || {};
  const props = {
    "view-name": buildSafeViewName(viewname),
    query: encodeURIComponent(JSON.stringify(query)),
    user: encodeURIComponent(JSON.stringify(req.user || {})),
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
    const rows = await table.getRows(where, {
      forUser: req.user,
      forPublic: !req.user,
    });
    readState(state, fields, req);
    props["table-name"] = table.name;
    props.state = encodeURIComponent(JSON.stringify(state));
    props.rows = encodeURIComponent(JSON.stringify(rows));
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
        newTimestamp,
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

const build_user_code = async (
  table_id,
  viewname,
  { user_code, build_mode, timestamp },
  {},
  { req },
) => {
  try {
    const state = getState();
    const newTimestamp = new Date().valueOf();
    await handleUserCode(
      user_code || defaultUserCode(table_id),
      build_mode,
      viewname,
      timestamp,
      newTimestamp,
    );
    const view = View.findOne({ name: viewname });
    const newCfg = {
      configuration: {
        ...(view.configuration || {}),
        timestamp: newTimestamp,
      },
    };
    await View.update(newCfg, view.id);
    await state.refresh_views();
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
  table_optional: true,
};
