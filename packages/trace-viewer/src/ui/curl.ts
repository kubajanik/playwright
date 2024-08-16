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

import type { Entry } from '@trace/har';

function escapeString(str: string) {
  return `'` + str.replaceAll(`'`, `\'`) + `'`;
}

export async function generateCurlCommand({ request }: Entry) {
  console.log(request)
  const ignoredHeaders = new Set(['accept-encoding', 'host', 'method', 'path', 'scheme', 'version', 'authority', 'protocol']);
  const command = [];

  command.push(escapeString(request.url));

  command.push(`-X ${escapeString(request.method)}`);

  if (request.postData) {
    const rawBody = await fetch(`sha1/${request.postData._sha1}`).then(res => res.text());
    command.push(`--data-raw ${escapeString(rawBody)}`);
    ignoredHeaders.add('content-length');
  }

  for (const header of request.headers) {
    const name = header.name.replace(/^:/, '');
    const value = header.value.trim();

    if (ignoredHeaders.has(name.toLowerCase()) || !value)
      continue;

    command.push(`-H ${escapeString(name + ': ' + value)}`);
  }

  return 'curl ' + command.join(command.length > 3 ? ' \\\n' : ' ');
}
