/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const AltTab = imports.ui.altTab;
const Main = imports.ui.main;

let injections = {};
let app_injections = {};

function init(metadata) {
}

function setKeybinding(name, func) {
    Main.wm.setCustomKeybindingHandler(name, Shell.KeyBindingMode.NORMAL, func);
}

function is_on_current_monitor(tab) {
    return (this == tab.get_monitor());
}

function _patchWindowList() {
    return function() {
    let workspace = this._settings.get_boolean('current-workspace-only') ? global.screen.get_active_workspace() : null;
    let tab_list = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
    return tab_list.filter(is_on_current_monitor, global.screen.get_current_monitor());
    };
}

function _patchInitialSelection() {
    return function(backward, binding) {
        this._select(0);
    };
}

function enable() {
    injections['_keyPressHandler'] = AltTab.WindowSwitcherPopup.prototype._keyPressHandler;
    injections['_getWindowList'] = AltTab.WindowSwitcherPopup.prototype._getWindowList;
    app_injections['_initialSelection'] = AltTab.AppSwitcherPopup.prototype._initialSelection;
    AltTab.WindowSwitcherPopup.prototype._getWindowList = _patchWindowList();
    AltTab.AppSwitcherPopup.prototype._initialSelection= _patchInitialSelection();
    AltTab.WindowSwitcherPopup.prototype._keyPressHandler = function(keysym, action) {
        switch(action) {
            case Meta.KeyBindingAction.SWITCH_APPLICATIONS:
            case Meta.KeyBindingAction.SWITCH_GROUP:
              action = Meta.KeyBindingAction.SWITCH_WINDOWS;
              break;
            case Meta.KeyBindingAction.SWITCH_APPLICATIONS_BACKWARD:
            case Meta.KeyBindingAction.SWITCH_GROUP_BACKWARD:
              action = Meta.KeyBindingAction.SWITCH_WINDOWS_BACKWARD;
              break;
        }
        return injections['_keyPressHandler'].call(this, keysym, action);
    };

    setKeybinding('switch-applications', Lang.bind(Main.wm, Main.wm._startWindowSwitcher));
    setKeybinding('switch-applications-backward', Lang.bind(Main.wm, Main.wm._startWindowSwitcher));
}

function disable() {
    var prop;

    setKeybinding('switch-applications', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
    setKeybinding('switch-applications-backward', Lang.bind(Main.wm, Main.wm._startAppSwitcher));

    for (prop in injections)
        AltTab.WindowSwitcherPopup.prototype[prop] = injections[prop];
    for (prop in app_injections)
        AltTab.AppSwitcherPopup.prototype[prop] = app_injections[prop];
}
