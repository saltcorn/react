const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const Table = require("@saltcorn/data/models/table");
const { div, script } = require("@saltcorn/markup/tags");
const { getState } = require("@saltcorn/data/db/state");
const {
  stateFieldsToWhere,
  readState,
} = require("@saltcorn/data/plugin-helper");

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises;

const userCodeFile = "App.js";

const buildViewBundle = async (buildMode, viewName) => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npm",
      [
        "run",
        buildMode === "development" ? "build_view_dev" : "build_view",
        "--",
        "--env",
        `bundle_name=${viewName}_bundle.js`,
        "--env",
        `user_code_file=${userCodeFile}`,
        "--env",
        `federation_name=${viewName}`,
      ],
      {
        cwd: __dirname,
      }
    );
    child.stdout.on("data", (data) => {
      getState().log(5, data.toString());
    });
    child.stderr?.on("data", (data) => {
      getState().log(2, data.toString());
    });
    child.on("exit", function (code, signal) {
      getState().log(5, `child process exited with code ${code}`);
      resolve(code);
    });
    child.on("error", (msg) => {
      getState().log(2, `child process failed: ${msg.code}`);
      reject(msg.code);
    });
  });
};

const handleUserCode = async (userCode, buildMode, viewName) => {
  const userCodeDir = path.join(__dirname, "user-code");
  await fs.writeFile(path.join(userCodeDir, userCodeFile), userCode, "utf8");
  if ((await buildViewBundle(buildMode, viewName)) !== 0) {
    throw new Error("Build failed please check your server logs");
  }
};

const get_state_fields = () => [];

// TODO default state, joinFields, aggregations, include_fml, exclusion_relation
const run = async (table_id, viewname, {}, state, extra) => {
  const req = extra.req;
  const query = req.query || {};
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
    return div({
      class: "_sc_react-view",
      "table-name": table.name,
      "view-name": viewname,
      state: encodeURIComponent(JSON.stringify(state)),
      query: encodeURIComponent(JSON.stringify(query)),
      rows: encodeURIComponent(JSON.stringify(rows)),
    });
  } else {
    // tableless
    return div({
      class: "_sc_react-view",
      "view-name": viewname,
      query: encodeURIComponent(JSON.stringify(query)),
    });
  }
};

const configuration_workflow = () =>
  new Workflow({
    onDone: async (context) => {
      await handleUserCode(
        context.user_code,
        context.build_mode,
        context.viewname
      );
      return context;
    },
    steps: [
      {
        name: "User code",
        form: async (context) => {
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
          });
        },
      },
    ],
  });

const build_user_code = async (
  table_id,
  viewname,
  { user_code, build_mode },
  {},
  { req }
) => {
  try {
    await handleUserCode(user_code, build_mode, viewname);
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
