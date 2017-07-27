var BODY_SELECTOR = "body";
// NOTE: This part tightly coupled with the CSS in overlay.css, tab_search.css.
var OVERLAY_HTML = '\
    <div id="overlay">\
        <img>\
        <span></span>\
        <div id="search_bar">\
            <label for="fuzzy_input">Tab Search</label>\
            <input type="text" id="fuzzy_input" placeholder="google.com">\
        </div>\
        <div id="search_results">\
            <table>\
                <tbody>\
                </tbody>\
            </table>\
        </div>\
    </div>';
var OVERLAY_SELECTOR = "#overlay";
var OVERLAY_HOLDING_CLASS = "holding";
var OVERLAY_IMG_SELECTOR = "#overlay > img";
var OVERLAY_SPAN_SELECTOR = "#overlay > span";
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

function sendHotkeyMessage(hotkey) {
    LOG_INFO("Send hotkey: " + hotkey);
    chrome.runtime.sendMessage({[HOTKEY_MSG]: hotkey}, function(response) {
        // If the background script responds with a SEARCH_TABS_MSG, then this
        // tab sent a tab search hotkey and should open up the search UI with
        // response tabs.
        if (response.hasOwnProperty(SEARCH_TABS_MSG)) {
            search_tabs = response[SEARCH_TABS_MSG];
            openTabSearch();
        }
    });
}

function keydownHandler(e) {
    // For cancelling tab search.
    if (in_tab_search) {
        if (e.key == hold_key) {
            in_tab_search = false;
            $(OVERLAY_SELECTOR).hide();
            $(SEARCH_BAR_SELECTOR + ", " + SEARCH_RESULTS_SELECTOR).hide();
            $(OVERLAY_SELECTOR).css(OVERLAY_ANIMATION_UNDO);
        }
    }
    // Ignore hold key when in tab search.
    else {
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
            // Capture built-in hotkeys. Send them immediately so that the user
            // can repeatedly use them without releasing the hold key.
            else if (BUILT_IN_HOTKEYS.includes(e.key)) {
                sendHotkeyMessage(e.key);
                setHotkeyString("");
            }
            e.stopPropagation();
            e.preventDefault();
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
            e.stopPropagation();
            LOG_INFO("Released for hotkey.");
            chrome.runtime.sendMessage({[HOLD_KEY_MSG]: false});
            setHoldKeyStatus(false);
        }
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
