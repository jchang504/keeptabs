// CSS selectors.
var FUZZY_INPUT_SELECTOR = "#fuzzy_input";
var RESULTS_SELECTOR = "#results";
// Fuse.js options keys.
var KEYS_KEY = "keys"
var URL_KEY = "url"
var TITLE_KEY = "title"

// Global state.
var filtered_tabs = [];

function closeSearchAndNavigate(tab_id, window_id) {
    // TODO: Add support for saving last tab correctly. Probably requires
    // sending a message to the background script.
    // Close search tab.
    window.close();
    chrome.tabs.update(tab_id, {[ACTIVE]: true});
    chrome.windows.update(window_id, {[FOCUSED]: true});
}

// Navigate to the first tab in the results list.
function navigateToFirstResult(){
    LOG_INFO("Navigate to first search result");
    if (filtered_tabs && filtered_tabs.length > 0) {
        var tab = filtered_tabs[0];
        closeSearchAndNavigate(tab.id, tab.windowId);
    }
}

// A hack necessary because of function-scope/closure weirdness of Javascript,
// so that we can grab the actual value of the tab instead of a reference to
// whatever tab happens to be when the event handler gets called. Returns an
// event handler that navigates to the given tab.
function createClosure(myTab) {
    return function(e) {
        LOG_INFO("Selected from search: " + myTab.url);
        closeSearchAndNavigate(myTab.id, myTab.windowId);
    };
}

// Populate the results list with matching results.
function populate() {
    LOG_INFO("Populate the results list");
    chrome.tabs.query({}, function(tabs) {
        filtered_tabs = tabs;
        var fuzzy_input = $(FUZZY_INPUT_SELECTOR).val();
        if (fuzzy_input) {
            var fuse_options = {[KEYS_KEY]: [URL_KEY, TITLE_KEY]};
            var fuse = new Fuse(tabs, fuse_options);
            filtered_tabs = fuse.search(fuzzy_input);
        }

        // Generate the results list and click listeners.
        var results = $(RESULTS_SELECTOR);
        results.empty();
        for (var i = 0; i < filtered_tabs.length; i++) {
            var tab = filtered_tabs[i];
            var jqRow = $("<tr></tr>");
            var jqTd = $("<td></td>").appendTo(jqRow);
            var jqTabItem = $("<a></a>").appendTo(jqTd);
            jqTabItem.html(tab.url);
            jqTabItem.click(createClosure(tab));
            jqRow.appendTo(results);
        }
    });
}

$(document).ready(function() {
    populate();
    $(FUZZY_INPUT_SELECTOR).on(INPUT, populate);
    $(FUZZY_INPUT_SELECTOR).keypress(function(e){
        if (e.which == ENTER_KEY_CODE) {
            navigateToFirstResult();
        }
    });
});
