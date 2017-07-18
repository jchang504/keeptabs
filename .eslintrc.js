module.exports = {
    "env": {
        "browser": true,
        "jquery": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": 0,
        "semi": [
            "error",
            "always"
        ],
        "no-unused-vars": 0
    },

    "globals": {
        "ACTIVE": true,
        "BUILT_IN_HOTKEYS": true,
        "CURRENT_TAB_KEY": true,
        "CURRENT_WINDOW": true,
        "DEDUPLICATE_KEY": true,
        "DOMAIN_KEY": true,
        "FOCUSED": true,
        "HOLD_KEY_MSG":true,
        "HOLD_KEY_DEFAULT": true,
        "HOLD_KEY_KEY": true,
        "HOTKEYS_DEFAULT":true,
        "HOTKEYS_KEY": true,
        "HOTKEY_HOLD_KEY_CODE":true,
        "HOTKEY_KEY": true,
        "HOTKEY_MSG":true,
        "INDEX": true,
        "KEYDOWN": true,
        "KEYUP": true,
        "LOG_INFO": true,
        "MATCH_PREFIX_KEY": true,
        "MOVE_LEFT_KEYVAL":true,
        "MOVE_RIGHT_KEYVAL": true,
        "NAV_LEFT_KEYVAL":true,
        "NAV_LEFT_SYMBOL":true,
        "NAV_PREVIOUS_KEYVAL":true,
        "NAV_RIGHT_KEYVAL":true,
        "NAV_RIGHT_SYMBOL":true,
        "REFRESH_MSG": true,
        "SEARCH_NAV_MSG": true,
        "SEARCH_URL": true,
        "TAB_CLOSE_KEYVAL":true,
        "TAB_CLOSE_SYMBOL":true,
        "TAB_ID_KEY": true,
        "TAB_NEW_KEYVAL": true,
        "TAB_PREVIOUS_KEYVAL": true,
        "TAB_SEARCH_KEYVAL": true,
        "TARGET_KEY": true,
        "UPDATE_HOLD_KEY_MSG": true,
        "WINDOW_ID_KEY": true,
        "chrome": true
    }
};
