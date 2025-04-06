const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const File = require("@saltcorn/data/models/file");
const { getState } = require("@saltcorn/data/db/state");
const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");

const buildMainBundle = async (buildMode, libPath, libMain) => {
  getState().log(6, `spawn ${buildMode} build of main bundle`);
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npm",
      [
        "run",
        buildMode === "development" ? "build_main_dev" : "build_main",
        "--",
        "--env",
        `user_lib_path=${libPath}`,
        "--env",
        `user_lib_main=${libMain}`,
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

const prepareDirectory = async ({ codeSource, codeLocation, buildMode }) => {
  const userLibPath = async (source, location) => {
    switch (source) {
      case "local":
        return location;
      case "Saltcorn folder":
        const folder = await File.findOne(location);
        if (!folder)
          throw new Error(`Folder ${location} not found in Saltcorn folders`);
        return folder.location;
      case "Not set":
        return null;
      default:
        throw new Error("Unknown code source");
    }
  };
  const libPath = await userLibPath(codeSource, codeLocation);
  const userLibMain = async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(libPath, "package.json"), "utf8")
    );
    if (packageJson.main) return packageJson.main;
    else {
      throw new Error(
        "No main field in package.json, please specify the main file"
      );
    }
  };
  if (
    (await buildMainBundle(
      buildMode,
      libPath,
      libPath ? await userLibMain() : null
    )) !== 0
  ) {
    throw new Error("Webpack failed, please check your Server logs");
  }
};

const configuration_workflow = () =>
  new Workflow({
    onDone: async (context) => {
      const { app_code_source, app_code_path, sc_folder, build_mode } = context;
      await prepareDirectory({
        codeSource: app_code_source,
        codeLocation:
          app_code_source === "local"
            ? app_code_path
            : app_code_source === "Saltcorn folder"
            ? sc_folder
            : null,
        buildMode: build_mode,
      });
      return context;
    },
    steps: [
      {
        name: "React plugin",
        form: async (context) => {
          const directories = await File.find({ isDirectory: true });
          return new Form({
            blurb:
              "This plugin allows using React in Saltcorn views. " +
              "You need a global main bundle with React and your custom React components, " +
              "plus a bundle per view with some view-specific code. " +
              "Here you can create the main bundle, a view bundle comes from the view config dialog. " +
              "The 'Build' button generates the main bundle and stays on the page, " +
              "'Finish' builds and completes the process. For an example, " +
              "take a look at the <a href='https://github.com/saltcorn/react' target='_blank'>README</a>",
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
                  options: ["Saltcorn folder", "local", "Not set"],
                },
                help: {
                  topic: "Code source",
                  plugin: "react",
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
                name: "sc_folder",
                label: "Saltcorn folder",
                sublabel:
                  "Please select a Saltcorn folder with your React code",
                type: "String",
                // required: true (but has problems with app_code_source showIf)
                showIf: { app_code_source: "Saltcorn folder" },
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

const routes = ({ app_code_source, app_code_path, sc_folder, build_mode }) => {
  return [
    {
      url: "/react/run_build",
      method: "post",
      callback: async (req, res) => {
        getState().log(5, "Building your React code");
        getState().log(
          6,
          `app_code_source: ${app_code_source}, app_code_path: ${app_code_path}, ` +
            `sc_folder: ${sc_folder}, build_mode: ${build_mode}, `
        );
        await prepareDirectory({
          codeSource: app_code_source,
          codeLocation:
            app_code_source === "local"
              ? app_code_path
              : app_code_source === "Saltcorn folder"
              ? sc_folder
              : null,
          buildMode: build_mode,
        });
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
  viewtemplates: (cfg) => [require("./react_view")],
  headers: () => [
    {
      script: "/plugins/public/react/main_bundle.js",
    },
  ],
  onLoad: async (configuration) => {
    try {
      const mainBundlePath = path.join(__dirname, "public", "main_bundle.js");
      const mainBundleExists = await fs
        .access(mainBundlePath)
        .then(() => true)
        .catch(() => false);
      if (!mainBundleExists) {
        getState().log(5, "Main bundle does not exist, building it now");
        const { app_code_source, app_code_path, sc_folder, build_mode } =
          configuration;
        await prepareDirectory({
          codeSource: app_code_source,
          codeLocation:
            app_code_source === "local"
              ? app_code_path
              : app_code_source === "Saltcorn folder"
              ? sc_folder
              : null,
          buildMode: build_mode,
        });
      }
    } catch (e) {
      getState().log(2, `Error building main bundle: ${e.message}`);
    }
  },
};
