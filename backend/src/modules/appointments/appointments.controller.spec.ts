import { readFileSync } from 'fs';
import { join } from 'path';

const controllerSource = readFileSync(
  join(__dirname, 'appointments.controller.ts'),
  'utf8',
);

function methodDecorators(methodName: string): string {
  const lines = controllerSource.split(/\r?\n/);
  const methodLineIndex = lines.findIndex((line) =>
    new RegExp(`^\\s*${methodName}\\s*\\(`).test(line),
  );

  if (methodLineIndex < 0) {
    throw new Error(`Method ${methodName} not found in AppointmentsController.`);
  }

  const decorators: string[] = [];
  for (let index = methodLineIndex - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line.trim()) {
      break;
    }

    decorators.unshift(line);
  }

  return decorators.join('\n');
}

describe('AppointmentsController RBAC decorators', () => {
  it.each([
    'create',
    'findAll',
    'findByProfessional',
    'findByClient',
    'findOne',
    'update',
    'updateStatus',
    'createTimeOff',
    'findTimeOffs',
    'removeTimeOff',
    'confirm',
    'messageClient',
    'offerEarlierSlot',
    'cancelWithPolicy',
    'checkin',
    'start',
    'complete',
    'remove',
  ])('restricts %s to staff roles', (methodName) => {
    expect(methodDecorators(methodName)).toContain('@Roles(...STAFF_ROLES)');
  });

  it.each([
    'findMine',
    'getAvailableSlots',
    'book',
    'rescheduleMine',
    'cancelMine',
  ])('keeps %s available to authenticated clients', (methodName) => {
    expect(methodDecorators(methodName)).not.toContain('@Roles(');
  });
});
