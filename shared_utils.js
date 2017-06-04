/* Messaging request keys */
var HOLDKEY_MSG = "holdKey";
var HOTKEY_MSG = "hotkey";
var REFRESH_MSG = "refresh";
var SEARCH_NAV_MSG = "search_nav";
var TAB_ID_KEY = "tab_id";
var WINDOW_ID_KEY = "window_id";
var CURRENT_TAB_KEY = "current_tab";

// Chrome tabs API functions options keys.
var ACTIVE = "active";
var CURRENT_WINDOW = "currentWindow";
var CURRENT_TAB = "currentTab";
var FOCUSED = "focused";
var URL = "url";
var INDEX = "index";

/* Key codes + symbols */
// TODO: Allow customization. For now:
// 27 = Esc
// 91 = [
// 93 = ]
// 123 = {
// 125 = }
// 59 = ;
// 47 = /
// 32 = space
var HOTKEY_HOLD_KEY_CODE = 27;
var NAV_LEFT_KEY_CODE = 91;
var NAV_RIGHT_KEY_CODE = 93;
var MOVE_LEFT_KEY_CODE = 123;
var MOVE_RIGHT_KEY_CODE = 125;
var TAB_CLOSE_KEY_CODE = 59;
var TAB_SEARCH_KEY_CODE = 47;
var NAV_PREVIOUS_KEY_CODE = 32;
// Hotkey symbols.
var NAV_LEFT_SYMBOL = '[';
var NAV_RIGHT_SYMBOL = ']';
var MOVE_LEFT_SYMBOL = '{';
var MOVE_RIGHT_SYMBOL = '}';
var TAB_CLOSE_SYMBOL = ';';
var TAB_SEARCH_SYMBOL = '/';
var NAV_PREVIOUS_SYMBOL = ' ';
// For tab search page.
var ENTER_KEY_CODE = 13;

/* Extension page URLs */
var SEARCH_URL = "tab_search.html";

/* Chrome storage keys and default values */
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
