// Fully-typed API client generated from the contract. Every call and its
// response are type-checked against `contract`. Same-origin, so the session
// cookie rides along automatically.

import { initClient } from "@ts-rest/core";
import { contract } from "./contract";

export const api = initClient(contract, {
  baseUrl: "",
  baseHeaders: {},
});
