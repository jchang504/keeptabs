// Global state.
// This gets updated by reading from storage before key event handlers are
// attached. See bottom.
var hold_key = null;
var holding = false;
var hotkey = "";

function sendHotkeyMessage(hotkey) {
    LOG_INFO("Send hotkey: " + hotkey);
    chrome.runtime.sendMessage({[HOTKEY_MSG]: hotkey});
}

BUILT_IN_HOTKEYS = [
    NAV_LEFT_KEYVAL,
    NAV_RIGHT_KEYVAL,
    MOVE_LEFT_KEYVAL,
    MOVE_RIGHT_KEYVAL,
    TAB_CLOSE_KEYVAL,
    TAB_SEARCH_KEYVAL,
    NAV_PREVIOUS_KEYVAL
];

function keydownHandler(e) {
    // When hold key pressed, block text entry and wait for hotkey.
    if (e.key == hold_key) {
        if (!holding) {
            LOG_INFO("Holding for hotkey...");
            chrome.runtime.sendMessage({[HOLDKEY_MSG]: true});
            holding = true;
        }
        // Prevent default behavior of hold key.
        e.preventDefault();
    }
    if (holding) {
        // Capture [A-Za-z].
        var ascii_value = e.key.charCodeAt(0);
        if (e.key.length == 1 &&
            65 <= ascii_value && ascii_value <= 90 ||
            97 <= ascii_value && ascii_value <= 122) {
                hotkey += e.key;
        }
        // Capture built-in hotkeys. Send them immediately so that the user can
        // repeatedly use them without releasing the hold key.
        else if (BUILT_IN_HOTKEYS.includes(e.key)) {
            sendHotkeyMessage(e.key);
            hotkey = "";
        }
        e.stopPropagation();
        e.preventDefault();
    }
}

function keyupHandler(e) {
    // When hold key released, unblock text entry and send any hotkey entered.
    if (e.key == hold_key) {
        if (hotkey.length > 0) {
            sendHotkeyMessage(hotkey);
            hotkey = "";
        }
        e.stopPropagation();
        LOG_INFO("Released for hotkey.");
        chrome.runtime.sendMessage({[HOLDKEY_MSG]: false});
        holding = false;
    }
}

// Listen for globally broadcasted hold key events and update own state.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hasOwnProperty(HOLDKEY_MSG)) {
        holding = request[HOLDKEY_MSG];
        var hold_event_type = holding ? "pressed" : "released";
        LOG_INFO("Received hold key " + hold_event_type);
    }
    else if (request.hasOwnProperty(UPDATE_HOLD_KEY_MSG)) {
        hold_key = request[UPDATE_HOLD_KEY_MSG];
    }
});

chrome.storage.sync.get({[HOLD_KEY_KEY]: HOLD_KEY_DEFAULT}, function(items) {
    hold_key = items[HOLD_KEY_KEY];
    // Only add listeners once hold_key has been updated from options.
    $(window).get(0).addEventListener(KEYDOWN, keydownHandler, true);
    $(window).get(0).addEventListener(KEYUP, keyupHandler, true);
});
