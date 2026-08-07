// os/lib/guard.mjs
// Garde anti-réinjection B99-T99.
//
// Contexte : 27 items de fausse data B99-T99 ont été retirés des bases Notion
// le 2026-08-07 (archivés sous ARCHIVE_B99-T99). Cette garde empêche leur
// retour via extract/inject — tout id_dump / source_dump_id correspondant au
// motif B99-T99 (exact ou préfixe "B99-T99-") doit faire échouer le run
// (fail-loud), jamais être ignoré en silence.

const BLOCKED_DUMP_ID_PATTERN = /^B99-T99(-.*)?$/;

export class BlockedDumpIdError extends Error {
  constructor(dumpId, context = "") {
    super(
      `[GARDE ANTI-REINJECTION B99-T99] id_dump/source_dump_id="${dumpId}" correspond au ` +
      `motif bloqué B99-T99 (fausse data archivée le 2026-08-07 sous ARCHIVE_B99-T99 — ` +
      `ne doit jamais être réinjectée). ${context} Run stoppé (fail-loud).`
    );
    this.name = "BlockedDumpIdError";
    this.dumpId = dumpId;
  }
}

/**
 * Throws BlockedDumpIdError si dumpId correspond au motif bloqué B99-T99.
 * À appeler au tout début du traitement d'un item/page, avant toute
 * lecture/écriture — pas de skip silencieux.
 */
export function assertNotBlockedDumpId(dumpId, context = "") {
  if (typeof dumpId === "string" && BLOCKED_DUMP_ID_PATTERN.test(dumpId.trim())) {
    throw new BlockedDumpIdError(dumpId, context);
  }
}
