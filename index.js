const Workflow = require("@saltcorn/data/models/workflow");
const Plugin = require("@saltcorn/data/models/plugin");

const Form = require("@saltcorn/data/models/form");
const File = require("@saltcorn/data/models/file");
const { div, script } = require("@saltcorn/markup/tags");
const { getState } = require("@saltcorn/data/db/state");
const { spawn } = require("child_process");
const fs = require("fs").promises;
const db = require("@saltcorn/data/db");

const processRunner = (req, baseDirectory, buildMode) => {
  return {
    runBuild: async () => {
      const dir = await File.findOne({ filename: baseDirectory });
      const location = dir.location;
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
      const dir = await File.findOne({ filename: baseDirectory });
      const location = dir.location;
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

const resourceWriter = (req, baseDirectory, mainCode) => {
  const userId = req?.user?.id;
  const minRole = req?.user?.role_id || 100;
  return {
    writeIndexJs: async () => {
      const allFiles = await File.find({
        folder: baseDirectory,
      });
      const oldFile = allFiles.find((f) => f.filename === "index.js");
      if (oldFile) await oldFile.overwrite_contents(mainCode);
      else {
        await File.from_contents(
          "index.js",
          "application/javascript",
          mainCode,
          userId,
          minRole,
          baseDirectory
        );
      }
    },
    writePackageJson: async () => {
      await File.from_contents(
        "package.json",
        "application/json",
        JSON.stringify(
          {
            name: "saltcorn-react-view",
            version: "1.0.0",
            description: "React view",
            main: "index.js",
            scripts: {
              build: "webpack --mode production",
              builddev: "webpack --mode development",
            },
            dependencies: {
              react: "^19.0.0",
              "react-dom": "^19.0.0",
              webpack: "5.97.1",
              "webpack-cli": "6.0.1",
              "babel-loader": "^10.0.0",
              "@babel/core": "^7.26.9",
              "@babel/preset-env": "^7.26.9",
              "@babel/preset-react": "^7.26.3",
            },
          },
          null,
          2
        ),
        userId,
        minRole,
        baseDirectory
      );
    },
    writeWebpackConfig: async () => {
      await File.from_contents(
        "webpack.config.js",
        "application/javascript",
        `const path = require('path');
    module.exports = {
      entry: './index.js',
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
      },
      module: {
        rules: [
          {
            test: /.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
            },
          },
        ],
      },
    };`,
        userId,
        minRole,
        baseDirectory
      );
    },
    writeBabelRc: async () => {
      await File.from_contents(
        ".babelrc",
        "application/json",
        `{
      "presets": ["@babel/preset-env", "@babel/preset-react"]
    }`,
        userId,
        minRole,
        baseDirectory
      );
    },
  };
};

const setLastInstallDate = async (date) => {
  let plugin = await Plugin.findOne({ name: "react" });
  if (!plugin) {
    plugin = await Plugin.findOne({
      name: "@saltcorn/react",
    });
  }
  const newConfig = {
    ...(plugin.configuration || {}),
    last_install_date: date,
  };
  plugin.configuration = newConfig;
  await plugin.upsert();
  getState().processSend({
    refresh_plugin_cfg: plugin.name,
    tenant: db.getTenantSchema(),
  });
};

const getLastInstallDate = async () => {
  let plugin = await Plugin.findOne({ name: "react" });
  if (!plugin) {
    plugin = await Plugin.findOne({
      name: "@saltcorn/react",
    });
  }
  if (plugin.configuration?.last_install_date)
    return new Date(plugin.configuration.last_install_date);
  else return null;
};

const getFiles = async (baseDirectory) => {
  const allFiles = await File.find({
    folder: baseDirectory,
    hiddenFiles: true,
  });
  const pckJson = allFiles.find((f) => f.filename === "package.json");
  const webpackConfig = allFiles.find(
    (f) => f.filename === "webpack.config.js"
  );
  const babelRc = allFiles.find((f) => f.filename === ".babelrc");
  const indexJs = allFiles.find((f) => f.filename === "index.js");
  return {
    pckJson,
    webpackConfig,
    babelRc,
    indexJs,
  };
};

/**
 *
 * @param {any} req
 * @param {string} baseDirectory
 * @param {string} mainCode
 */
const prepareDirectory = async (req, baseDirectory, mainCode, buildMode) => {
  const baseDir = await File.findOne(baseDirectory);
  if (!baseDir) throw new Error("Base directory not found");
  // TODO check dir permissions
  const writer = resourceWriter(req, baseDirectory, mainCode);
  const runner = processRunner(req, baseDirectory, buildMode);
  const { pckJson, webpackConfig, babelRc } = await getFiles(baseDirectory);

  // write package.json and run npm install if needed
  let installNeeded = false;
  if (!pckJson) {
    await writer.writePackageJson();
    installNeeded = true;
  } else {
    const stats = await fs.stat(pckJson.location);
    const lastModified = stats.mtime;
    const lastInstall = await getLastInstallDate();
    if (!lastInstall || lastModified > lastInstall) installNeeded = true;
  }
  if (installNeeded) {
    if ((await runner.npmInstall()) !== 0)
      throw new Error("NPM install failed, please check your Server logs");
    else await setLastInstallDate(new Date());
  }

  if (!webpackConfig) await writer.writeWebpackConfig();
  if (!babelRc) await writer.writeBabelRc();
  await writer.writeIndexJs();
  if ((await runner.runBuild()) !== 0)
    throw new Error("Webpack failed, please check your Server logs");
};

const configuration_workflow = (req) =>
  new Workflow({
    onDone: async (context) => {
      if (context.build_base_directory)
        await prepareDirectory(
          req,
          context.base_directory,
          context.main_code,
          context.build_mode
        );
      return context;
    },
    onStepSave: async (step, ctx, formVals) => {
      // when the base_directory changes, remove the last npm install date
      if (formVals?.base_directory !== ctx.base_directory)
        await setLastInstallDate(null);
    },
    steps: [
      {
        name: "Build settings",
        form: async (context) => {
          const directories = await File.find({ isDirectory: true });
          return new Form({
            fields: [
              {
                name: "build_base_directory",
                label: "Build base directory",
                sublabel:
                  "Prepare and build your base directory (see help). " +
                  "Deselect, if you want to do this on your own.",
                type: "Bool",
                default: true,
                help: {
                  topic: "Build base directory",
                  plugin: "react",
                },
              },
              {
                name: "main_code",
                label: "Main code",
                input_type: "code",
                required: true,
                help: {
                  topic: "React main code",
                  plugin: "react",
                },
              },
              {
                name: "base_directory",
                label: "Base directory",
                sublabel: "Please select a directory for your Rect code",
                type: "String",
                required: true,
                attributes: {
                  options: directories.map((d) => d.path_to_serve),
                },
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
              {
                name: "root_element_id",
                label: "Root element id",
                sublabel:
                  "The root id for your React root element (default: root)",
                type: "String",
                default: "root",
              },
            ],
            additionalButtons: [
              {
                label: "build",
                onclick: `view_post('${context.viewname}', 'run_build', {});`,
                class: "btn btn-primary",
              },
            ],
          });
        },
      },
    ],
  });
const get_state_fields = () => [];

const run = async (
  table_id,
  viewname,
  { base_directory, root_element_id },
  state,
  extra
) => {
  return (
    div({ id: root_element_id || "root" }) +
    script({
      src: `/files/serve/${base_directory}/dist/bundle.js`,
    })
  );
};

const run_build = async (
  table_id,
  viewname,
  { main_code, base_directory, build_base_directory, build_mode },
  body,
  { req, res }
) => {
  if (build_base_directory) {
    await prepareDirectory(req, base_directory, main_code, build_mode);
    res.json({ notify_success: "Build successful" });
  } else res.json({ error: "'Build base directory' is deactivated" });
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "react",
  viewtemplates: [
    {
      name: "React",
      description: "React view",
      get_state_fields,
      configuration_workflow,
      run,
      routes: { run_build },
    },
  ],
};
