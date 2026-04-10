import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("create-approved-submission-pr workflow only creates PRs for approved submissions", async () => {
  const workflow = await fs.readFile(
    path.join(
      process.cwd(),
      ".github",
      "workflows",
      "create-approved-submission-pr.yml",
    ),
    "utf8",
  );

  assert.match(workflow, /name: Create Approved Submission PR/);
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /name: Create remote branch reference/);
  assert.match(workflow, /github\.rest\.git\.createRef/);
  assert.match(workflow, /git push origin HEAD:"\$\{branch\}"/);
  assert.doesNotMatch(workflow, /name: Merge pull request/);
  assert.match(workflow, /github\.rest\.actions\.createWorkflowDispatch/);
  assert.match(
    workflow,
    /DEFAULT_BRANCH: \$\{\{ github\.event\.repository\.default_branch \}\}/,
  );
  assert.doesNotMatch(workflow, /ref: branch/);
  assert.match(workflow, /has been created for this approved submission/i);
});

test("submission-pr-validation workflow validates automated submission PRs", async () => {
  const workflow = await fs.readFile(
    path.join(
      process.cwd(),
      ".github",
      "workflows",
      "submission-pr-validation.yml",
    ),
    "utf8",
  );

  assert.match(workflow, /name: Submission PR Validation/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pr_number:/);
  assert.match(workflow, /branch:/);
  assert.match(workflow, /issue_number:/);
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /github\.rest\.actions\.createWorkflowDispatch/);
  assert.match(workflow, /PR_NUMBER: \$\{\{ inputs\.pr_number \}\}/);
  assert.match(workflow, /BRANCH: \$\{\{ inputs\.branch \}\}/);
  assert.match(workflow, /ISSUE_NUMBER: \$\{\{ inputs\.issue_number \}\}/);
  assert.match(
    workflow,
    /DEFAULT_BRANCH: \$\{\{ github\.event\.repository\.default_branch \}\}/,
  );
  assert.doesNotMatch(workflow, /ref: inputs\.branch/);
  assert.doesNotMatch(workflow, /ref: process\.env\.BRANCH/);
  assert.doesNotMatch(workflow, /pr_number: inputs\.pr_number/);
  assert.match(workflow, /bun run format:check/);
  assert.match(workflow, /bun run check:links/);
  assert.match(workflow, /bun run check:consistency/);
});

test("merge-approved-submission-pr workflow merges automated PRs after validation succeeds", async () => {
  const workflow = await fs.readFile(
    path.join(
      process.cwd(),
      ".github",
      "workflows",
      "merge-approved-submission-pr.yml",
    ),
    "utf8",
  );

  assert.match(workflow, /name: Merge Approved Submission PR/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pr_number:/);
  assert.match(workflow, /branch:/);
  assert.match(workflow, /issue_number:/);
  assert.doesNotMatch(workflow, /getCombinedStatusForRef/);
  assert.doesNotMatch(workflow, /hasSubmissionValidation/);
  assert.match(workflow, /listForRef/);
  assert.match(workflow, /for \(let attempt = 1; attempt <= 24;/);
  assert.match(workflow, /github\.rest\.pulls\.merge/);
  assert.match(workflow, /has been merged for this approved submission/i);
});
