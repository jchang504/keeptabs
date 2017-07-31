/* Messaging request keys */
var HOTKEY_MSG = "hotkey";
var REFRESH_MSG = "refresh";
var UPDATE_HOLD_KEY_MSG = "update_hold_key";
var SEARCH_TABS_MSG = "search_tabs";
var SEARCH_SELECT_MSG = "search_select";
var HOLD_RELEASE_MSG = "hold_release";
var TAB_ID_KEY = "tab_id";
var WINDOW_ID_KEY = "window_id";

// Chrome tabs API functions options keys.
var ACTIVE = "active";
var CURRENT_WINDOW = "currentWindow";
var CURRENT_TAB = "currentTab";
var FOCUSED = "focused";
var URL = "url";
var INDEX = "index";

// Chrome KeyboardEvent.key values for hold key choices and shift.
var CONTROL = "Control";
var ALT = "Alt";
var META = "Meta";
var SHIFT = "Shift";

// Chrome KeyboardEvent.code values
// TODO: Allow customization of these.
// Nav ([/]) and move ({/}) share the same code; we add SHIFT to the end to
// indicate when the shift modifier was on.
var NAV_LEFT_CODE = "BracketLeft";
var NAV_RIGHT_CODE = "BracketRight";
var MOVE_LEFT_CODE = "BracketLeftShift";
var MOVE_RIGHT_CODE = "BracketRightShift";
var TAB_CLOSE_CODE = "Semicolon";
var TAB_SEARCH_CODE = "Slash";
var NAV_PREVIOUS_CODE = "Space";
var TAB_NEW_CODE = "Period";

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

// Chrome KeyboardEvent.code prefixes
var ALPHA_PREFIX = "Key";

// Maps hold key choices to KeyboardEvent modifier property.
var HOLD_KEY_TO_MODIFIER = {
    [CONTROL]: "ctrlKey",
    [ALT]: "altKey",
    [META]: "metaKey"
}
// Other modifiers.
var SHIFT_MODIFIER = "shiftKey";

// For tab search page.
var ENTER_KEYVAL = "Enter";
var ARROW_UP_KEYVAL = "ArrowUp";
var ARROW_DOWN_KEYVAL = "ArrowDown";

/* Extension page URLs */
var SEARCH_URL = "tab_search.html";
var ICON_128_URL = "icons/icon128.png";

/* Chrome storage keys and default values */
var OS_KEY = "operating_system";
var HOLD_KEY_KEY = "hold_key";
// Indicates no hold key choice saved in options, so use OS default.
var HOLD_KEY_EMPTY = null;
var HOTKEYS_KEY = "hotkeys";
var HOTKEYS_DEFAULT = [];
var HOTKEY_KEY = "hotkey";
var TARGET_KEY = "target";
var USE_TARGET_KEY = "use_target";
var MATCH_PREFIX_KEY = "match_prefix";
var ALWAYS_KEY = "always";

// Possible values of chrome.runtime.getPlatformInfo().PlatformOS:
var MAC_OS = "mac";
var WINDOWS_OS = "win";
// We should never be running on this, but in case they're faking their OS.
var ANDROID_OS = "android";
var CHROME_OS = "cros";
var LINUX_OS = "linux";
var OPEN_BSD_OS = "openbsd";
// A dummy value -- should never get this from storage, or something's wrong.
var OS_EMPTY = null;

// Maps OS value from Chrome runtime to readable name.
var OS_TO_READABLE_NAME = {
    [MAC_OS]: "Mac",
    [WINDOWS_OS]: "Windows",
    [ANDROID_OS]: "Android",
    [CHROME_OS]: "Chrome OS",
    [LINUX_OS]: "Linux",
    [OPEN_BSD_OS]: "Open BSD"
};

// Maps OS to default hold key.
var OS_TO_DEFAULT_HOLD_KEY = {
    [MAC_OS]: CONTROL,
    [WINDOWS_OS]: ALT,
    [ANDROID_OS]: ALT,
    [CHROME_OS]: ALT,
    [LINUX_OS]: ALT,
    [OPEN_BSD_OS]: ALT
};

// Names for hold key choices on various OS.
var MAC_ALT_NAME = "Option";
var MAC_META_NAME = "Cmd";
var WINDOWS_META_NAME = "Windows key";
var CHROME_META_NAME = "Search key";
var LINUX_META_NAME = "Super (Windows key)";

// Maps OS to hold key choice (alt and meta) to OS-specific name.
var OS_TO_HOLD_KEY_NAMES = {
    [MAC_OS]: {
        [CONTROL]: CONTROL,
        [ALT]: MAC_ALT_NAME,
        [META]: MAC_META_NAME
    },
    [WINDOWS_OS]: {
        [CONTROL]: CONTROL,
        [ALT]: ALT,
        [META]: WINDOWS_META_NAME
    },
    [ANDROID_OS]: {
        [CONTROL]: CONTROL,
        [ALT]: ALT,
        [META]: LINUX_META_NAME,
    },
    [CHROME_OS]: {
        [CONTROL]: CONTROL,
        [ALT]: ALT,
        [META]: CHROME_META_NAME
    },
    [LINUX_OS]: {
        [CONTROL]: CONTROL,
        [ALT]: ALT,
        [META]: LINUX_META_NAME,
    },
    [OPEN_BSD_OS]: {
        [CONTROL]: CONTROL,
        [ALT]: ALT,
        [META]: LINUX_META_NAME,
    }
};

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
