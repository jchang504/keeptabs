// Regex for domain matching.
var domain_regex = new RegExp('^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)', 'i');

// Global state.
var hotkeys_map = {};
var last_tab_id = null;

// Navigate to (make active) the specified tab (and focus its window, if the
// optional argument is provided. Before navigating, update the last_tab_id.
function navigateToTab(tab_id, window_id) {
    chrome.tabs.query({[CURRENT_WINDOW]: true, [ACTIVE]: true},
            function(tabs) {
        last_tab_id = tabs[0].id;
        chrome.tabs.update(tab_id, {[ACTIVE]: true});
        if (window_id !== undefined) {
            chrome.windows.update(window_id, {[FOCUSED]: true});
        }
    });
}

/*
 * url: the string that includes the protocol and domain name of the site you
 * want to go to (e.g. "https://www.google.com").
 * deduplicate: true if you want to check for a duplicate and go to it if it
 * exists instead of creating a new tab; false if you want to create a new tab
 * regardless of pre-existing tabs.
 */
function openTab(url, deduplicate){
    chrome.tabs.query({}, function(tabs){
        var target_domain = domain_regex.exec(url)[1];
        if (deduplicate) {
            for (tab of tabs){
                var tab_url = tab.url;
                var tab_domain = domain_regex.exec(tab_url)[1];
                if (target_domain == tab_domain) {
                    LOG_INFO("Switch active tab to: " + tab_url);
                    navigateToTab(tab.id, tab.windowId);
                    return;
                };
            }
        }
        LOG_INFO("Create new tab of: " + url);
        chrome.tabs.create({[URL]: url});
    });
}

/* direction: -1 for left, 1 for right
 * move: true for moving tab left/right, false for navigating left/right
 */
function leftRightNavOrMove(direction, move) {
    chrome.tabs.query({[CURRENT_WINDOW]: true}, function(tabs) {
        var curr_tab_index;
        for (tab of tabs) {
            if (tab.active) {
                curr_tab_index = tab.index;
                break;
            }
        }
        var length = tabs.length;
        var next_tab_index = (curr_tab_index + length + direction) % length;
        var label = direction == -1 ? "left" : "right";
        if (move) {
            LOG_INFO("Move current tab " + label);
            chrome.tabs.move(tabs[curr_tab_index].id, {[INDEX]:
                    next_tab_index});
        }
        else {
            LOG_INFO("Navigate to " + label + " tab");
            navigateToTab(tabs[next_tab_index].id);
        }
    });
}

// Navigate to the previous tab that was navigated to with KeepTabs. Useful for
// quick alt+tab style switching between two tabs.
function navigateToPreviousTab() {
    chrome.tabs.query({}, function(tabs) {
        for (tab of tabs) {
            if (tab.id == last_tab_id) {
                // If last_tab_id is valid, navigate to it.
                navigateToTab(tab.id, tab.windowId);
            }
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

// Load hotkeys from Chrome storage into global map.
function loadHotkeys() {
    LOG_INFO("Load hotkeys");
    hotkeys_map = {};
    chrome.storage.sync.get({[HOTKEYS_KEY]: HOTKEYS_DEFAULT}, function(items){
        for (hotkey_info of items[HOTKEYS_KEY]){
            hotkeys_map[hotkey_info[HOTKEY_KEY]] = {
                [DOMAIN_KEY]: hotkey_info[DOMAIN_KEY],
                [DEDUPLICATE_KEY]: hotkey_info[DEDUPLICATE_KEY]
            };
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Hold key event (pressed or released); broadcast to all tabs.
    if (request.hasOwnProperty(HOLDKEY_MSG)) {
        var pressed = request[HOLDKEY_MSG];
        var hold_event_type = pressed ? "pressed" : "released";
        LOG_INFO("Broadcasting hold key " + hold_event_type);
        chrome.tabs.query({}, function(tabs) {
            for (tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {[HOLDKEY_MSG]: pressed});
            }
        });
    }
    // Hotkey sent.
    else if (request.hasOwnProperty(HOTKEY_MSG)) {
        var hotkey = request[HOTKEY_MSG];
        LOG_INFO("Received hotkey: " + hotkey);
        if (hotkey == NAV_LEFT_SYMBOL){
            leftRightNavOrMove(-1, false);
        }
        else if (hotkey == NAV_RIGHT_SYMBOL){
            leftRightNavOrMove(1, false);
        }
        else if (hotkey == MOVE_LEFT_SYMBOL){
            leftRightNavOrMove(-1, true);
        }
        else if (hotkey == MOVE_RIGHT_SYMBOL){
            leftRightNavOrMove(1, true);
        }
        else if (hotkey == TAB_CLOSE_SYMBOL) {
            closeCurrentTab();
        }
        else if (hotkey == TAB_SEARCH_SYMBOL) {
            LOG_INFO("Open tab search");
            chrome.tabs.create({[URL]: SEARCH_URL});
        }
        else if (hotkey == NAV_PREVIOUS_SYMBOL) {
            navigateToPreviousTab();
        }
        else {
            var normalized = hotkey.toLowerCase();
            var overrideDeduplicate = hotkey != normalized;
            if (normalized in hotkeys_map) {
                var hotkey_info = hotkeys_map[normalized];
                var domain = hotkey_info[DOMAIN_KEY];
                // TODO: This check should be unnecessary with proper
                // validation. Remove after #5 is fixed.
                if (domain) {
                    openTab(domain, hotkey_info[DEDUPLICATE_KEY] &&
                            !overrideDeduplicate);
                }
            }
        }
    }
    // Refresh hotkeys after options edit.
    else if (request.hasOwnProperty(REFRESH_MSG)) {
        LOG_INFO("Refresh hotkeys");
        loadHotkeys();
    }
});

// Load hotkeys at background script start.
loadHotkeys();
