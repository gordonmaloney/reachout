import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import {
  getTransferLinkParams,
  isContactImportTransferLink,
  readEncryptedTransferLink,
  removeTransferParamsFromHash,
} from "./linkTransferUtils.js";

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeValidToken() {
  return makeToken({
    v: 1,
    d: { c: [["Ada", "+441234567890"]], t: [["template", "Title", "Body"]] },
  });
}

function makeToken(payload, outerOverrides = {}) {
  const encodedPayload = toBase64Url(
    JSON.stringify(payload)
  );
  return toBase64Url(
    JSON.stringify({ v: 1, c: "none", d: encodedPayload, ...outerOverrides })
  );
}

test("#ro=VALID_PAYLOAD&i=1 identifies a contacts import", async () => {
  const token = makeValidToken();
  const hash = `#ro=${token}&i=1`;

  assert.equal(isContactImportTransferLink(hash), true);
  const [contact] = (await readEncryptedTransferLink(hash)).contacts;
  assert.equal(contact.name, "Ada");
  assert.equal(contact.phone, "+441234567890");
});

test("#ro=VALID_PAYLOAD retains the normal transfer destination", () => {
  assert.equal(isContactImportTransferLink(`#ro=${makeValidToken()}`), false);
});

test("the ro token is parsed separately from the i parameter", () => {
  const token = makeValidToken();
  const params = getTransferLinkParams(`#ro=${token}&i=1`);

  assert.equal(params.get("ro"), token);
  assert.equal(params.get("i"), "1");
});

test("invalid payloads fail gracefully and transfer params can be removed", async () => {
  await assert.rejects(readEncryptedTransferLink("#ro=not-valid&i=1"), {
    code: "INVALID_TRANSFER_LINK",
  });
  assert.equal(removeTransferParamsFromHash("#ro=not-valid&i=1&keep=yes"), "#keep=yes");
  assert.equal(removeTransferParamsFromHash("#ro=not-valid&i=1"), "");
});

test("truncated and invalid base64 tokens are invalid transfer links", async () => {
  const truncatedToken = makeValidToken().slice(0, -8);

  await assert.rejects(readEncryptedTransferLink(`#ro=${truncatedToken}`), {
    code: "INVALID_TRANSFER_LINK",
  });
  await assert.rejects(readEncryptedTransferLink("#ro=%25%25%25"), {
    code: "INVALID_TRANSFER_LINK",
  });
});

test("unsupported versions and missing payload data are invalid", async () => {
  await assert.rejects(
    readEncryptedTransferLink(`#ro=${makeToken({ v: 1, d: { c: [], t: [] } }, { v: 2 })}`),
    { code: "INVALID_TRANSFER_LINK" }
  );

  const missingPayload = toBase64Url(JSON.stringify({ v: 1, c: "none" }));
  await assert.rejects(readEncryptedTransferLink(`#ro=${missingPayload}`), {
    code: "INVALID_TRANSFER_LINK",
  });
});

test("malformed contact and template structures are invalid", async () => {
  await assert.rejects(
    readEncryptedTransferLink(
      `#ro=${makeToken({ v: 1, d: { c: "not-an-array", t: [] } })}`
    ),
    { code: "INVALID_TRANSFER_LINK" }
  );
  await assert.rejects(
    readEncryptedTransferLink(
      `#ro=${makeToken({ v: 1, d: { c: [["Ada", 123]], t: [] } })}`
    ),
    { code: "INVALID_TRANSFER_LINK" }
  );
  await assert.rejects(
    readEncryptedTransferLink(
      `#ro=${makeToken({ v: 1, d: { c: [], t: [["id", "Title", 123]] } })}`
    ),
    { code: "INVALID_TRANSFER_LINK" }
  );
  await assert.rejects(
    readEncryptedTransferLink(
      `#ro=${makeToken({ v: 1, d: { c: [null], t: [] } })}`
    ),
    { code: "INVALID_TRANSFER_LINK" }
  );
  await assert.rejects(
    readEncryptedTransferLink(
      `#ro=${makeToken({ v: 1, d: { c: [], t: [{ title: "Title" }] } })}`
    ),
    { code: "INVALID_TRANSFER_LINK" }
  );
});

test("a structurally valid transfer may contain zero contacts", async () => {
  const imported = await readEncryptedTransferLink(
    `#ro=${makeToken({ v: 1, d: { c: [], t: [] } })}`
  );

  assert.deepEqual(imported.contacts, []);
  assert.deepEqual(imported.templates, []);
});
