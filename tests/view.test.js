const { getState } = require("@saltcorn/data/db/state");
const View = require("@saltcorn/data/models/view");
const { mockReqRes } = require("@saltcorn/data/tests/mocks");
const { hashState } = require("@saltcorn/data/utils");
const {
  afterAll,
  beforeAll,
  describe,
  it,
  expect,
} = require("@saltcorn/db-common/test_expect");

getState().registerPlugin("base", require("@saltcorn/data/base-plugin"));
getState().registerPlugin("@saltcorn/react", require(".."));

afterAll(require("@saltcorn/data/db").close);
beforeAll(async () => {
  await getState().refresh(true);
});

const extractAttr = (html, attr) => {
  const m = html.match(new RegExp(`${attr}="([^"]*)"`));
  return m ? m[1] : null;
};

describe("react view run tests", () => {
  it("run tableless view", async () => {
    const view = View.findOne({ name: "default_react_view" });
    const result = await view.run({}, mockReqRes);
    expect(result).toBeDefined();
    expect(result).toContain('<div class="_sc_react-view"');
    expect(result).toContain('view-name="default_react_view"');
    expect(result).toContain('query="%7B%7D"');
    expect(result).toContain(
      'user="%7B%22id%22%3A1%2C%22role_id%22%3A1%2C%22attributes%22%3A%7B%7D%7D"'
    );
    expect(result).toContain('timestamp="');
  });

  it("run view with table", async () => {
    const view = View.findOne({ name: "react_view_with_data" });
    const result = await view.run({}, mockReqRes);
    expect(result).toBeDefined();
    expect(result).toContain('<div class="_sc_react-view"');
    expect(result).toContain('view-name="react_view_with_data"');
    expect(result).toContain('query="%7B%7D"');
    expect(result).toContain('table-name="albums"');
    expect(result).toContain('state="%7B%7D"');
    expect(result).toContain(
      'rows="%5B%7B%22id%22%3A1%2C%22name%22%3A%22album%20A%22%2C%22release_date%22%3A%222025-08-03T17%3A08%3A00.000Z%22%7D%2C%7B%22id%22%3A2%2C%22name%22%3A%22album%20B%22%2C%22release_date%22%3A%222025-08-27T17%3A08%3A00.000Z%22%7D%5D"'
    );
    expect(result).toContain(
      'user="%7B%22id%22%3A1%2C%22role_id%22%3A1%2C%22attributes%22%3A%7B%7D%7D"'
    );
    expect(result).toContain('timestamp="');
  });
});

describe("stateHash prop tests", () => {
  it("tableless view exposes state-hash as a 5-char hex string", async () => {
    const view = View.findOne({ name: "default_react_view" });
    const result = await view.run({}, mockReqRes);
    expect(result).toContain('state-hash="');
    const hash = extractAttr(result, "state-hash");
    expect(hash).toMatch(/^[0-9a-f]{5}$/);
  });

  it("table-based view exposes state-hash as a 5-char hex string", async () => {
    const view = View.findOne({ name: "react_view_with_data" });
    const result = await view.run({}, mockReqRes);
    expect(result).toContain('state-hash="');
    const hash = extractAttr(result, "state-hash");
    expect(hash).toMatch(/^[0-9a-f]{5}$/);
  });

  it("state-hash matches hashState utility output", async () => {
    const view = View.findOne({ name: "react_view_with_data" });
    const state = {};
    const result = await view.run(state, mockReqRes);
    const hash = extractAttr(result, "state-hash");
    expect(hash).toBe(hashState(state, "react_view_with_data"));
  });

  it("state-hash is stable when only pagination params change", async () => {
    const view = View.findOne({ name: "react_view_with_data" });
    const baseState = {};
    const baseResult = await view.run(baseState, mockReqRes);
    const baseHash = extractAttr(baseResult, "state-hash");

    const baseHashValue = hashState(baseState, "react_view_with_data");
    const pagedState = { [`_${baseHashValue}_page`]: "2" };
    const pagedResult = await view.run(pagedState, mockReqRes);
    const pagedHash = extractAttr(pagedResult, "state-hash");

    expect(pagedHash).toBe(baseHash);
  });
});
