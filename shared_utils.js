/* Messaging request keys */
var BUILT_IN_HOTKEY_MSG = "built_in_hotkey";
var HOLD_KEY_MSG = "hold_key";
var HOTKEY_MSG = "hotkey";
var REFRESH_MSG = "refresh";
var TAB_ID_KEY = "tab_id";
var UPDATE_HOLD_KEY_MSG = "update_hold_key";
var WINDOW_ID_KEY = "window_id";

// Chrome tabs API functions options keys.
var ACTIVE = "active";
var CURRENT_WINDOW = "currentWindow";
var CURRENT_TAB = "currentTab";
var FOCUSED = "focused";
var URL = "url";
var INDEX = "index";

/* Chrome KeyboardEvent.code values */
// TODO: Allow customization of these.
var NAV_LEFT_CODE = "BracketLeft";
var NAV_RIGHT_CODE = "BracketRight";
var MOVE_LEFT_CODE = "BracketLeft.Shift";
var MOVE_RIGHT_CODE = "BracketRight.Shift";
var TAB_CLOSE_CODE = "Semicolon";
var TAB_SEARCH_CODE = "Slash";
var TAB_NEW_CODE = "Period";
var NAV_PREVIOUS_CODE = "Space";

var BUILT_IN_HOTKEYS = [
    NAV_LEFT_CODE,
    NAV_RIGHT_CODE,
    MOVE_LEFT_CODE,
    MOVE_RIGHT_CODE,
    TAB_CLOSE_CODE,
    TAB_SEARCH_CODE,
    NAV_PREVIOUS_CODE,
    TAB_NEW_CODE
];

// For tab search page.
var ENTER_KEYVAL = "Enter";
var ARROW_UP_KEYVAL = "ArrowUp";
var ARROW_DOWN_KEYVAL = "ArrowDown";

/* Extension page URLs */
var SEARCH_URL = "tab_search.html";
var ICON_48_URL = "icons/icon48.png";

/* JavaScript KeyboardEvent.key values for modifier keys */
var ESCAPE = "Escape";
var CONTROL = "Control";
var ALT = "Alt";
var META = "Meta";
var CONTEXT_MENU = "ContextMenu";

/* Chrome storage keys and default values */
var HOLD_KEY_KEY = "hold_key";
var HOLD_KEY_DEFAULT = ESCAPE;
var HOTKEYS_KEY = "hotkeys";
var HOTKEYS_DEFAULT = [];
var HOTKEY_KEY = "hotkey";
var TARGET_KEY = "target";
var DEDUPLICATE_KEY = "deduplicate";
var MATCH_PREFIX_KEY = "match_prefix";

/* JavaScript event names */
var INPUT = "input";
var KEYDOWN = "keydown";
var KEYPRESS = "keypress";
var KEYUP = "keyup";

/* JavaScript KeyboardEvent.code prefixes */
var ALPHA_PREFIX = "Key";

/* Mapping JavaScript KeyboardEvent keys to KeyboardEvent properties */
var KEY_TO_PROP = {};
KEY_TO_PROP[CONTROL] = "ctrlKey";
KEY_TO_PROP[ALT] = "altKey";
KEY_TO_PROP[META] = "metaKey";

/* Logging helpers */
var ERROR_LEVEL = 0;
var WARNING_LEVEL = 1;
var INFO_LEVEL = 2;
// Edit this to change logging behavior.
var LOGGING_LEVEL = INFO_LEVEL;

function LOG_INFO(msg) {
    if (LOGGING_LEVEL >= INFO_LEVEL) {
        console.log("I: " + msg);
    }
}
function LOG_WARNING(msg) {
    if (LOGGING_LEVEL >= WARNING_LEVEL) {
        console.log("W: " + msg);
    }
}
function LOG_ERROR(msg) {
    if (LOGGING_LEVEL >= ERROR_LEVEL) {
        console.log("E: " + msg);
    }
}
