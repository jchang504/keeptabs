var BODY_SELECTOR = "body";
// NOTE: This part tightly coupled with the CSS in overlay.css, tab_search.css.
var OVERLAY_HTML = '\
    <div id="keeptabs_overlay">\
        <div id="top">\
            <img src="https://openclipart.org/download/215361/shadowed-news-icon.svg">\
           <input type="text">\
        </div>\
        <div id="menu">\
            <table>\
                <tr>\
                    <th>Hotkey</th>\
                    <th>URL</th>\
                </tr>\
                <tr>\
                    <td>g</td>\
                    <td>www.google.com/</td>\
                </tr>\
                <tr>\
                    <td>g</td>\
                    <td>www.google.com/</td>\
                </tr>\
            </table>\
        </div>\
    </div>';
var OVERLAY_SELECTOR = "#keeptabs_overlay";
var OVERLAY_HOLDING_CLASS = "holding";
var OVERLAY_IMG_SELECTOR = "#keeptabs_overlay > img";
var OVERLAY_SPAN_SELECTOR = "#keeptabs_overlay > span";
var OVERLAY_EXPAND_ANIMATION = {"height": "100%", "width": "100%"};
var OVERLAY_EXPAND_TIME = 200;
var OVERLAY_ANIMATION_UNDO = {"height": "initial", "width": "initial"};
var SEARCH_BAR_SELECTOR = "#search_bar";
var SEARCH_RESULTS_SELECTOR = "#search_results";
// End tightly coupled part with overlay.css, tab_search.css.
var SRC = "src";
var DISPLAY = "display";
var INLINE = "inline";

// Global state.
// This gets updated by reading from storage before key event handlers are
// attached. See bottom.
var hold_key = null;
var holding = false;
var hotkey = "";
// Used in tab_search.js
var search_tabs = [];
var in_tab_search = false;

function setHoldKeyStatus(is_holding) {
    holding = is_holding;
    if (is_holding) {
        $(OVERLAY_SELECTOR).show();
    }
    else if (!in_tab_search) {
        // If the tab search animation is currently running, don't hide the
        // overlay on keyup.
        $(OVERLAY_SELECTOR).hide();
    }
}

function setHotkeyString(current_hotkey) {
    hotkey = current_hotkey;
    $(OVERLAY_SPAN_SELECTOR).text(hotkey);
}

// Animate the overlay to expand into tab search UI.
function openTabSearch() {
    in_tab_search = true;
    setHoldKeyStatus(false);
    $(OVERLAY_SELECTOR).animate(OVERLAY_EXPAND_ANIMATION, OVERLAY_EXPAND_TIME,
            function() {
        $(FUZZY_INPUT_SELECTOR).val("");
        populate();
        $(SEARCH_BAR_SELECTOR).css(DISPLAY, INLINE);
        $(SEARCH_RESULTS_SELECTOR).show();
        $(FUZZY_INPUT_SELECTOR).focus();
    });
}

// Close the tab search UI.
function closeTabSearch() {
    in_tab_search = false;
    $(OVERLAY_SELECTOR).hide();
    $(SEARCH_BAR_SELECTOR + ", " + SEARCH_RESULTS_SELECTOR).hide();
    $(OVERLAY_SELECTOR).css(OVERLAY_ANIMATION_UNDO);
}

function sendHotkeyMessage(hotkey) {
    LOG_INFO("Send hotkey: " + hotkey);
    chrome.runtime.sendMessage({[HOTKEY_MSG]: hotkey}, function(response) {
        // If the background script responds with a SEARCH_TABS_MSG, then this
        // tab sent a tab search hotkey and should open up the search UI with
        // response tabs.
        if (response && response.hasOwnProperty(SEARCH_TABS_MSG)) {
            search_tabs = response[SEARCH_TABS_MSG];
            openTabSearch();
        }
    });
}

// Extract the letter typed from the keydown_event, including capitalization.
function extractLetter(keydown_event) {
    const code = keydown_event.code;
    var letter = code.charAt(code.length - 1);
    if (!keydown_event[SHIFT_MODIFIER]) {
        letter = letter.toLowerCase();
    }
    return letter;
}

function keydownHandler(e) {
    // For cancelling tab search.
    if (in_tab_search) {
        if (e.key == hold_key) {
            closeTabSearch();
        }
    }
    // Ignore hold key when in tab search.
    if (!in_tab_search) {
        // When hold key pressed, block text entry and wait for hotkey.
        if (e.key == hold_key) {
            if (!holding) {
                LOG_INFO("Holding for hotkey...");
                setHoldKeyStatus(true);
            }
            e.stopImmediatePropagation();
            e.preventDefault();
        }
        // If keydown event shows hold key pressed with built in hotkey,
        // activate regardless of whether holding == true. Turn off the holding
        // indicator.
        else if (e[HOLD_KEY_TO_MODIFIER[hold_key]] &&
                BUILT_IN_HOTKEYS.includes(e.code)) {
            var modified_code = e.code;
            if (e[SHIFT_MODIFIER]) {
                modified_code += SHIFT;
            }
            sendHotkeyMessage(modified_code);
            setHotkeyString("");
            // Don't turn off hold key indicator for tab search animation.
            if (e.code != TAB_SEARCH_CODE) {
                setHoldKeyStatus(false);
            }
            e.stopImmediatePropagation();
            e.preventDefault();
        }
        else if (holding) {
            // Capture [A-Za-z].
            if (e.code.startsWith(ALPHA_PREFIX)) {
                const letter = extractLetter(e);
                setHotkeyString(hotkey + letter);
                e.stopImmediatePropagation();
                e.preventDefault();
            }
            // Cancel holding on non-alphabetic keys, except for shift.
            else if (e.key != SHIFT) {
                setHotkeyString("");
                setHoldKeyStatus(false);
                // Don't stop propagation and prevent default here, to allow
                // non-alphabetic browser and site shortcuts.
            }
        }
    }
}

function keyupHandler(e) {
    // Ignore hold key when in tab search.
    if (!in_tab_search) {
        // When hold key released, unblock text entry and send any hotkey
        // entered.
        if (e.key == hold_key) {
            if (hotkey.length > 0) {
                sendHotkeyMessage(hotkey);
                setHotkeyString("");
            }
            LOG_INFO("Released for hotkey.");
            setHoldKeyStatus(false);
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }
}

// Listen for hold key release and options changes messages.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Release the hold key on window change to prevent sticking.
    if (request.hasOwnProperty(HOLD_RELEASE_MSG)) {
        LOG_INFO("Received hold release; releasing hold key");
        if (in_tab_search) {
            closeTabSearch();
        }
        setHoldKeyStatus(false);
    }
    else if (request.hasOwnProperty(UPDATE_HOLD_KEY_MSG)) {
        hold_key = request[UPDATE_HOLD_KEY_MSG];
    }
});

chrome.storage.sync.get({
    [HOLD_KEY_KEY]: HOLD_KEY_EMPTY,
    [OS_KEY]: OS_EMPTY
}, function(items) {
    hold_key = items[HOLD_KEY_KEY];
    if (hold_key == HOLD_KEY_EMPTY) {
        // No hold key saved in storage.
        var os = items[OS_KEY];
        if (os == OS_EMPTY) {
            // This should never happen, unless the background script somehow
            // failed to save the OS.
            LOG_ERROR("No OS saved in chrome.storage.sync.");
            hold_key = ALT;
        }
        else {
            hold_key = OS_TO_DEFAULT_HOLD_KEY[os];
        }
    }
    // Only add listeners once hold_key has been updated from options.
    $(window).get(0).addEventListener(KEYDOWN, keydownHandler, true);
    $(window).get(0).addEventListener(KEYUP, keyupHandler, true);
});

$(document).ready(function() {
    // Add visual overlay UI.
    $(BODY_SELECTOR).append(OVERLAY_HTML);
    $(OVERLAY_IMG_SELECTOR).prop(SRC, chrome.extension.getURL(ICON_128_URL));
});
