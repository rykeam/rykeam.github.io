/**
 * TWSBV Gantt sync — saves the Gantt page's changes to this Google Sheet.
 *
 * Setup (one time):
 *   1. In the Google Sheet: Extensions > Apps Script. Delete what's there, paste this whole file, Save.
 *   2. Deploy > New deployment > type "Web app".
 *        Execute as: Me
 *        Who has access: Anyone
 *      Click Deploy, approve the permissions, and copy the Web app URL.
 *   3. Give that URL to Claude (it goes into gantt.html).
 *
 * The page fills the sheet with the starting task list the first time it loads.
 * You never need to edit the sheet by hand, but you can — the page picks up changes.
 */

const SHEET_NAME = 'Tasks';
const COLS = ['id', 'phase', 'name', 'start', 'end', 'note', 'done', 'updated'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold');
    sh.getRange('A:H').setNumberFormat('@'); // keep dates as plain text
    sh.setFrozenRows(1);
  }
  return sh;
}

function asText_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : String(v);
}

function readAll_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, COLS.length).getValues();
  return rows
    .filter(r => r[0] !== '')
    .map(r => ({
      id: asText_(r[0]), phase: asText_(r[1]), name: asText_(r[2]),
      start: asText_(r[3]), end: asText_(r[4]), note: asText_(r[5]),
      done: /^(yes|true|y|x|1)$/i.test(asText_(r[6]).trim()),
      updated: asText_(r[7])
    }));
}

function row_(t) {
  return [t.id, t.phase, t.name, t.start, t.end, t.note || '', t.done ? 'Yes' : '', new Date().toISOString()];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, tasks: readAll_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    const sh = sheet_();
    const ids = () => {
      const last = sh.getLastRow();
      return last < 2 ? [] : sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]));
    };

    if (body.action === 'seed') {
      if (readAll_().length === 0 && Array.isArray(body.tasks) && body.tasks.length) {
        sh.getRange(2, 1, body.tasks.length, COLS.length).setValues(body.tasks.map(row_));
      }
    } else if (body.action === 'upsert') {
      const t = body.task;
      if (!t || !t.id) throw new Error('Missing task');
      const i = ids().indexOf(String(t.id));
      if (i >= 0) sh.getRange(i + 2, 1, 1, COLS.length).setValues([row_(t)]);
      else sh.appendRow(row_(t));
    } else if (body.action === 'delete') {
      const i = ids().indexOf(String(body.id));
      if (i >= 0) sh.deleteRow(i + 2);
    } else if (body.action === 'clearDone') {
      const last = sh.getLastRow();
      if (last >= 2) sh.getRange(2, 7, last - 1, 1).clearContent();
    } else {
      throw new Error('Unknown action');
    }
    return json_({ ok: true, tasks: readAll_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
