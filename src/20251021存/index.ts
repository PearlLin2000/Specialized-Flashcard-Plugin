//import { Plugin, fetchPost } from "siyuan";
import {
  Plugin,
  showMessage,
  confirm,
  Dialog,
  Menu,
  openTab,
  adaptHotkey,
  getFrontend,
  getBackend,
  // Setting,
  fetchSyncPost,
  //fetchPost,
  Protyle,
  openWindow,
  IOperation,
  Constants,
  openMobileFileById,
  lockScreen,
  ICard,
  ICardData,
  Custom,
  exitSiYuan,
  getModelByDockType,
  getAllEditor,
  Files,
  platformUtils,
  openSetting,
  openAttributePanel,
  saveLayout,
} from "siyuan";
import "./index.scss";
import { IMenuItem } from "siyuan/types";

import HelloExample from "@/hello.svelte";
import SettingExample from "@/setting-example.svelte";

import { SettingUtils } from "./libs/setting-utils";
import { svelteDialog } from "./libs/dialog";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {
  private custom: () => Custom;
  private isMobile: boolean;
  private blockIconEventBindThis = this.blockIconEvent.bind(this);
  private settingUtils: SettingUtils;
  /*
  updateProtyleToolbar(toolbar: Array<string | IMenuItem>) {
    toolbar.push("|");
    toolbar.push({
      name: "insert-smail-emoji",
      icon: "iconEmoji",
      hotkey: "⇧⌘I",
      tipPosition: "n",
      tip: this.i18n.insertEmoji,
      click(protyle: Protyle) {
        protyle.insert("😊");
      },
    });
    return toolbar;
  }
*/
  async onload() {
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

    console.log("loading plugin-sample", this.i18n);

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    // 图标的制作参见帮助文档
    this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>`);

    let tabDiv = document.createElement("div");
    let app = null;
    this.custom = this.addTab({
      type: TAB_TYPE,
      init() {
        app = new HelloExample({
          target: tabDiv,
          props: {
            app: this.app,
            blockID: this.data.blockID,
          },
        });
        this.element.appendChild(tabDiv);
        console.log(this.element);
      },
      beforeDestroy() {
        console.log("before destroy tab:", TAB_TYPE);
      },
      destroy() {
        app?.$destroy();
        console.log("destroy tab:", TAB_TYPE);
      },
    });
    /*
    this.addCommand({
      langKey: "showDialog",
      hotkey: "⇧⌘O",
      callback: () => {
        this.showDialog();
      },
    });

    this.addCommand({
      langKey: "getTab",
      hotkey: "⇧⌘M",
      globalCallback: () => {
        console.log(this.getOpenedTab());
      },
    });

    this.addDock({
      config: {
        position: "LeftBottom",
        size: { width: 200, height: 0 },
        icon: "iconSaving",
        title: "Custom Dock",
        hotkey: "⌥⌘W",
      },
      data: {
        text: "This is my custom dock",
      },
      type: DOCK_TYPE,
      resize() {
        console.log(DOCK_TYPE + " resize");
      },
      update() {
        console.log(DOCK_TYPE + " update");
      },
      init: (dock) => {
        if (this.isMobile) {
          dock.element.innerHTML = `<div class="toolbar toolbar--border toolbar--dark">
                    <svg class="toolbar__icon"><use xlink:href="#iconEmoji"></use></svg>
                        <div class="toolbar__text">Custom Dock</div>
                    </div>
                    <div class="fn__flex-1 plugin-sample__custom-dock">
                        ${dock.data.text}
                    </div>
                    </div>`;
        } else {
          dock.element.innerHTML = `<div class="fn__flex-1 fn__flex-column">
                    <div class="block__icons">
                        <div class="block__logo">
                            <svg class="block__logoicon"><use xlink:href="#iconEmoji"></use></svg>
                            Custom Dock
                        </div>
                        <span class="fn__flex-1 fn__space"></span>
                        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey(
                          "⌘W"
                        )}"><svg class="block__logoicon"><use xlink:href="#iconMin"></use></svg></span>
                    </div>
                    <div class="fn__flex-1 plugin-sample__custom-dock">
                        ${dock.data.text}
                    </div>
                    </div>`;
        }
      },
      destroy() {
        console.log("destroy dock:", DOCK_TYPE);
      },
    });*/

    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
    });
    this.settingUtils.addItem({
      key: "Input",
      value: "",
      type: "textinput",
      title: "Readonly text",
      description: "Input description",
      action: {
        // Called when focus is lost and content changes
        callback: () => {
          // Return data and save it in real time
          let value = this.settingUtils.takeAndSave("Input");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "InputArea",
      value: "",
      type: "textarea",
      title: "Readonly text",
      description: "Input description",
      // Called when focus is lost and content changes
      action: {
        callback: () => {
          // Read data in real time
          let value = this.settingUtils.take("InputArea");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Check",
      value: true,
      type: "checkbox",
      title: "Checkbox text",
      description: "Check description",
      action: {
        callback: () => {
          // Return data and save it in real time
          let value = !this.settingUtils.get("Check");
          this.settingUtils.set("Check", value);
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Select",
      value: 1,
      type: "select",
      title: "Select",
      description: "Select description",
      options: {
        1: "Option 1",
        2: "Option 2",
      },
      action: {
        callback: () => {
          // Read data in real time
          let value = this.settingUtils.take("Select");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Slider",
      value: 50,
      type: "slider",
      title: "Slider text",
      description: "Slider description",
      direction: "column",
      slider: {
        min: 0,
        max: 100,
        step: 1,
      },
      action: {
        callback: () => {
          // Read data in real time
          let value = this.settingUtils.take("Slider");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Btn",
      value: "",
      type: "button",
      title: "Button",
      description: "Button description",
      button: {
        label: "Button",
        callback: () => {
          showMessage("Button clicked");
        },
      },
    });
    this.settingUtils.addItem({
      key: "Custom Element",
      value: "",
      type: "custom",
      direction: "row",
      title: "Custom Element",
      description: "Custom Element description",
      //Any custom element must offer the following methods
      createElement: (currentVal: any) => {
        let div = document.createElement("div");
        div.style.border = "1px solid var(--b3-theme-primary)";
        div.contentEditable = "true";
        div.textContent = currentVal;
        return div;
      },
      getEleVal: (ele: HTMLElement) => {
        return ele.textContent;
      },
      setEleVal: (ele: HTMLElement, val: any) => {
        ele.textContent = val;
      },
    });
    this.settingUtils.addItem({
      key: "Hint",
      value: "",
      type: "hint",
      title: this.i18n.hintTitle,
      description: this.i18n.hintDesc,
    });

    try {
      this.settingUtils.load();
    } catch (error) {
      console.error(
        "Error loading settings storage, probably empty config json:",
        error
      );
    }
    /*
    this.protyleSlash = [
      {
        filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
        html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.insertEmoji}</span><span class="b3-list-item__meta">😊</span></div>`,
        id: "insertEmoji",
        callback(protyle: Protyle) {
          protyle.insert("😊");
        },
      },
    ];
*/
    this.protyleOptions = {
      toolbar: [
        "block-ref",
        "a",
        "|",
        "text",
        "strong",
        "em",
        "u",
        "s",
        "mark",
        "sup",
        "sub",
        "clear",
        "|",
        "code",
        "kbd",
        "tag",
        "inline-math",
        "inline-memo",
      ],
    };

    /*this.addTopBar({
      icon: "iconRiffCard",
      title: "随机闪卡复习",
      callback: () => {
        // 点击图标时调用主功能方法
        this.createBuiltinRiffCards("逸码");
        //this.createBuiltinRiffCards("MPA");
        this.createCustomRiffCards(
  "SELECT * FROM blocks WHERE tag LIKE '%#新标签#%'",
  "新分组"
);
      },
    });*/

    console.log(this.i18n.helloPlugin);
  }

  onLayoutReady() {
    const topBarElement = this.addTopBar({
      icon: "iconSparkles",
      title: this.i18n.addTopBarIcon,
      position: "right",
      callback: () => {
        if (this.isMobile) {
          this.addMenu();
        } else {
          let rect = topBarElement.getBoundingClientRect();
          // 如果被隐藏，则使用更多按钮
          if (rect.width === 0) {
            rect = document.querySelector("#barMore").getBoundingClientRect();
          }
          if (rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              .getBoundingClientRect();
          }
          this.addMenu(rect);
        }
      },
    });

    const statusIconTemp = document.createElement("template");
    statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
    <svg>
        <use xlink:href="#iconTrashcan"></use>
    </svg>
</div>`;
    statusIconTemp.content.firstElementChild.addEventListener("click", () => {
      confirm(
        "⚠️",
        this.i18n.confirmRemove.replace("${name}", this.name),
        () => {
          this.removeData(STORAGE_NAME).then(() => {
            this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
            showMessage(`[${this.name}]: ${this.i18n.removedData}`);
          });
        }
      );
    });
    this.addStatusBar({
      element: statusIconTemp.content.firstElementChild as HTMLElement,
    });
    // this.loadData(STORAGE_NAME);
    this.settingUtils.load();
    console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);

    console.log(
      "Official settings value calling example:\n" +
        this.settingUtils.get("InputArea") +
        "\n" +
        this.settingUtils.get("Slider") +
        "\n" +
        this.settingUtils.get("Select") +
        "\n"
    );
  }

  async onunload() {
    console.log(this.i18n.byePlugin);
    showMessage("Goodbye SiYuan Plugin");
    console.log("onunload");
  }

  uninstall() {
    console.log("uninstall");
  }

  async updateCards(options: ICardData) {
    options.cards.sort((a: ICard, b: ICard) => {
      if (a.blockID < b.blockID) {
        return -1;
      }
      if (a.blockID > b.blockID) {
        return 1;
      }
      return 0;
    });
    return options;
  }
  /**
   * A custom setting pannel provided by svelte
   */
  openSetting(): void {
    let dialog = new Dialog({
      title: "SettingPannel",
      content: `<div id="SettingPanel" style="height: 100%;"></div>`,
      width: "800px",
      destroyCallback: (options) => {
        console.log("destroyCallback", options);
        //You'd better destroy the component when the dialog is closed
        pannel.$destroy();
      },
    });
    let pannel = new SettingExample({
      target: dialog.element.querySelector("#SettingPanel"),
    });
  }

  private eventBusPaste(event: any) {
    // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
    event.preventDefault();
    // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
    event.detail.resolve({
      textPlain: event.detail.textPlain.trim(),
    });
  }

  private eventBusLog({ detail }: any) {
    console.log(detail);
  }

  private blockIconEvent({ detail }: any) {
    detail.menu.addItem({
      id: "pluginSample_removeSpace",
      iconHTML: "",
      label: this.i18n.removeSpace,
      click: () => {
        const doOperations: IOperation[] = [];
        detail.blockElements.forEach((item: HTMLElement) => {
          const editElement = item.querySelector('[contenteditable="true"]');
          if (editElement) {
            editElement.textContent = editElement.textContent.replace(/ /g, "");
            doOperations.push({
              id: item.dataset.nodeId,
              data: item.outerHTML,
              action: "update",
            });
          }
        });
        detail.protyle.getInstance().transaction(doOperations);
      },
    });
  }

  /*private showDialog() {
    const docId = this.getEditor().protyle.block.rootID;
    svelteDialog({
      title: `SiYuan ${Constants.SIYUAN_VERSION}`,
      width: this.isMobile ? "92vw" : "720px",
      constructor: (container: HTMLElement) => {
        return new HelloExample({
          target: container,
          props: {
            app: this.app,
            blockID: docId,
          },
        });
      },
    });
  }*/

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("topBarSample", () => {
      console.log(this.i18n.byeMenu);
    });
    menu.addItem({
      icon: "iconSettings",
      label: "插件设置",
      click: () => {
        this.openSetting();
      },
    });
    menu.addSeparator();
    menu.addItem({
      icon: "iconRiffCard",
      label: "逸码",
      click: () => {
        this.createBuiltinRiffCards("逸码");
      },
    });
    menu.addItem({
      icon: "iconRiffCard",
      label: "MPA",
      click: () => {
        this.createBuiltinRiffCards("MPA");
      },
    });
    menu.addItem({
      icon: "iconRiffCard",
      label: "白话",
      click: () => {
        this.createBuiltinRiffCards("白话");
      },
    });
    menu.addItem({
      icon: "iconRiffCard",
      label: "视频",
      click: () => {
        this.createBuiltinRiffCards("视频");
      },
    });
    /*menu.addItem({
      icon: "iconScrollHoriz",
      label: "Event Bus",
      type: "submenu",
      submenu: [
        {
          icon: "iconSelect",
          label: "On ws-main",
          click: () => {
            this.eventBus.on("ws-main", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off ws-main",
          click: () => {
            this.eventBus.off("ws-main", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On click-blockicon",
          click: () => {
            this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
          },
        },
        {
          icon: "iconClose",
          label: "Off click-blockicon",
          click: () => {
            this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
          },
        },
        {
          icon: "iconSelect",
          label: "On click-pdf",
          click: () => {
            this.eventBus.on("click-pdf", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off click-pdf",
          click: () => {
            this.eventBus.off("click-pdf", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On click-editorcontent",
          click: () => {
            this.eventBus.on("click-editorcontent", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off click-editorcontent",
          click: () => {
            this.eventBus.off("click-editorcontent", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On click-editortitleicon",
          click: () => {
            this.eventBus.on("click-editortitleicon", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off click-editortitleicon",
          click: () => {
            this.eventBus.off("click-editortitleicon", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On click-flashcard-action",
          click: () => {
            this.eventBus.on("click-flashcard-action", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off click-flashcard-action",
          click: () => {
            this.eventBus.off("click-flashcard-action", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-noneditableblock",
          click: () => {
            this.eventBus.on("open-noneditableblock", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-noneditableblock",
          click: () => {
            this.eventBus.off("open-noneditableblock", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On loaded-protyle-static",
          click: () => {
            this.eventBus.on("loaded-protyle-static", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off loaded-protyle-static",
          click: () => {
            this.eventBus.off("loaded-protyle-static", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On loaded-protyle-dynamic",
          click: () => {
            this.eventBus.on("loaded-protyle-dynamic", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off loaded-protyle-dynamic",
          click: () => {
            this.eventBus.off("loaded-protyle-dynamic", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On switch-protyle",
          click: () => {
            this.eventBus.on("switch-protyle", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off switch-protyle",
          click: () => {
            this.eventBus.off("switch-protyle", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On destroy-protyle",
          click: () => {
            this.eventBus.on("destroy-protyle", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off destroy-protyle",
          click: () => {
            this.eventBus.off("destroy-protyle", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-doctree",
          click: () => {
            this.eventBus.on("open-menu-doctree", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-doctree",
          click: () => {
            this.eventBus.off("open-menu-doctree", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-blockref",
          click: () => {
            this.eventBus.on("open-menu-blockref", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-blockref",
          click: () => {
            this.eventBus.off("open-menu-blockref", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-fileannotationref",
          click: () => {
            this.eventBus.on("open-menu-fileannotationref", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-fileannotationref",
          click: () => {
            this.eventBus.off("open-menu-fileannotationref", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-tag",
          click: () => {
            this.eventBus.on("open-menu-tag", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-tag",
          click: () => {
            this.eventBus.off("open-menu-tag", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-link",
          click: () => {
            this.eventBus.on("open-menu-link", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-link",
          click: () => {
            this.eventBus.off("open-menu-link", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-image",
          click: () => {
            this.eventBus.on("open-menu-image", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-image",
          click: () => {
            this.eventBus.off("open-menu-image", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-av",
          click: () => {
            this.eventBus.on("open-menu-av", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-av",
          click: () => {
            this.eventBus.off("open-menu-av", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-content",
          click: () => {
            this.eventBus.on("open-menu-content", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-content",
          click: () => {
            this.eventBus.off("open-menu-content", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-breadcrumbmore",
          click: () => {
            this.eventBus.on("open-menu-breadcrumbmore", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-breadcrumbmore",
          click: () => {
            this.eventBus.off("open-menu-breadcrumbmore", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-menu-inbox",
          click: () => {
            this.eventBus.on("open-menu-inbox", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-menu-inbox",
          click: () => {
            this.eventBus.off("open-menu-inbox", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On input-search",
          click: () => {
            this.eventBus.on("input-search", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off input-search",
          click: () => {
            this.eventBus.off("input-search", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On paste",
          click: () => {
            this.eventBus.on("paste", this.eventBusPaste);
          },
        },
        {
          icon: "iconClose",
          label: "Off paste",
          click: () => {
            this.eventBus.off("paste", this.eventBusPaste);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-siyuan-url-plugin",
          click: () => {
            this.eventBus.on("open-siyuan-url-plugin", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-siyuan-url-plugin",
          click: () => {
            this.eventBus.off("open-siyuan-url-plugin", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On open-siyuan-url-block",
          click: () => {
            this.eventBus.on("open-siyuan-url-block", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off open-siyuan-url-block",
          click: () => {
            this.eventBus.off("open-siyuan-url-block", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On opened-notebook",
          click: () => {
            this.eventBus.on("opened-notebook", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off opened-notebook",
          click: () => {
            this.eventBus.off("opened-notebook", this.eventBusLog);
          },
        },
        {
          icon: "iconSelect",
          label: "On closed-notebook",
          click: () => {
            this.eventBus.on("closed-notebook", this.eventBusLog);
          },
        },
        {
          icon: "iconClose",
          label: "Off closed-notebook",
          click: () => {
            this.eventBus.off("closed-notebook", this.eventBusLog);
          },
        },
      ],
    });
    menu.addSeparator();
    menu.addItem({
      icon: "iconSparkles",
      label: this.data[STORAGE_NAME].readonlyText || "Readonly",
      type: "readonly",
    });*/
    if (this.isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    }
  }
  /*
  private getEditor() {
    const editors = getAllEditor();
    if (editors.length === 0) {
      showMessage("please open doc first");
      return;
    }
    return editors[0];
  }*/

  // 防抖函数
  private debounce<F extends (...args: any[]) => any>(
    func: F,
    wait: number
  ): (...args: Parameters<F>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 内置分组配置
  private readonly BUILTIN_GROUPS = {
    逸码: "SELECT * FROM blocks WHERE tag LIKE '%#逸码#%' limit 999",
    MPA: "select * from blocks where id in ( select block_id from refs where def_block_id in ( select id from blocks where path like '%20250917151103-dwg4i20%' ) limit 999)",
    白话: "select * from blocks where id in ( select block_id from refs where def_block_id in ( select id from blocks where path like '%20251013193453-iighn2n%' ) limit 999)",
    视频: "SELECT * FROM blocks WHERE (markdown LIKE '%.mp4%' OR markdown LIKE '%https://www.bilibili.com/video/BV%') AND id IN (SELECT block_id FROM attributes WHERE name = 'custom-riff-decks') LIMIT 999",
    // 预留拓展空间：可在此继续添加新的分组配置
  };

  // 防抖版本的createCustomRiffCards（500ms防抖）
  private readonly debouncedCreateCustomRiffCards = this.debounce(
    (sqlQuery: string, groupName: string) => {
      this.createSpecificRiffCards(sqlQuery, groupName);
    },
    500
  );

  // 标准调用接口 - 内置分组
  private async createBuiltinRiffCards(
    groupName: keyof typeof this.BUILTIN_GROUPS
  ) {
    const sqlQuery = this.BUILTIN_GROUPS[groupName];
    if (!sqlQuery) {
      console.error(`未找到组别 "${groupName}" 的配置`);
      return;
    }
    await this.createSpecificRiffCards(sqlQuery, groupName);
  }

  // 自定义调用接口 - 保留灵活性（使用防抖版本）
  private async createCustomRiffCards(sqlQuery: string, groupName: string) {
    // 使用防抖版本，避免频繁调用
    this.debouncedCreateCustomRiffCards(sqlQuery, groupName);
  }

  // 主要的闪卡创建函数
  private async createSpecificRiffCards(sqlQuery: string, groupName: string) {
    try {
      const deckID = "20230218211946-2kw8jgx";

      // 步骤1: 使用传入的SQL查询语句
      const sql = sqlQuery;
      const sqlResult = await fetchSyncPost("/api/query/sql", { stmt: sql });

      console.log("通过SQL获取的blocks数据:", sqlResult.data);

      // 步骤2: 递归向上查找具有闪卡属性的块
      const finalBlockIds = await this.recursiveFindCardBlocks(sqlResult.data);
      console.log("递归查找后的最终blockIDs:", finalBlockIds);

      // 步骤3: 获取dueriff卡片数据
      const duecardsResponse = await fetchSyncPost(
        "/api/riff/getRiffDueCards",
        {
          deckID: deckID,
        }
      );

      console.log("获取dueriff卡片的数据:", duecardsResponse);

      // 步骤4: 根据最终blockIDs过滤卡片数据
      const filteredCards = duecardsResponse.data.cards.filter((card: any) =>
        finalBlockIds.includes(card.blockID)
      );

      console.log("过滤后的卡片数据:", filteredCards);

      // 步骤5: 构建新的cardsData结构
      const newCardsData = {
        cards: filteredCards,
        unreviewedCount: filteredCards.length,
        unreviewedNewCardCount: filteredCards.filter(
          (card: any) => card.state === 0
        ).length,
        unreviewedOldCardCount: filteredCards.filter(
          (card: any) => card.state !== 0
        ).length,
      };

      console.log("新构建的cardsData:", newCardsData);

      // 步骤6: 使用过滤后的数据打开卡片复习页签
      openTab({
        app: this.app,
        custom: {
          title: `${groupName}-专项闪卡`,
          icon: "iconRiffCard",
          id: "siyuan-card",
          data: {
            cardType: "all",
            id: "",
            title: "自定义闪卡",
            cardsData: newCardsData,
          },
        },
      });
    } catch (error) {
      console.log("创建特定riff卡片时发生错误:", error);
    }
  }

  // 递归查找具有闪卡属性的块
  private async recursiveFindCardBlocks(
    startingBlocks: any[]
  ): Promise<string[]> {
    const MAX_DEPTH = 5; // 使用固定值，或者可以从配置获取
    const foundBlocks = new Set<string>();

    const findRecursive = async (
      blockIds: string[],
      depth = 0
    ): Promise<void> => {
      if (depth >= MAX_DEPTH || blockIds.length === 0) return;

      // 检查当前层级块是否具有闪卡属性
      const attributeResults = await Promise.all(
        blockIds.map((blockId) => this.checkBlockHasCardAttribute(blockId))
      );

      // 收集具有属性的块
      attributeResults
        .filter(({ hasAttribute }) => hasAttribute)
        .forEach(({ blockId }) => foundBlocks.add(blockId));

      // 继续向上查找未找到属性的块
      const blocksToContinue = attributeResults
        .filter(({ hasAttribute }) => !hasAttribute)
        .map(({ blockId }) => blockId);

      if (blocksToContinue.length === 0) return;

      // 获取父块继续递归
      const parentIds = await this.getParentBlocks(blocksToContinue);
      const validParentIds = parentIds.filter((id) => id);

      if (validParentIds.length > 0) {
        await findRecursive(validParentIds, depth + 1);
      }
    };

    const startingBlockIds = startingBlocks.map((block) => block.id);
    await findRecursive(startingBlockIds);

    return Array.from(foundBlocks);
  }

  // 检查块是否具有闪卡属性
  private async checkBlockHasCardAttribute(
    blockId: string
  ): Promise<{ blockId: string; hasAttribute: boolean }> {
    const attributeQuery = `SELECT 1 FROM attributes WHERE block_id = '${blockId}' AND name = 'custom-riff-decks' LIMIT 1`;
    const result = await fetchSyncPost("/api/query/sql", {
      stmt: attributeQuery,
    });
    return { blockId, hasAttribute: result?.data?.length > 0 };
  }

  // 获取父块ID
  private async getParentBlocks(blockIds: string[]): Promise<string[]> {
    if (blockIds.length === 0) return [];
    const idList = blockIds.map((id) => `'${id}'`).join(",");
    const parentQuery = `SELECT parent_id FROM blocks WHERE id IN (${idList}) AND parent_id IS NOT NULL`;
    const result = await fetchSyncPost("/api/query/sql", { stmt: parentQuery });
    return result.data
      .map((block: any) => block.parent_id)
      .filter((id: string) => id);
  }
}
