var BODY_SELECTOR = "body";
// NOTE: This section is tightly coupled with the CSS in overlay.css.
var OVERLAY_HTML = '\
    <div id="overlay">\
        <img>\
        <span></span>\
    </div>';
var OVERLAY_SELECTOR = "#overlay";
var OVERLAY_HOLDING_CLASS = "holding";
var OVERLAY_IMG_SELECTOR = "#overlay > img";
var OVERLAY_SPAN_SELECTOR = "#overlay > span";
// End tightly coupled section with overlay.css.
var SRC = "src";

// Global state.
// This gets updated by reading from storage before key event handlers are
// attached. See bottom.
var hold_key = null;
var holding = false;
var hotkey = "";

function setHoldKeyStatus(is_holding) {
    holding = is_holding;
    if (is_holding) {
        $(OVERLAY_SELECTOR).show();
    } else {
        $(OVERLAY_SELECTOR).hide();
    }
}

function setHotkeyString(current_hotkey) {
    hotkey = current_hotkey;
    $(OVERLAY_SPAN_SELECTOR).text(hotkey);
}

function sendHotkeyMessage(hotkey) {
    LOG_INFO("Send hotkey: " + hotkey);
    chrome.runtime.sendMessage({[HOTKEY_MSG]: hotkey});
}

function keydownHandler(e) {
    // When hold key pressed, block text entry and wait for hotkey.
    if (e.key == hold_key) {
        if (!holding) {
            LOG_INFO("Holding for hotkey...");
            chrome.runtime.sendMessage({[HOLD_KEY_MSG]: true});
            setHoldKeyStatus(true);
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
            setHotkeyString(hotkey + e.key);
        }
        // Capture built-in hotkeys. Send them immediately so that the user can
        // repeatedly use them without releasing the hold key.
        else if (BUILT_IN_HOTKEYS.includes(e.key)) {
            sendHotkeyMessage(e.key);
            setHotkeyString("");
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
            setHotkeyString("");
        }
        e.stopPropagation();
        LOG_INFO("Released for hotkey.");
        chrome.runtime.sendMessage({[HOLD_KEY_MSG]: false});
        setHoldKeyStatus(false);
    }
}

// Listen for globally broadcasted hold key events and update own state.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hasOwnProperty(HOLD_KEY_MSG)) {
        setHoldKeyStatus(request[HOLD_KEY_MSG]);
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

$(document).ready(function() {
    // Add visual overlay UI.
    $(BODY_SELECTOR).append(OVERLAY_HTML);
    $(OVERLAY_IMG_SELECTOR).prop(SRC, chrome.extension.getURL(ICON_128_URL));
});
