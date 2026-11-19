/**
 * WSSA Task Timeline sync — saves the WSSA Task Timeline page's changes to this Google Sheet.
 * Page: https://rykeam.github.io/TWDB/WSSA/task-timeline.html
 *
 * Setup (one time):
 *   1. In the Google Sheet: Extensions > Apps Script. Delete what's there, paste this whole file, Save.
 *   2. Deploy > New deployment > type "Web app".
 *        Execute as: Me
 *        Who has access: Anyone
 *      Click Deploy, approve the permissions, and copy the Web app URL.
 *   3. Give that URL to Claude (it goes into TWDB/WSSA/task-timeline.html).
 *
 * The page fills the sheet with the starting task list the first time it loads.
 * To change this script later: Deploy > Manage deployments > pencil > Version: New version
 * (a "New deployment" creates a new URL and disconnects the page).
 */

const SHEET_NAME = 'Tasks';
const COLS = ['id', 'taskId', 'category', 'subcategory', 'name', 'description', 'linkText', 'linkUrl',
              'docStatus', 'startListed', 'endListed', 'completed', 'ongoing', 'segments', 'milestones',
              'sort', 'updated'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold');
    sh.getRange(1, 1, sh.getMaxRows(), COLS.length).setNumberFormat('@'); // keep everything as plain text
    sh.setFrozenRows(1);
  }
  return sh;
}

function asText_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM');
  return v === null || v === undefined ? '' : String(v);
}

function readAll_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, COLS.length).getValues()
    .filter(r => r[0] !== '')
    .map(r => { const o = {}; COLS.forEach((k, i) => o[k] = asText_(r[i])); return o; });
}

function row_(t) {
  return COLS.map(k => k === 'updated' ? new Date().toISOString() : (t[k] === undefined || t[k] === null ? '' : String(t[k])));
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
        sh.getRange(2, 1, body.tasks.length, COLS.length).setNumberFormat('@').setValues(body.tasks.map(row_));
      }
    } else if (body.action === 'upsert') {
      const t = body.task;
      if (!t || !t.id) throw new Error('Missing task');
      const i = ids().indexOf(String(t.id));
      if (i >= 0) sh.getRange(i + 2, 1, 1, COLS.length).setNumberFormat('@').setValues([row_(t)]);
      else sh.getRange(sh.getLastRow() + 1, 1, 1, COLS.length).setNumberFormat('@').setValues([row_(t)]);
    } else if (body.action === 'delete') {
      const i = ids().indexOf(String(body.id));
      if (i >= 0) sh.deleteRow(i + 2);
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
