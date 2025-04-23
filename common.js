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

const buildViewBundle = async (buildMode, viewName) => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npm",
      [
        "run",
        buildMode === "development" ? "build_view_dev" : "build_view",
        "--",
        "--env",
        `view_name=${viewName}`,
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

const buildSafeViewName = (viewName) => viewName.replace(/[^a-zA-Z0-9]/g, "_");

const handleUserCode = async (userCode, buildMode, viewName) => {
  const userCodeDir = path.join(__dirname, "user-code");
  const safeViewName = buildSafeViewName(viewName);
  await fs.writeFile(
    path.join(userCodeDir, `${safeViewName}.js`),
    userCode,
    "utf8"
  );
  if ((await buildViewBundle(buildMode, safeViewName)) !== 0) {
    throw new Error("Build failed please check your server logs");
  }
};

module.exports = {
  buildSafeViewName,
  handleUserCode,
};
