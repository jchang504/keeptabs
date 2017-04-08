// Regex for domain matching.
var domain_regex = new RegExp('^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)', 'i');

// Global state.
var hotkeys_map = {};

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
                    var tab_id = tab.id;
                    console.log("Switch active tab to: " + tab_url);
                    chrome.tabs.update(tab_id, {[ACTIVE]: true});
                    chrome.windows.update(tab.windowId, {[FOCUSED]: true});
                    return;
                };
            }
        }
        console.log("Create new tab of: " + url);
        chrome.tabs.create({[URL]: url});
    });
}

function navigateLeftRight(is_left) {
    chrome.tabs.query({[CURRENT_WINDOW]: true}, function(tabs) {
        var curr_tab_index;
        for (tab of tabs) {
            if (tab.active) {
                curr_tab_index = tab.index;
                break;
            }
        }
        var length = tabs.length;
        var offset = is_left ? -1 : 1;
        var next_tab_index = (curr_tab_index + length + offset) % length;
        var direction = is_left ? "left" : "right";
        console.log("Switch active tab to " + direction);
        chrome.tabs.update(tabs[next_tab_index].id, {[ACTIVE]: true});
    });
}

function closeCurrentTab() {
    console.log("Close current tab");
    chrome.tabs.query({[CURRENT_WINDOW]: true, [ACTIVE]: true},
            function(currentTab) {
        chrome.tabs.remove(currentTab[0].id);
    });
}

// Load hotkeys from Chrome storage into global map.
function loadHotkeys() {
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
        console.log("Broadcasting hold key " + (pressed ? "pressed" :
                "released") + ".");
        chrome.tabs.query({}, function(tabs) {
            for (tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {[HOLDKEY_MSG]: pressed});
            }
        });
    }
    // Hotkey sent.
    else if (request.hasOwnProperty(HOTKEY_MSG)) {
        var hotkey = request[HOTKEY_MSG];
        console.log("Received hotkey: " + hotkey);
        if (hotkey == NAV_LEFT_SYMBOL){
            navigateLeftRight(true);
        }
        else if (hotkey == NAV_RIGHT_SYMBOL){
            navigateLeftRight(false);
        }
        else if (hotkey == TAB_CLOSE_SYMBOL) {
            closeCurrentTab();
        }
        else if (hotkey == TAB_SEARCH_SYMBOL) {
            console.log("Open tab search");
            chrome.tabs.create({[URL]: SEARCH_URL});
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
        console.log("Refreshing hotkeys.");
        loadHotkeys();
    }
});

// Load hotkeys at background script start.
loadHotkeys();
