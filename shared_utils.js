/* Messaging request keys */
var HOLDKEY_MSG = "holdKey";
var HOTKEY_MSG = "hotkey";
var REFRESH_MSG = "refresh";

// Chrome tabs API functions options keys.
var ACTIVE = "active";
var CURRENT_WINDOW = "currentWindow";
var CURRENT_TAB = "currentTab";
var FOCUSED = "focused";
var URL = "url";

/* Key codes + symbols */
// TODO: Allow customization. For now:
// 27 = Esc
// 91 = [
// 93 = ]
// 59 = ;
// 47 = /
var HOTKEY_HOLD_KEY_CODE = 27;
var NAV_LEFT_KEY_CODE = 91;
var NAV_RIGHT_KEY_CODE = 93;
var TAB_CLOSE_KEY_CODE = 59;
var TAB_SEARCH_KEY_CODE = 47;
// Hotkey symbols.
var NAV_LEFT_SYMBOL = '[';
var NAV_RIGHT_SYMBOL = ']';
var TAB_CLOSE_SYMBOL = ';';
var TAB_SEARCH_SYMBOL = '/';
// For tab search page.
var ENTER_KEY_CODE = 13;

/* Extension page URLs */
var SEARCH_URL = "tab_search.html";

/* Chrome storage keys and default values */
var HOTKEYS_KEY = "hotkeys";
var HOTKEYS_DEFAULT = [];
var DOMAIN_KEY = "domain"
var HOTKEY_KEY = "hotkey"
var DEDUPLICATE_KEY = "deduplicate"

/* JavaScript event names */
var INPUT = "input";
var KEYDOWN = "keydown";
var KEYPRESS = "keypress";
var KEYUP = "keyup";
