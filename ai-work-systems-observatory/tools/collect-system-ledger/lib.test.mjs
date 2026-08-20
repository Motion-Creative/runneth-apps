import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAppList,
  parsePackageList,
  parseRoutineList,
  parseTaskList,
  parseWorkflowList,
} from "./lib.mjs";

test("parses compact routine output", () => {
  const rows = parseRoutineList(JSON.stringify({
    data: {
      routines: [{
        routineId: "r-1",
        name: "Weekly review",
        status: "active",
        mode: "agent",
        prompt: "must not be copied",
      }],
    },
  }));
  assert.deepEqual(rows, [{ routineId: "r-1", name: "Weekly review", status: "active", mode: "agent" }]);
});

test("parses task and workflow arrays without durable prompt bodies", () => {
  assert.deepEqual(parseTaskList('{"tasks":[{"id":"t-1","name":"Audit","kind":"agent","prompt":"secret"}]}'), [
    { id: "t-1", name: "Audit", kind: "agent" },
  ]);
  assert.deepEqual(parseWorkflowList('{"workflows":[{"id":"w-1","name":"Normalize","version":2,"source":"hidden"}]}'), [
    { id: "w-1", name: "Normalize", version: 2 },
  ]);
});

test("parses installed package source type", () => {
  assert.deepEqual(parsePackageList('{"packages":[{"id":"p-1","name":"Package","version":"1","source":{"type":"backend-github"}}]}'), [
    { id: "p-1", name: "Package", version: "1", sourceType: "backend-github" },
  ]);
});

test("parses tab-separated app output", () => {
  const rows = parseAppList("observatory\troute=/observatory\tstatus=ready\tappId=a-1\turl=https://example.test/observatory\n");
  assert.deepEqual(rows, [{
    name: "observatory",
    route: "/observatory",
    status: "ready",
    appId: "a-1",
    url: "https://example.test/observatory",
  }]);
});
