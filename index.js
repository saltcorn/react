const Workflow = require("@saltcorn/data/models/workflow");
const Plugin = require("@saltcorn/data/models/plugin");
const Form = require("@saltcorn/data/models/form");
const File = require("@saltcorn/data/models/file");
const Table = require("@saltcorn/data/models/table");
const {
  stateFieldsToWhere,
  readState,
} = require("@saltcorn/data/plugin-helper");
const { div, script } = require("@saltcorn/markup/tags");
const { getState } = require("@saltcorn/data/db/state");
const { spawn } = require("child_process");
const fs = require("fs").promises;
const db = require("@saltcorn/data/db");
const path = require("path");

const processRunner = (buildMode) => {
  const location = path.join(__dirname, "build-setup");
  return {
    runBuild: async () => {
      return new Promise((resolve, reject) => {
        const child = spawn(
          "npm",
          ["run", buildMode === "development" ? "builddev" : "build"],
          {
            cwd: location,
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
          getState().log(`child process failed: ${msg.code}`);
          reject(msg.code);
        });
      });
    },
    npmInstall: async () => {
      return new Promise((resolve, reject) => {
        const child = spawn("npm", ["install"], {
          cwd: location,
        });
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
          getState().log(`child process failed: ${msg.code}`);
          reject(msg.code);
        });
      });
    },
  };
};

/**
 *
 * @param {any} req
 * @param {string} baseDirectory
 * @param {string} buildMode
 */
const prepareDirectory = async (codeSource, codeLocation, buildMode) => {
  await fs.cp(codeLocation, path.join(__dirname, "app-code"), {
    recursive: true,
    force: true,
  });
  const runner = processRunner(buildMode);
  if ((await runner.npmInstall()) !== 0)
    throw new Error("NPM install failed, please check your Server logs");
  if ((await runner.runBuild()) !== 0)
    throw new Error("Webpack failed, please check your Server logs");
};

const configuration_workflow = () =>
  new Workflow({
    onDone: async (context) => {
      await prepareDirectory(context.build_mode, context.app_code_location);
      return context;
    },
    steps: [
      {
        name: "React plugin",
        form: async (context) =>
          new Form({
            fields: [
              {
                name: "app_code_source",
                label: "Code source",
                sublabel: "Where do you want to get your React code from?",
                type: "String",
                required: true,
                attributes: {
                  options: ["GitHub", "local"],
                },
              },
              {
                name: "app_code_location",
                label: "Code location",
                sublabel: "Please enter a local path to your React code",
                type: "String",
                required: true,
                showIf: { app_code_source: "local" },
              },
              {
                name: "app_code_location",
                label: "Code location",
                sublabel: "This is the GitHub location (not yet supported)",
                type: "String",
                required: true,
                showIf: { app_code_source: "GitHub" },
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
          }),
      },
    ],
  });

const get_state_fields = () => [];

// TODO default state, joinFields, aggregations, include_fml, exclusion_relation
const run = async (table_id, viewname, {}, state, extra) => {
  const req = extra.req;
  const query = req.query || {};
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
  return div(
    {
      "table-name": table.name,
      "view-name": viewname,
      state: encodeURIComponent(JSON.stringify(state)),
      query: encodeURIComponent(JSON.stringify(query)),
      "initial-rows": encodeURIComponent(JSON.stringify(rows)),
    },
    script({
      src: "/plugins/public/react/bundle.js",
    })
  );
};

const run_build = async (
  table_id,
  viewname,
  { app_code_source, app_code_location, build_mode },
  body,
  { req, res }
) => {
  await prepareDirectory(app_code_source, app_code_location, build_mode);
  res.json({ notify_success: "Build successful" });
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "react",
  configuration_workflow,
  action: (config) => ({
    run_build: run_build,
  }),
  viewtemplates: (cfg) => [
    {
      name: "React",
      description: "React view",
      get_state_fields,
      configuration_workflow: () => new Workflow({}),
      run,
    },
  ],
};
