// Global state.
var holding = false;
var hotkey = '';

function sendHotkeyMessage(hotkey) {
    LOG_INFO("Send hotkey: " + hotkey);
    chrome.runtime.sendMessage({[HOTKEY_MSG]: hotkey});
}

function keydownHandler(e) {
    // When hold key pressed, block text entry and wait for hotkey.
    if (e.which == HOTKEY_HOLD_KEY_CODE) {
        if (!holding) {
            LOG_INFO("Holding for hotkey...");
            chrome.runtime.sendMessage({[HOLDKEY_MSG]: true});
            holding = true;
        }
        // Prevent default behavior of hold key.
        e.preventDefault();
    }
    if (holding) {
        e.stopPropagation();
    }
}

function keyupHandler(e) {
    // When hold key released, unblock text entry and send any hotkey entered.
    if (e.which == HOTKEY_HOLD_KEY_CODE) {
        if (hotkey.length > 0) {
            sendHotkeyMessage(hotkey);
            hotkey = '';
        }
        e.stopPropagation();
        LOG_INFO("Released for hotkey.");
        chrome.runtime.sendMessage({[HOLDKEY_MSG]: false});
        holding = false;
    }
}

// Mapping of special hotkey key codes to message symbols.
SPECIAL_KEY_CODE_TO_SYMBOL = {
    [NAV_LEFT_KEY_CODE]: NAV_LEFT_SYMBOL,
    [NAV_RIGHT_KEY_CODE]: NAV_RIGHT_SYMBOL,
    [MOVE_LEFT_KEY_CODE]: MOVE_LEFT_SYMBOL,
    [MOVE_RIGHT_KEY_CODE]: MOVE_RIGHT_SYMBOL,
    [TAB_CLOSE_KEY_CODE]: TAB_CLOSE_SYMBOL,
    [TAB_SEARCH_KEY_CODE]: TAB_SEARCH_SYMBOL
}

function keypressHandler(e) {
    if (holding) {
        // Capture [A-Za-z].
        if (65 <= e.keyCode && e.keyCode <= 90 || 
            97 <= e.keyCode && e.keyCode <= 122) {
            hotkey += String.fromCharCode(e.keyCode);
        }
        // Capture left/right navigation, tab close, and tab search hotkeys.
        // Send them immediately so that the user can repeatedly move left or
        // right without releasing the hold key.
        // TODO: Refactor to dedup logic.
        else if (e.keyCode in SPECIAL_KEY_CODE_TO_SYMBOL) {
            sendHotkeyMessage(SPECIAL_KEY_CODE_TO_SYMBOL[e.keyCode]);
            hotkey = '';
        }
        e.stopPropagation();
        e.preventDefault();
    }
}

// Listen for globally broadcasted hold key events and update own state.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hasOwnProperty(HOLDKEY_MSG)) {
        holding = request[HOLDKEY_MSG];
        var hold_event_type = holding ? "pressed" : "released";
        LOG_INFO("Received hold key " + hold_event_type);
    }
});

$(window).get(0).addEventListener(KEYDOWN, keydownHandler, true);
$(window).get(0).addEventListener(KEYUP, keyupHandler, true);
$(window).get(0).addEventListener(KEYPRESS, keypressHandler, true);
