const Workflow = require("@saltcorn/data/models/workflow");
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
const { createWriteStream } = require("fs");
const db = require("@saltcorn/data/db");
const path = require("path");
const { get } = require("https");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { extract } = require("tar");

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

const loadFromGitHub = async (repoName, targetDir) => {
  const tarballUrl = `https://api.github.com/repos/${repoName}/tarball`;
  const fileName = repoName.split("/").pop();
  const filePath = await loadTarball(tarballUrl, fileName);
  await extractTarball(filePath, targetDir);
  await fs.rm(filePath);
};

// taken from 'plugins-loader/download_utils.js'
const getFetchProxyOptions = () => {
  if (process.env["HTTPS_PROXY"]) {
    const agent = new HttpsProxyAgent(process.env["HTTPS_PROXY"]);
    return { agent };
  } else return {};
};

// taken from 'plugins-loader/download_utils.js'
const extractTarball = async (tarFile, destination) => {
  await extract({
    file: tarFile,
    cwd: destination,
    strip: 1,
  });
};

// mostly copied from 'plugins-loader/download_utils.js'
// unify and move to data module ?
const loadTarball = (url, name) => {
  const options = {
    headers: {
      "User-Agent": "request",
    },
    ...getFetchProxyOptions(),
  };
  const writeTarball = async (res) => {
    const filePath = path.join(__dirname, `${name}.tar.gz`);
    const stream = createWriteStream(filePath);
    res.pipe(stream);
    return new Promise((resolve, reject) => {
      stream.on("finish", () => {
        stream.close();
        resolve(filePath);
      });
      stream.on("error", (err) => {
        stream.close();
        reject(err);
      });
    });
  };

  return new Promise((resolve, reject) => {
    get(url, options, (res) => {
      if (res.statusCode === 302) {
        get(res.headers.location, options, async (redirect) => {
          if (redirect.statusCode === 200) {
            const filePath = await writeTarball(redirect);
            resolve(filePath);
          } else
            reject(
              new Error(
                `Error downloading tarball from ${url}: http code ${redirect.statusCode}`
              )
            );
        });
      }
    });
  });
};

const emptyDirectory = async (directoryPath) => {
  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      await fs.rm(filePath, { recursive: true, force: true });
    }
  } catch (error) {
    getState().log(5, `Error emptying directory: ${error.message}`);
  }
};

const exists = async (directoryPath) => {
  try {
    await fs.access(directoryPath);
    return true;
  } catch (error) {
    return false;
  }
};

const prepareDirectory = async (
  codeSource,
  codeLocation,
  buildMode,
  provideBundle
) => {
  const userCodeDir = path.join(__dirname, "app-code");
  await emptyDirectory(userCodeDir);

  // load the user code
  switch (codeSource) {
    case "GitHub":
      await loadFromGitHub(codeLocation, userCodeDir);
      break;
    case "local":
      if (!(await exists(codeLocation)))
        throw new Error(`Local directory ${codeLocation} not found`);
      await fs.cp(codeLocation, userCodeDir, {
        recursive: true,
        force: true,
      });
      break;
    case "sc_folder":
      const folder = await File.findOne(codeLocation);
      if (!folder)
        throw new Error(`Folder ${codeLocation} not found in Saltcorn folders`);
      await fs.cp(folder.location, userCodeDir, {
        recursive: true,
        force: true,
      });
      break;
    default:
      throw new Error("Unknown code source");
  }

  // validate userCodeDir
  if (!provideBundle) {
    if (!(await exists(path.join(userCodeDir, "App.js"))))
      throw new Error("App.js not found in user code directory");
  } else {
    if (!(await exists(path.join(userCodeDir, "dist", "bundle.js"))))
      throw new Error("Bundle.js not found in user code directory");
  }

  // build or copy the bundle file
  if (!provideBundle) {
    const runner = processRunner(buildMode);
    if ((await runner.npmInstall()) !== 0)
      throw new Error("NPM install failed, please check your Server logs");
    if ((await runner.runBuild()) !== 0)
      throw new Error("Webpack failed, please check your Server logs");
  } else
    await fs.cp(
      path.join(userCodeDir, "dist", "bundle.js"),
      path.join(__dirname, "public", "bundle.js"),
      {
        force: true,
      }
    );
};

const configuration_workflow = () =>
  new Workflow({
    onDone: async (context) => {
      const {
        app_code_source,
        app_code_path,
        app_code_repo,
        sc_folder,
        build_mode,
        provide_bundle,
      } = context;
      await prepareDirectory(
        app_code_source,
        app_code_source === "local"
          ? app_code_path
          : app_code_source === "GitHub"
          ? app_code_repo
          : sc_folder,
        build_mode,
        provide_bundle
      );
      return context;
    },
    steps: [
      {
        name: "React plugin",
        form: async (context) => {
          const directories = await File.find({ isDirectory: true });
          return new Form({
            additionalHeaders: [
              {
                headerTag: `<script>
  function runBuild(btn) {
    $(btn).data("old-text", "build");
    $.ajax({
      type: "POST",
      headers: {
        "CSRF-Token": _sc_globalCsrf,
      },
      url: "/react/run_build",
      success: function (data) {
        emptyAlerts();
        if (data.notify_success)
          notifyAlert({ type: "success", text: data.notify_success })
        else
          notifyAlert({ type: "success", text: "Build successful" });
        setTimeout(() => {
          restore_old_button("build_button_id");
        }, 50);
      },
      error: function (data) {
        if (data.responseText)
          notifyAlert({ type: "danger", text: data.responseText });
        else
          notifyAlert({ type: "danger", text: "Build failed, please check your Server logs" });
        console.error(data);
        setTimeout(() => {
          restore_old_button("build_button_id");
        }, 50);
      },
    });
  }
</script>`,
              },
            ],
            fields: [
              {
                name: "app_code_source",
                label: "Code source",
                sublabel: "Where do you want to get your React code from?",
                type: "String",
                required: true,
                attributes: {
                  options: ["GitHub", "sc_folder", "local"],
                },
              },
              {
                name: "app_code_path",
                label: "Path to code",
                sublabel: "Please enter a local path to your React code",
                type: "String",
                // required: true (but has problems with app_code_source showIf)
                showIf: { app_code_source: "local" },
              },
              {
                name: "app_code_repo",
                label: "GitHub repository name",
                sublabel:
                  "Please enter a GitHub repository name with your React code",
                type: "String",
                // required: true (but has problems with app_code_source showIf)
                showIf: { app_code_source: "GitHub" },
              },
              {
                name: "sc_folder",
                label: "Saltcorn folder",
                sublabel:
                  "Please select a Saltcorn folder with your React code",
                type: "String",
                // required: true (but has problems with app_code_source showIf)
                showIf: { app_code_source: "sc_folder" },
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
                name: "provide_bundle",
                label: "Provide your own bundle",
                sublabel: "Do you want to provide your own bundle?",
                type: "Bool",
                required: true,
                default: false,
              },
            ],
            additionalButtons: [
              {
                id: "build_button_id",
                label: "build",
                onclick: "runBuild(this);press_store_button(this);",
                class: "btn btn-primary",
              },
            ],
          });
        },
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
  const { build_mode, provide_bundle } = getState().plugin_cfgs?.react || {};
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
    }),
    provide_bundle
      ? script({
          src: `/plugins/public/react/setup_bundle${
            build_mode === "development" ? "_dev" : ""
          }.js`,
        })
      : ""
  );
};

const routes = ({
  app_code_source,
  app_code_path,
  app_code_repo,
  sc_folder,
  build_mode,
  provide_bundle,
}) => {
  return [
    {
      url: "/react/run_build",
      method: "post",
      callback: async (req, res) => {
        getState().log(5, "Building your React code");
        getState().log(
          6,
          `app_code_source: ${app_code_source}, app_code_path: ${app_code_path}, ` +
            `app_code_repo: ${app_code_repo}, sc_folder: ${sc_folder}, build_mode: ${build_mode} provide_bundle: ${provide_bundle}`
        );
        await prepareDirectory(
          app_code_source,
          app_code_source === "local"
            ? app_code_path
            : app_code_source === "GitHub"
            ? app_code_repo
            : sc_folder,
          build_mode,
          provide_bundle
        );
        res.json({ notify_success: "Build successful" });
      },
    },
  ];
};

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "react",
  configuration_workflow,
  routes,
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
