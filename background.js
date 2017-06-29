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

// Regex for host and path matching.
// DO NOT use these variables directly. Rather, use the functions
// domainMatch and hostPathMatch below. Those functions protect against
// null values.
const HOST_PATH_REGEX =
    new RegExp("^(?:http:\/\/|https:\/\/)?(?:www\.)?(([a-z0-9]+(?:[\-\.]{1}[a-z0-9]+)*\.[a-z]+)(?::[0-9]{1,5})?(?:\/.*)?)$", "i");
const HOST_PATH_INDEX = 1;
const DOMAIN_INDEX = 2;


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
        function(tabs) {
            LOG_INFO("Create new tab of: " + url);
            chrome.tabs.create({[URL]: url});
        }
    );
}


// Returns whether the host and path of the two given URL's are the same
// If either of them are null, then return false.
function hostPathMatch(url1, url2){
    if(url1 && url2){
        var result1 = HOST_PATH_REGEX.exec(url1);
        var result2 = HOST_PATH_REGEX.exec(url2);
        if(result1 && result2){
            var host_path1 = result1[HOST_PATH_INDEX];
            var host_path2 = result2[HOST_PATH_INDEX];
            return host_path1 === host_path2;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// Returns whether the domains of the two given URL's are the same.
// If either of them are null, then return false.
function domainMatch(url1, url2){
    if(url1 && url2){
        var result1 = HOST_PATH_REGEX.exec(url1);
        var result2 = HOST_PATH_REGEX.exec(url2);
        if(result1 && result2){
            var domain1 = result1[DOMAIN_INDEX];
            var domain2 = result2[DOMAIN_INDEX];
            return domain1 === domain2;
        } else {
            return false;
        }
    } else {
        return false;
    }
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
        if (deduplicate) {
            for (const tab of tabs){
                var tab_url = tab.url;
                if (domainMatch(url, tab_url)) {
                    LOG_INFO("Switch active tab to: " + tab_url);
                    navigateToTab(tab.id, tab.windowId);
                    return;
                }
            }
        }
        createNewTab(url);
    });
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
        for (const hotkey_info of items[HOTKEYS_KEY]){
            hotkeys_map[hotkey_info[HOTKEY_KEY]] = {
                [DOMAIN_KEY]: hotkey_info[DOMAIN_KEY],
                [DEDUPLICATE_KEY]: hotkey_info[DEDUPLICATE_KEY]
            };
        }
    });
}

// Open a new tab of the tab search page.
function openTabSearch() {
    LOG_INFO("Open tab search");
    createNewTab(SEARCH_URL);
}

// Navigate to the previous tab that was navigated to with KeepTabs. Useful for
// quick alt+tab style switching between two tabs.
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
                for (tab of tabs) {
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

function cycleTabs(domain, active_tab_id){
    chrome.tabs.query({},
        function(tabs) {
            var tab_index = 0;
            while(tabs[tab_index].id != active_tab_id){
                tab_index++;
            }
            LOG_INFO("Current tab index: " + tab_index);
            LOG_INFO("Number of tabs: " + tabs.length);
            
            let increment = 0;
            let curr_tab;
            let curr_index;
            //I included a check on the increment counter just to make sure we
            //don't end up in an infinite loop if something happens to the
            //active tab (like it's closed or redirected) right before this
            //function is called.
            do {
                increment++;
                curr_index = (tab_index + increment) % tabs.length;
                curr_tab = tabs[curr_index];
            } while((! domainMatch(curr_tab.url, domain)) &&
                increment < tabs.length);
            LOG_INFO("New index: " + curr_index);

            navigateToTab(curr_tab.id, curr_tab.windowId);
        }
    );

}

function handleTabSwitch(hotkey_info, overrideDeduplicate){
    var domain = hotkey_info[DOMAIN_KEY];
    chrome.tabs.query({[CURRENT_WINDOW]: true, [ACTIVE]: true},
        function(tabs) {
            var active_tab = tabs[0];
            var url = active_tab.url;
            var needToCycle = domainMatch(domain, url);
            if(needToCycle && !overrideDeduplicate){
                cycleTabs(domain, active_tab.id);

            } else {
                openTab(domain, hotkey_info[DEDUPLICATE_KEY] &&
                    !overrideDeduplicate);
            }
        }
    );
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Hold key event (pressed or released); broadcast to all tabs.
    if (request.hasOwnProperty(HOLDKEY_MSG)) {
        var pressed = request[HOLDKEY_MSG];
        var hold_event_type = pressed ? "pressed" : "released";
        LOG_INFO("Broadcasting hold key " + hold_event_type);
        chrome.tabs.query({}, function(tabs) {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {[HOLDKEY_MSG]: pressed});
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
        else {
            var normalized = hotkey.toLowerCase();
            var overrideDeduplicate = hotkey != normalized;

            LOG_INFO("received hotkey");

            if (normalized in hotkeys_map) {
                var hotkey_info = hotkeys_map[normalized];
                var domain = hotkey_info[DOMAIN_KEY];

                if(domain){
                    LOG_INFO("handling tab switch for domain: " + domain );
                    handleTabSwitch(hotkey_info, overrideDeduplicate);
                }
            }
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
