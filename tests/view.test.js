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

describe("react view run tests", () => {
  it("run tableless view", async () => {
    const view = View.findOne({ name: "default_react_view" });
    const result = await view.run({}, mockReqRes);
    expect(result).toBeDefined();
    expect(result).toContain('<div class="_sc_react-view"');
    expect(result).toContain('view-name="default_react_view"');
    expect(result).toContain('query=\"%7B%7D\"');
    expect(result).toContain(
      'user=\"%7B%22id%22%3A1%2C%22role_id%22%3A1%2C%22attributes%22%3A%7B%7D%7D\"',
    );
    expect(result).toContain('timestamp="');
  });

  it("run view with table", async () => {
    const view = View.findOne({ name: "react_view_with_data" });
    const result = await view.run({}, mockReqRes);
    expect(result).toBeDefined();
    expect(result).toContain('<div class="_sc_react-view"');
    expect(result).toContain('view-name="react_view_with_data"');
    expect(result).toContain('query=\"%7B%7D\"');
    expect(result).toContain('table-name="albums"');
    expect(result).toContain('state=\"%7B%7D\"');
    expect(result).toContain(
      'rows=\"%5B%7B%22id%22%3A1%2C%22name%22%3A%22album%20A%22%2C%22release_date%22%3A%222025-08-03T17%3A08%3A00.000Z%22%7D%2C%7B%22id%22%3A2%2C%22name%22%3A%22album%20B%22%2C%22release_date%22%3A%222025-08-27T17%3A08%3A00.000Z%22%7D%5D\"',
    );
    expect(result).toContain(
      'user=\"%7B%22id%22%3A1%2C%22role_id%22%3A1%2C%22attributes%22%3A%7B%7D%7D\"',
    );
    expect(result).toContain('timestamp="');
  });
});
