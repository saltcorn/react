const { getState } = require("@saltcorn/data/db/state");
const View = require("@saltcorn/data/models/view");
const { mockReqRes } = require("@saltcorn/data/tests/mocks");
const { afterAll, beforeAll, describe, it, expect } = require("@jest/globals");

getState().registerPlugin("base", require("@saltcorn/data/base-plugin"));
getState().registerPlugin("@saltcorn/react", require(".."));

afterAll(require("@saltcorn/data/db").close);
beforeAll(async () => {
  await getState().refresh(true);
});

describe("react view build tests", () => {
  it("run tableless view", async () => {
    const view = View.findOne({ name: "empty_react_view" });
    const body = {
      user_code: `
import React from "react";
export default function App({ viewName, query  }) {
  return <h3>Please write your React code here</h3>;
};`,
      build_mode: "development",
      timestamp: undefined,
    };
    await view.runRoute(
      "build_user_code",
      body,
      mockReqRes.res,
      { req: { ...mockReqRes.req, body }, res: mockReqRes.res },
      false,
    );
    const stored = mockReqRes.getStored();
    expect(stored).toBeDefined();
    expect(stored).toEqual({ json: { notify_success: "Build successful" } });
  });
});
