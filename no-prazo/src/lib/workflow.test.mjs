import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionStatus } from "./workflow.mjs";

test("permite assumir chamado aberto", () => {
  assert.equal(canTransitionStatus("aberto", "em_andamento"), true);
});

test("aguardando pausa o fluxo e pode retomar ou resolver", () => {
  assert.equal(canTransitionStatus("em_andamento", "aguardando"), true);
  assert.equal(canTransitionStatus("aguardando", "em_andamento"), true);
  assert.equal(canTransitionStatus("aguardando", "resolvido"), true);
});

test("bloqueia transições inválidas e estados terminais", () => {
  assert.equal(canTransitionStatus("aberto", "resolvido"), false);
  assert.equal(canTransitionStatus("resolvido", "em_andamento"), false);
  assert.equal(canTransitionStatus("resolvido", "fechado"), true);
  assert.equal(canTransitionStatus("fechado", "aberto"), false);
  assert.equal(canTransitionStatus("estado_invalido", "aberto"), false);
});
