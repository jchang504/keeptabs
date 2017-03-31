var HOTKEY_HOLD_KEY = 27; // Escape.
var SHIFT = 16;
// Hotkeys for navigating to left or right tab.
var NAV_LEFT = 219;
var NAV_RIGHT = 221;
var TAB_SEARCH = 186;
var NAV_LEFT_SYMBOL = '[';
var NAV_RIGHT_SYMBOL = ']';
var TAB_SEARCH_SYMBOL = ';';

var holding = false;
var shift = false;
var hotkey = '';

function sendHotkeyMessage(hotkey) {
    console.log("Sending hotkey: " + hotkey);
    chrome.runtime.sendMessage({hotkey: hotkey});
}

function keydownHandler(e) {
    console.log("keydownHandler");
    switch (e.which) {
        // When hold key pressed, block text entry and wait for hotkey.
        case HOTKEY_HOLD_KEY:
            if (!holding) {
                console.log("Holding for hotkey...");
                holding = true;
            }
            e.stopPropagation();
            break;
        // Need to manually implement capitalization with shift since we're
        // intercepting keys.
        case SHIFT:
            shift = true;
            break;
        default:
            if (holding) {
                // Capture a-z.
                if (65 <= e.which && e.which <= 90) {
                    var asciiCode = e.which;
                    if (!shift) {
                        asciiCode += 32;
                    }
                    hotkey += String.fromCharCode(asciiCode);
                }
                // Capture left/right navigation hotkeys. Send them right
                // away so that the user can repeatedly move left or right
                // without releasing the hold key.
                // TODO: This sometimes gets caught when you move to a tab
                // where an input box is focused; not totally sure why as
                // it should still be getting the keydown for the hold key.
                else if (e.which == NAV_LEFT) {
                    sendHotkeyMessage(NAV_LEFT_SYMBOL);
                    hotkey = '';
                }
                else if (e.which == NAV_RIGHT) {
                    sendHotkeyMessage(NAV_RIGHT_SYMBOL);
                    hotkey = '';
                }
                else if (e.which == TAB_SEARCH) {
                    hotkey = TAB_SEARCH_SYMBOL;
                }
                e.stopPropagation();
                e.preventDefault();
            }
            break;
    }
}

function keyupHandler(e) {
    console.log("keyupHandler");
    switch (e.which) {
        // When spacebar released, unblock text entry and send any hotkey
        // entered.
        // TODO: Fix false positives sending a hotkey when spacebar is held
        // while typing very fast (especially " a ").
        case HOTKEY_HOLD_KEY:
            if (hotkey.length > 0) {
                sendHotkeyMessage(hotkey);
                hotkey = '';
            }
            e.stopPropagation();
            console.log("Released for hotkey.");
            holding = false;
            break;
        // Need to manually implement capitalization with shift since we're
        // intercepting keys.
        case SHIFT:
            shift = false;
            break;
    }
}

// TODO: Will waiting until document ready cause too much delay before the user
// can start using the hotkeys?
$(document).ready(function() {
    $(document).get(0).addEventListener("keydown", keydownHandler, true);
    $(document).get(0).addEventListener("keyup", keyupHandler, true);
});
