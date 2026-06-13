import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src');

const literalToKey = new Map([
  ['Failed to update cafe schedule', 'updateCafeSchedule'],
  ['Failed to load rooms availability', 'loadRoomsAvailability'],
  ['Failed to load occupancy', 'loadOccupancy'],
  ['Failed to load cafe layout editor data', 'loadLayoutEditor'],
  ['Failed to save cafe layout editor data', 'saveLayoutEditor'],
  ['Failed to delete absence', 'deleteAbsence'],
  ['Failed to load absences', 'loadAbsences'],
  ['Failed to create absence', 'createAbsence'],
  ['Failed to load shift schedule', 'loadShiftSchedule'],
  ['Failed to save shift schedule', 'saveShiftSchedule'],
  ['Failed to load schedule', 'loadSchedule'],
  ['Failed to toggle shift status', 'toggleShiftStatus'],
  ['Failed to fetch cafe information', 'fetchCafe'],
  ['Failed to update cafe information', 'updateCafe'],
  ['Failed to complete task', 'completeTask'],
  ['Failed to uncomplete task', 'uncompleteTask'],
  ['Failed to fetch tasks', 'fetchTasks'],
  ['Failed to fetch menu', 'fetchMenu'],
  ['Failed to export menu', 'exportMenu'],
  ['Failed to update menu item', 'updateMenuItem'],
  ['Failed to delete menu item', 'deleteMenuItem'],
  ['Failed to import menu', 'importMenu'],
  ['Failed to create menu item', 'createMenuItem'],
  ['Failed to update menu category', 'updateMenuCategory'],
  ['Failed to delete menu category', 'deleteMenuCategory'],
  ['Failed to create menu category', 'createMenuCategory'],
  ['Failed to upload file', 'uploadFile'],
  ['Failed to cancel appointment', 'cancelAppointment'],
  ['Failed to fetch activity logs statistics', 'fetchActivityLogsStats'],
  ['Failed to fetch activity logs', 'fetchActivityLogs'],
  ['Failed to update task template', 'updateTaskTemplate'],
  ['Failed to fetch worker', 'fetchWorker'],
  ['Failed to update worker', 'updateWorker'],
  ['Failed to delete worker', 'deleteWorker'],
  ['Failed to deactivate task template', 'deactivateTaskTemplate'],
  ['Failed to fetch workers', 'fetchWorkers'],
  ['Failed to invite worker', 'inviteWorker'],
  ['Failed to fetch task templates', 'fetchTaskTemplates'],
  ['Failed to create task template', 'createTaskTemplate'],
  ['Failed to fetch task statistics', 'fetchTaskStatistics'],
  ['Failed to check-in appointment', 'checkinAppointment'],
  ['Failed to confirm appointment', 'confirmAppointment'],
  ['Failed to fetch appointment details', 'fetchAppointmentDetails'],
  ['Failed to fetch appointments', 'fetchAppointments'],
  ['Failed to get logo URL', 'getLogoUrl'],
  ['Failed to download document', 'downloadDocument'],
  ['Failed to get banner URL', 'getBannerUrl'],
  ['Failed to fetch brand stats', 'fetchBrandStats'],
  ['Invalid response fetching worker', 'invalidWorkerResponse'],
  ['No brand associated with this worker', 'noBrandForWorker'],
  ['Internal server error', 'internalServer'],
  ['Upload failed', 'uploadFailed'],
]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

function ensureImport(content) {
  if (content.includes("from '@/i18n'") || content.includes('from "@/i18n"')) return content;
  const lines = content.split('\n');
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) insertAt = i + 1;
    else if (insertAt > 0 && lines[i].trim() === '') break;
  }
  lines.splice(insertAt, 0, "import { t } from '@/i18n';");
  return lines.join('\n');
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [literal, key] of literalToKey) {
    const repl = `t('apiErrors.${key}')`;
    for (const quote of ["'", '"']) {
      const needle = `${quote}${literal}${quote}`;
      if (content.includes(needle)) {
        content = content.split(needle).join(repl);
        changed = true;
      }
    }
  }

  if (content.includes('Failed to fetch worker:')) {
    content = content.replace(
      /throw new Error\(`Failed to fetch worker: \$\{[^`]+\}`\)/g,
      "throw new Error(t('apiErrors.fetchWorkerAuth'))",
    );
    changed = true;
  }

  if (changed) {
    content = ensureImport(content);
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

const targets = [
  path.join(root, 'app', 'api'),
  path.join(root, 'features'),
];
let count = 0;
for (const dir of targets) {
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir)) {
    if (patchFile(f)) count++;
  }
}
console.log(`Patched ${count} files`);
