import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { RunControl } from '../src/control.ts';

test('STOP interrupts waiting and refuses further work', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'kx-stop-'));
  const control = new RunControl(dir);
  await writeFile(path.join(dir,'STOP'),'');
  await assert.rejects(control.sleep(10000),/STOP/);
  assert.equal(control.signal.aborted,true);
});
