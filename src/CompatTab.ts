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
import { CookieStore } from "weeg-containers";
import { EventSink } from 'weeg-events';
import { RegistrableDomainService } from 'weeg-domains';

const registrableDomainService = RegistrableDomainService.getInstance<RegistrableDomainService>();

export class CompatTab {
  public static readonly onCreated = new EventSink<CompatTab>();
  public static readonly onClosed = new EventSink<number>();

  public readonly id: number;
  public readonly url: string;
  public readonly title: string;
  public readonly favIconUrl: string;
  public readonly windowId: number;
  public readonly discarded: boolean;
  public readonly hidden: boolean;
  public readonly active: boolean;
  public readonly pinned: boolean;
  public readonly index: number;
  public readonly isSharing: boolean;
  public readonly lastAccessed: number;
  public readonly muted: boolean;
  public readonly audible: boolean;

  public readonly cookieStore: CookieStore;

  public constructor(browserTab: browser.Tabs.Tab) {
    if (browserTab.id === undefined) {
      throw new Error("Tab ID is undefined");
    }
    this.id = browserTab.id;
    this.url = browserTab.url ?? "";
    this.title = browserTab.title ?? "";
    this.favIconUrl = browserTab.favIconUrl ?? "";
    this.windowId = browserTab.windowId ?? -1;
    this.index = browserTab.index;
    this.discarded = browserTab.discarded ?? false;
    this.hidden = browserTab.hidden ?? false;
    this.active = browserTab.active;
    this.pinned = browserTab.pinned;
    this.muted = browserTab.mutedInfo?.muted ?? false;
    this.lastAccessed = browserTab.lastAccessed ?? 0;
    this.audible = browserTab.audible ?? false;
    if (browserTab.sharingState !== undefined) {
      this.isSharing = this.checkSharingState(browserTab.sharingState);
    } else {
      this.isSharing = false;
    }
    if (browserTab.cookieStoreId) {
      this.cookieStore = new CookieStore(browserTab.cookieStoreId);
    } else if (browserTab.incognito) {
      this.cookieStore = CookieStore.PRIVATE;
    } else {
      this.cookieStore = CookieStore.DEFAULT;
    }
  }

  private checkSharingState(sharingState: browser.Tabs.SharingState): boolean {
    return (sharingState.screen != undefined)
      || (sharingState.microphone ?? false)
      || (sharingState.camera ?? false);
  }

  public get isPrivate(): boolean {
    return this.cookieStore.isPrivate;
  }

  /**
   * Active tabs are also unhidable. You should change the active tab before hiding it.
   * @returns true if the tab cannot be hidden
   */
  public canBeHidden(): boolean {
    return !this.isSharing && !this.pinned;
  }

  public async close(): Promise<void> {
    await browser.tabs.remove(this.id);
  }

  public async focus(): Promise<CompatTab> {
    await browser.windows.update(this.windowId, { focused: true });
    const browserTab = await browser.tabs.update(this.id, { active: true });
    return new CompatTab(browserTab);
  }

  private async changePinState(pinned: boolean): Promise<CompatTab> {
    const browserTab = await browser.tabs.update(this.id, { pinned });
    return new CompatTab(browserTab);
  }

  public async pin(): Promise<CompatTab> {
    return this.changePinState(true);
  }

  public async unpin(): Promise<CompatTab> {
    return this.changePinState(false);
  }

  public async move(newIndex: number): Promise<CompatTab> {
    const browserTab = await browser.tabs.move(this.id, { index: newIndex }) as browser.Tabs.Tab;
    return new CompatTab(browserTab);
  }

  public async getTabValue<T>(key: string): Promise<T | undefined> {
    if (!browser.sessions) {
      return undefined;
    }
    const value = await browser.sessions.getTabValue(this.id, key) as string | undefined;
    if (value === undefined) {
      return undefined;
    }
    return structuredDeserialize(value) as T;
  }

  public async setTabValue<T>(key: string, value: T): Promise<void> {
    if (!browser.sessions) {
      return;
    }
    await browser.sessions.setTabValue(this.id, key, structuredSerialize(value));
  }

  public async removeTabValue(key: string): Promise<void> {
    if (!browser.sessions) {
      return;
    }
    await browser.sessions.removeTabValue(this.id, key);
  }

  public async getRegistrableDomain(): Promise<string> {
    return registrableDomainService.getRegistrableDomain(this.url);
  }
}

browser.tabs.onCreated.addListener((browserTab) => {
  CompatTab.onCreated.dispatch(new CompatTab(browserTab));
});

browser.tabs.onRemoved.addListener((tabId) => {
  CompatTab.onClosed.dispatch(tabId);
});
