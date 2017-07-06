var TAB_HISTORY_LIMIT = 10;

// Global state.
var hotkeys_map = {};
// A bounded array containing the IDs of the last TAB_HISTORY_LIMIT active
// tabs. The current tab is at current_tab_index, and the rest follow in
// descending indices, wrapping around the beginning of the array to the end.
// Used for last tab navigation.
var tab_history = [];
var current_tab_index = 0;
// Necessary to keep track of the last active tab when only the focused window
// changes (this does NOT fire the active tab change listener).
var window_to_active_tab_map = {};

// Navigate to (make active) the specified tab (and focus its window, if the
// optional argument is provided).
function navigateToTab(tab_id, window_id) {
    LOG_INFO("Navigate to tab_id: " + tab_id + ", window_id: " + window_id);
    chrome.tabs.update(tab_id, {[ACTIVE]: true});
    if (window_id !== undefined) {
        chrome.windows.update(window_id, {[FOCUSED]: true});
    }
}

// Create a new tab of the url (and navigate to it). Also used for tab search.
function createNewTab(url) {
    chrome.tabs.query({[CURRENT_WINDOW]: true, [ACTIVE]: true},
        function (tabs) {
            LOG_INFO("Create new tab of: " + url);
            chrome.tabs.create({[URL]: url});
        }
    );
}

/* direction: -1 for left, 1 for right
 * move: true for moving tab left/right, false for navigating left/right
 */
function leftRightNavOrMove(direction, move) {
    chrome.tabs.query({[CURRENT_WINDOW]: true}, function(tabs) {
        var current_tab_index;
        for (const tab of tabs) {
            if (tab.active) {
                current_tab_index = tab.index;
                break;
            }
        }
        var length = tabs.length;
        var next_tab_index = (current_tab_index + length + direction) % length;
        var label = direction == -1 ? "left" : "right";
        if (move) {
            LOG_INFO("Move current tab " + label);
            chrome.tabs.move(tabs[current_tab_index].id, {[INDEX]:
                    next_tab_index});
        }
        else {
            LOG_INFO("Navigate to " + label + " tab");
            navigateToTab(tabs[next_tab_index].id);
        }
    });
}

function closeCurrentTab() {
    LOG_INFO("Close current tab");
    chrome.tabs.query({[CURRENT_WINDOW]: true, [ACTIVE]: true},
        function(currentTab) {
            chrome.tabs.remove(currentTab[0].id);
        });
}

function updateHoldKey() {
    LOG_INFO("Load hold key and update tabs' content scripts");
    chrome.storage.sync.get({[HOLD_KEY_KEY]: HOLD_KEY_DEFAULT}, function(items)
            {
        chrome.tabs.query({}, function(tabs) {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {[UPDATE_HOLD_KEY_MSG]:
                        items[HOLD_KEY_KEY]});
            }
        });
    });
}

// Load hotkeys from Chrome storage into global map.
function loadHotkeys() {
    LOG_INFO("Load hotkeys");
    hotkeys_map = {};
    chrome.storage.sync.get({[HOTKEYS_KEY]: HOTKEYS_DEFAULT}, function(items) {
        for (const hotkey_info of items[HOTKEYS_KEY]) {
            hotkeys_map[hotkey_info[HOTKEY_KEY]] = {
                [TARGET_KEY]: hotkey_info[TARGET_KEY],
                [DEDUPLICATE_KEY]: hotkey_info[DEDUPLICATE_KEY],
                [MATCH_PREFIX_KEY]: hotkey_info[MATCH_PREFIX_KEY]
            };
        }
    });
}

// Open a new tab of the tab search page.
function openTabSearch() {
    LOG_INFO("Open tab search");
    createNewTab(SEARCH_URL);
}

// Navigate to the most recently active still-existing tab before the current
// tab. Useful for quick alt+tab style switching between two tabs.
function navigateToPreviousTab() {
    LOG_INFO("Navigate to previous tab");
    var current_tab_id = tab_history[current_tab_index];
    chrome.tabs.query({}, function(tabs) {
        var done = false;
        for (var i = current_tab_index; !done && i != current_tab_index + 1;
                i = (i + TAB_HISTORY_LIMIT - 1) % TAB_HISTORY_LIMIT) {
            var tab_id = tab_history[i];
            if (tab_id != current_tab_id) {
                // Check if tab still exists.
                for (const tab of tabs) {
                    if (tab.id == tab_id) {
                        navigateToTab(tab_id, tab.windowId);
                        done = true;
                        break;
                    }
                }
            }
        }
    });
}

// Add an entry for tab_id as most recent in the active tab history.
function addToTabHistory(tab_id) {
    LOG_INFO("Add to tab history: tab_id=" + tab_id);
    current_tab_index = (current_tab_index + 1) % TAB_HISTORY_LIMIT;
    tab_history[current_tab_index] = tab_id;
}

// Listen for focused window changes to track active tab changes across
// windows.
chrome.windows.onFocusChanged.addListener(function (window_id) {
    // Track last focused window; ignore when user is not on any window.
    if (window_id != chrome.windows.WINDOW_ID_NONE) {
        addToTabHistory(window_to_active_tab_map[window_id]);
    }
},
// Exclude 'app' and 'panel' WindowType (extension's own windows).
{windowTypes: ["normal", "popup"]});

// Listen for window closures to keep window_to_active_tab_map from growing
// infinitely.
chrome.windows.onRemoved.addListener(function (window_id) {
    delete window_to_active_tab_map[window_id];
},
// Exclude 'app' and 'panel' WindowType (extension's own windows).
{windowTypes: ["normal", "popup"]});

// Listen for active tab changes (within a window).
chrome.tabs.onActivated.addListener(function (activeInfo) {
    addToTabHistory(activeInfo.tabId);
    window_to_active_tab_map[activeInfo.windowId] = activeInfo.tabId;
});

function openNewTab() {
    chrome.tabs.create({});
}

// Handles any custom hotkey received (including invalid ones).
function handleCustomHotkey(hotkey) {
    var normalized = hotkey.toLowerCase();
    // If hotkey is valid...
    if (hotkeys_map.hasOwnProperty(normalized)) {
        LOG_INFO("Activate custom hotkey: " + normalized);
        var hotkey_info = hotkeys_map[normalized];
        var target = hotkey_info[TARGET_KEY];
        // Only deduplicate if checked in options and not overridden by capital
        // letter in hotkey.
        var deduplicate = hotkey_info[DEDUPLICATE_KEY] && hotkey == normalized;
        if (!deduplicate) {
            LOG_INFO("Not deduplicating; create new tab of target: " + target);
            createNewTab(target);
        }
        else {
            var match_prefix = hotkey_info[MATCH_PREFIX_KEY];
            if (match_prefix.indexOf("://") == -1) {
                // No scheme specified, use "*" (matches either http or https).
                match_prefix = "*://" + match_prefix;
            }
            switchToMatchIfExists(target, match_prefix);
        }
    }
}

// Queries for tabs with URLs starting with the match_prefix and navigates to
// the first one, unless the current tab is already a match -- then it cycles
// to the next matching tab after the current one. If no matches exist, opens a
// new tab of target.
function switchToMatchIfExists(target, match_prefix) {
    LOG_INFO("Query for tabs matching prefix: " + match_prefix);
    chrome.tabs.query({[URL]: match_prefix + "*"}, function(matching_tabs) {
        if (matching_tabs.length > 0) {
            var current_tab_matches = false;
            for (var i = 0; i < matching_tabs.length; i++) {
                if (matching_tabs[i].id == tab_history[current_tab_index]) {
                    LOG_INFO("Current tab matches; cycle to next");
                    current_tab_matches = true;
                    var next_tab =
                        matching_tabs[(i + 1) % matching_tabs.length];
                    navigateToTab(next_tab.id, next_tab.windowId);
                    break;
                }
            }
            if (!current_tab_matches) {
                LOG_INFO("Navigate to first match");
                navigateToTab(matching_tabs[0].id, matching_tabs[0].windowId);
            }
        }
        else {
            LOG_INFO("No matches; create new tab of target: " + target);
            createNewTab(target);
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Hold key event (pressed or released); broadcast to all tabs.
    if (request.hasOwnProperty(HOLD_KEY_MSG)) {
        var pressed = request[HOLD_KEY_MSG];
        var hold_event_type = pressed ? "pressed" : "released";
        LOG_INFO("Broadcasting hold key " + hold_event_type);
        chrome.tabs.query({}, function(tabs) {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {[HOLD_KEY_MSG]: pressed});
            }
        });
    }
    // Hotkey sent.
    else if (request.hasOwnProperty(HOTKEY_MSG)) {
        var hotkey = request[HOTKEY_MSG];
        LOG_INFO("Received hotkey: " + hotkey);
        if (hotkey == NAV_LEFT_KEYVAL){
            leftRightNavOrMove(-1, false);
        }
        else if (hotkey == NAV_RIGHT_KEYVAL){
            leftRightNavOrMove(1, false);
        }
        else if (hotkey == MOVE_LEFT_KEYVAL){
            leftRightNavOrMove(-1, true);
        }
        else if (hotkey == MOVE_RIGHT_KEYVAL){
            leftRightNavOrMove(1, true);
        }
        else if (hotkey == TAB_CLOSE_KEYVAL) {
            closeCurrentTab();
        }
        else if (hotkey == TAB_SEARCH_KEYVAL) {
            openTabSearch();
        }
        else if (hotkey == NAV_PREVIOUS_KEYVAL) {
            navigateToPreviousTab();
        }
        else if (hotkey == TAB_NEW_KEYVAL) {
            openNewTab();
        }
        else {
            handleCustomHotkey(hotkey);
        }
    }
    // Refresh options after edit.
    else if (request.hasOwnProperty(REFRESH_MSG)) {
        LOG_INFO("Received refresh request");
        updateHoldKey();
        loadHotkeys();
    }
});

// Load hotkeys at background script start.
loadHotkeys();
