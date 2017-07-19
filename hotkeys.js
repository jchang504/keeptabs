var BODY_SELECTOR = "body";
// NOTE: This section is tightly coupled with the CSS in overlay.css.
var OVERLAY_HTML = '<div id="overlay"><img><span></span></div>';
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
    console.log("Setting " + is_holding);
    holding = is_holding;
    if (is_holding) {
        $(OVERLAY_SELECTOR).addClass(OVERLAY_HOLDING_CLASS);
    }
    else {
        $(OVERLAY_SELECTOR).removeClass(OVERLAY_HOLDING_CLASS);
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

function sendBuiltInHotkeyMessage(hotkey) {
    LOG_INFO("Send built in hotkey: " + hotkey);
    chrome.runtime.sendMessage({[BUILT_IN_HOTKEY_MSG]: hotkey});
}

function isLetter(keydownEvent){
    const code = keydownEvent.code;
    return code.startsWith(ALPHA_PREFIX);
}

//Assumes that the input KeyboardEvent is one English letter
function extractKey(keydownEvent){
    const code = keydownEvent.code;
    var key = code.charAt(code.length - 1);
    if(keydownEvent.shiftKey){
        key = key.toUpperCase();
    }
    else {
        key = key.toLowerCase();
    }
    return key;
}


function keydownHandler(e) {
    // When hold key pressed, block text entry and wait for hotkey.
    if (e.key == hold_key) {
        if (!holding) {
            LOG_INFO("Holding for hotkey...");
            chrome.runtime.sendMessage({[HOLD_KEY_MSG]: true});
            setHoldKeyStatus(true);
        }
        e.stopImmediatePropagation();
        // Prevent default behavior of hold key.
        e.preventDefault();
    }
    else if (e[KEY_TO_PROP[hold_key]] && BUILT_IN_HOTKEYS.includes(e.code)){
        sendBuiltInHotkeyMessage(e.code);
        e.stopImmediatePropagation();
        e.preventDefault();
    }
    else if (holding) {
        console.log(e.code);
        if(isLetter(e)){
            const key = extractKey(e);
            setHotkeyString(hotkey + key);
        }
        e.stopImmediatePropagation();
        e.preventDefault();
    }
}

function keypressHandler(e) {
    if(holding){
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
        e.stopImmediatePropagation();
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
    $(window).get(0).addEventListener(KEYPRESS, keypressHandler, true);
});

$(document).ready(function() {
    // Add visual overlay UI.
    $(BODY_SELECTOR).append(OVERLAY_HTML);
    $(OVERLAY_IMG_SELECTOR).prop(SRC, chrome.extension.getURL(ICON_48_URL));
});
