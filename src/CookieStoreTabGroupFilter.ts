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

import browser from "webextension-polyfill";
import { CompatTab } from "./CompatTab";
import { TabGroupFilter } from "./TabGroupFilter";

export class CookieStoreTabGroupFilter implements TabGroupFilter {
  public readonly cookieStoreId: string;

  public constructor(cookieStoreId: string) {
    this.cookieStoreId = cookieStoreId;
  }

  public async getTabs(): Promise<CompatTab[]> {
    return (await browser.tabs.query({
      cookieStoreId: this.cookieStoreId,
    })).map(tab => new CompatTab(tab));
  }

  public async filterTabs(tabs: CompatTab[]): Promise<CompatTab[]> {
    return tabs.filter((tab) => tab.cookieStore.id == this.cookieStoreId);
  }
}
