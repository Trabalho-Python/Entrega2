import type { ChamadoStatus } from "./supabase/database.types";

export declare function canTransitionStatus(from: ChamadoStatus, to: ChamadoStatus): boolean;
export declare function nextStatuses(status: ChamadoStatus): readonly ChamadoStatus[];
