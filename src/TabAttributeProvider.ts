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

import { ExtensibleAttributeDictionary, ExtensibleAttributeProvider, ExtensibleAttributeSet } from "weeg-utils";
import { CompatTab } from "./CompatTab";

export class TabAttributeProvider implements ExtensibleAttributeProvider<CompatTab> {
  public async getAttributeSets(tabs: Iterable<CompatTab>): Promise<ExtensibleAttributeSet<CompatTab>[]> {
    const tabArray = Array.from(tabs);
    return (await Promise.all([... tabs].map((tab) => {
      return tab.getTabValue<ExtensibleAttributeDictionary>("weeg.tabAttributes");
    }))).map((attributesDictionary, index) => {
      const tab = tabArray[index] as CompatTab;
      return new ExtensibleAttributeSet(tab, attributesDictionary ?? {});
    });
  }

  public async saveAttributeSets(attributeSets: Iterable<ExtensibleAttributeSet<CompatTab>>): Promise<void> {
    for (const attributeSet of attributeSets) {
      await attributeSet.target.setTabValue("weeg.tabAttributes", attributeSet.getAttributeDictionary());
    }
  }
}
