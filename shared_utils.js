/* Messaging request keys */
var HOLD_KEY_MSG = "hold_key";
var HOTKEY_MSG = "hotkey";
var REFRESH_MSG = "refresh";
var UPDATE_HOLD_KEY_MSG = "update_hold_key";
var TAB_ID_KEY = "tab_id";
var WINDOW_ID_KEY = "window_id";

// Chrome tabs API functions options keys.
var ACTIVE = "active";
var CURRENT_WINDOW = "currentWindow";
var CURRENT_TAB = "currentTab";
var FOCUSED = "focused";
var URL = "url";
var INDEX = "index";

/* Chrome e.key values */
// TODO: Allow customization of these.
var NAV_LEFT_KEYVAL = "[";
var NAV_RIGHT_KEYVAL = "]";
var MOVE_LEFT_KEYVAL = "{";
var MOVE_RIGHT_KEYVAL = "}";
var TAB_CLOSE_KEYVAL = ";";
var TAB_SEARCH_KEYVAL = "/";
var NAV_PREVIOUS_KEYVAL = " ";
// For tab search page.
var ENTER_KEYVAL = "Enter";
var ARROW_UP_KEYVAL = "ArrowUp";
var ARROW_DOWN_KEYVAL = "ArrowDown";

/* Extension page URLs */
var SEARCH_URL = "tab_search.html";

/* Chrome storage keys and default values */
var HOLD_KEY_KEY = "hold_key";
var HOLD_KEY_DEFAULT = "Escape";
var HOTKEYS_KEY = "hotkeys";
var HOTKEYS_DEFAULT = [];
var DOMAIN_KEY = "domain";
var HOTKEY_KEY = "hotkey";
var DEDUPLICATE_KEY = "deduplicate";

/* JavaScript event names */
var INPUT = "input";
var KEYDOWN = "keydown";
var KEYPRESS = "keypress";
var KEYUP = "keyup";

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
