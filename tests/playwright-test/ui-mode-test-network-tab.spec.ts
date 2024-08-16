/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Page } from './stable-test-runner';
import { expect, test } from './ui-mode-fixtures';
import { exec } from 'child_process';

test('should filter network requests by resource type', async ({ runUITest, server, runCLICommand, childProcess }) => {
  server.setRoute('/api/endpoint', (_, res) => res.setHeader('Content-Type', 'application/json').end());

  const { page } = await runUITest({
    'network-tab.test.ts': `
      import { test, expect } from '@playwright/test';
      test('network tab test', async ({ page }) => {
        await page.goto('${server.PREFIX}/network-tab/network.html');
      });
    `,
  });

  await page.getByText('network tab test').dblclick();
  await page.getByText('Network', { exact: true }).click();

  const networkItems = page.getByTestId('network-list').getByRole('listitem');

  await page.getByText('JS', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('script.js')).toBeVisible();

  await page.getByText('CSS', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('style.css')).toBeVisible();

  await page.getByText('Image', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('image.png')).toBeVisible();

  await page.getByText('Fetch', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('endpoint')).toBeVisible();

  await page.getByText('HTML', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('network.html')).toBeVisible();

  await page.getByText('Font', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('font.woff2')).toBeVisible();
});

test('should filter network requests by url', async ({ runUITest, server }) => {
  const { page } = await runUITest({
    'network-tab.test.ts': `
      import { test, expect } from '@playwright/test';
      test('network tab test', async ({ page }) => {
        await page.goto('${server.PREFIX}/network-tab/network.html');
      });
    `,
  });

  await page.getByText('network tab test').dblclick();
  await page.getByText('Network', { exact: true }).click();

  const networkItems = page.getByTestId('network-list').getByRole('listitem');

  await page.getByPlaceholder('Filter network').fill('script.');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('script.js')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('png');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('image.png')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('api/');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('endpoint')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('End');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('endpoint')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('FON');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('font.woff2')).toBeVisible();
});

test('should copy network requests as cURL', async ({  runUITest, server }) => {
  server.setRoute('/api/endpoint', (_, res) => res.setHeader('Content-Type', 'application/json').end('{"ok": true}'));
  server.setRoute('/post-call', async (req, res) => {
    const body = await req.postBody.then(body => body.toString());
    res.setHeader('Content-Type', 'application/json').end(body);
  });

  const { page } = await runUITest({
    'network-tab.test.ts': `
      import { test, expect } from '@playwright/test';

      test('network tab test', async ({ page }) => {
        await page.goto('${server.PREFIX}/network-tab/network.html');
      });
    `,
  });

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.getByText('network tab test').dblclick();
  await page.getByText('Network', { exact: true }).click();

  const networkItems = page.getByTestId('network-list').getByRole('listitem');

  await networkItems.getByText('endpoint', { exact: true }).click({ button: 'right' });
  await page.getByText('Copy as cURL').click();
  exec(await getCopiedText(page), (_, result) => expect(result).toBe('{"ok": true}'));

  await networkItems.getByText('post-call').click({ button: 'right' });
  await page.getByText('Copy as cURL').click();
  exec(await getCopiedText(page), (_, result) => expect(result).toBe('{"body":{"key":"value"}}'));

  await networkItems.getByText('style.css').click({ button: 'right' });
  await page.getByText('Copy as cURL').click();
  console.log(process.platform);
  exec(await getCopiedText(page), (_, result) => expect(result).toBe('.network-tab { background-color: white; }'));

  await networkItems.getByText('image.png').click({ button: 'right' });
  await page.getByText('Copy as cURL').click();
  // assertCurlResult(await getCopiedText(page), 'xx');
});

function getCopiedText(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

