/* -*- indent-tabs-mode: nil; tab-width: 2; -*- */
/* vim: set ts=2 sw=2 et ai : */
/**
  Copyright (C) 2023 WebExtensions Experts Group

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  @license
*/

import browser from 'webextension-polyfill';
import { structuredDeserialize, structuredSerialize } from 'weeg-serializer';

export class TabValueService {
  private static readonly INSTANCE = new TabValueService();

  public static getInstance(): TabValueService {
    return TabValueService.INSTANCE;
  }

  public async getTabValue<T>(tabId: number, key: string): Promise<T | undefined> {
    if (!browser.sessions) {
      return undefined;
    }
    const value = await browser.sessions.getTabValue(tabId, key) as string | undefined;
    if (value == undefined) {
      return undefined;
    }
    return structuredDeserialize(value) as T;
  }

  public async setTabValue<T>(tabId: number, key: string, value: T): Promise<void> {
    if (!browser.sessions) {
      return;
    }
    await browser.sessions.setTabValue(tabId, key, structuredSerialize(value));
  }

  public async removeTabValue(tabId: number, key: string): Promise<void> {
    if (!browser.sessions) {
      return;
    }
    await browser.sessions.removeTabValue(tabId, key);
  }
}
