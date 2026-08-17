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
  const payload = toBase64Url(
    JSON.stringify({
      v: 1,
      d: { c: [["Ada", "+441234567890"]], t: [["template", "Title", "Body"]] },
    })
  );
  return toBase64Url(JSON.stringify({ v: 1, c: "none", d: payload }));
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
  await assert.rejects(readEncryptedTransferLink("#ro=not-valid&i=1"));
  assert.equal(removeTransferParamsFromHash("#ro=not-valid&i=1&keep=yes"), "#keep=yes");
  assert.equal(removeTransferParamsFromHash("#ro=not-valid&i=1"), "");
});
