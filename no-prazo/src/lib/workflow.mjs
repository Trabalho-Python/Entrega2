/** @typedef {import("./supabase/database.types").ChamadoStatus} ChamadoStatus */

/** @type {Record<ChamadoStatus, readonly ChamadoStatus[]>} */
const transitions = {
  aberto: ["em_andamento"],
  em_andamento: ["aguardando", "resolvido"],
  aguardando: ["em_andamento", "resolvido"],
  resolvido: ["fechado"],
  fechado: [],
};

/** @param {ChamadoStatus} from @param {ChamadoStatus} to */
export function canTransitionStatus(from, to) {
  return Boolean(transitions[from]?.includes(to));
}

/** @param {ChamadoStatus} status @returns {readonly ChamadoStatus[]} */
export function nextStatuses(status) {
  return transitions[status];
}
