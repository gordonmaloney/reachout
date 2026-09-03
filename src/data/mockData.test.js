import assert from "node:assert/strict";
import test from "node:test";

import { initialContacts, isDemoContact } from "./mockData.js";

test("unchanged built-in contacts are identified as demo contacts", () => {
  assert.equal(isDemoContact(initialContacts[0]), true);
});

test("editing a demo contact activates it", () => {
  assert.equal(
    isDemoContact({ ...initialContacts[0], name: "A real contact" }),
    false
  );
  assert.equal(
    isDemoContact({ ...initialContacts[0], phone: "+44 7000 000000" }),
    false
  );
});

test("matching details with an unrelated id are not treated as built-in demo data", () => {
  assert.equal(
    isDemoContact({ ...initialContacts[0], id: "imported-contact" }),
    false
  );
});
