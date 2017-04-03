var HOTKEY_HOLD_KEY = 27; // Escape.
// Hotkeys for navigating to left or right tab.
var NAV_LEFT_KEY_CODE = 91;
var NAV_RIGHT_KEY_CODE = 93;
// Hotkey for searching tabs.
var TAB_SEARCH_KEY_CODE = 59;
var NAV_LEFT_SYMBOL = '[';
var NAV_RIGHT_SYMBOL = ']';
var TAB_SEARCH_SYMBOL = ';';

var holding = false;
var hotkey = '';

function sendHotkeyMessage(hotkey) {
    console.log("Sending hotkey: " + hotkey);
    chrome.runtime.sendMessage({hotkey: hotkey});
}

function keydownHandler(e) {
    console.log("keydownHandler");
    // When hold key pressed, block text entry and wait for hotkey.
    if (e.which == HOTKEY_HOLD_KEY) {
        if (!holding) {
            console.log("Holding for hotkey...");
            chrome.runtime.sendMessage({holdKey: true});
            holding = true;
        }
    }
    if (holding) {
        e.stopPropagation();
    }
}

function keyupHandler(e) {
    console.log("keyupHandler");
    // When hold key released, unblock text entry and send any hotkey entered.
    if (e.which == HOTKEY_HOLD_KEY) {
        if (hotkey.length > 0) {
            sendHotkeyMessage(hotkey);
            hotkey = '';
        }
        e.stopPropagation();
        console.log("Released for hotkey.");
        chrome.runtime.sendMessage({holdKey: false});
        holding = false;
    }
}

function keypressHandler(e) {
    console.log("keypressHandler");
    if (holding) {
        // Capture [A-Za-z].
        if (65 <= e.keyCode && e.keyCode <= 90 || 
            97 <= e.keyCode && e.keyCode <= 122) {
            hotkey += String.fromCharCode(e.keyCode);
        }
        // Capture left/right navigation and tab search hotkeys. Send them
        // immediately so that the user can repeatedly move left or right
        // without releasing the hold key.
        // TODO: This sometimes gets caught when you move to a tab
        // where an input box is focused; not totally sure why as
        // it should still be getting the keydown for the hold key.
        else if (e.keyCode == NAV_LEFT_KEY_CODE) {
            sendHotkeyMessage(NAV_LEFT_SYMBOL);
            hotkey = '';
        }
        else if (e.keyCode == NAV_RIGHT_KEY_CODE) {
            sendHotkeyMessage(NAV_RIGHT_SYMBOL);
            hotkey = '';
        }
        else if (e.keyCode == TAB_SEARCH_KEY_CODE) {
            sendHotkeyMessage(TAB_SEARCH_SYMBOL);
            hotkey = '';
        }
        e.stopPropagation();
        e.preventDefault();
    }
}

// Listen for globally broadcasted hold key events and update own state.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hasOwnProperty("holdKey")) {
        holding = request.holdKey;
        console.log("Received hold key " + (holding ? "pressed" : "released") +
                ".");
    }
});

// TODO: Will waiting until document ready cause too much delay before the user
// can start using the hotkeys?
$(document).ready(function() {
    $(document).get(0).addEventListener("keydown", keydownHandler, true);
    $(document).get(0).addEventListener("keyup", keyupHandler, true);
    $(document).get(0).addEventListener("keypress", keypressHandler, true);
});
