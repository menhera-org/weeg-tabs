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

import { RegistrableDomainService } from 'weeg-domains';

import { AllTabGroupFilter } from './AllTabGroupFilter';
import { TabGroupFilter } from './TabGroupFilter';
import { CompatTab } from './CompatTab';

const registrableDomainService = RegistrableDomainService.getInstance<RegistrableDomainService>();

export class DomainTabGroupFilter implements TabGroupFilter {
  public readonly domain: string;

  public constructor(domain: string) {
    this.domain = domain;
  }

  public async getTabs(): Promise<CompatTab[]> {
    const tabs = await (new AllTabGroupFilter).getTabs();
    return await this.filterTabs(tabs);
  }

  public async filterTabs(tabs: CompatTab[]): Promise<CompatTab[]> {
    const tabUrls = tabs.map(tab => tab.url);
    const tabDomains = await registrableDomainService.getRegistrableDomains(tabUrls);
    const tabDomainMap = new WeakMap<CompatTab, string>();
    for (let i = 0; i < tabDomains.length; i++) {
      const tab = tabs[i] as CompatTab;
      tabDomainMap.set(tab, tabDomains[i] as string);
    }
    return tabs.filter((tab) => tabDomainMap.get(tab) == this.domain);
  }
}
