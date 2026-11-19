WSSA TASK TIMELINE – DATA: README
Paste into cell A1 of a "ReadMe" tab in the Google Sheet (one line per row).

WHAT THIS IS
This sheet stores the data behind the WSSA Cyclical Task Timeline page (2025–2031 Gantt chart of WSSA tasks).
Page link (share this with colleagues): https://rykeam.github.io/TWDB/WSSA/task-timeline.html
Anyone with the page link can view, check off, edit, add and delete tasks. Changes show up for everyone, on any device, within about 30 seconds.
Built from: WSSATaskTimeline_2025to2031.xlsx (Nov 2026).

HOW IT WORKS
1. The page lives on my GitHub Pages site (repo: rykeam/rykeam.github.io, file: TWDB/WSSA/task-timeline.html).
2. GitHub Pages can only display pages. It cannot save anything, so this sheet acts as the page's memory.
3. A Google Apps Script attached to this sheet (Extensions → Apps Script) passes changes between the page and the "Tasks" tab.
4. When anyone opens the page, and every 30 seconds after, the page asks the script for the latest tasks.
5. The script runs under my Google account but can only read and change this sheet.

DO NOT
- Rename the "Tasks" tab or change its column headings. The script looks for those exact names.
- Share this sheet with colleagues. They only need the page link.
- Create a "New deployment" of the script. That makes a new web app URL and disconnects the page.

IF THE SCRIPT EVER NEEDS CHANGING
Edit and save the code, then Deploy → Manage deployments → pencil icon → Version: New version → Deploy. This keeps the same URL.
Backup copy of the script: GitHub repo, _apps-script/TWDB/WSSA/task-timeline-sync.gs

COLUMNS ON THE TASKS TAB
id: internal ID the page uses (don't change). taskId: the Task Id shown on the page.
category / subcategory / name / description: as in the original workbook.
linkText: folder path or link text. linkUrl: web link (https only).
docStatus: Not Started, Draft, Working or Complete. completed: Yes, No, In process or N/A.
startListed / endListed: the Start and End exactly as written in the original workbook.
ongoing: Yes for tasks that run all years.
segments: timeline bars by month, e.g. [{"s":"2027-03","e":"2028-03"}].
milestones: milestone months and labels, e.g. [{"m":"2025-03","label":"IPPs Due 3/3"}].
sort: display order within each category. updated: last change time.
Easiest is to edit on the page, not here. If you edit here, keep the same formats.

UNDOING A BAD EDIT
Use File → Version history → See version history in this sheet.

TROUBLESHOOTING
"Can't reach the saved copy": check the script is still deployed and the web app URL works in a browser (should show {"ok":true,...}).
"Not connected yet": the web app URL is missing from the page code. Ask Claude to add it.

COSTS
Free. The GitHub repo is public, so don't put confidential information in task names, notes or paths.
