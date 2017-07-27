// CSS selectors.
var FUZZY_INPUT_SELECTOR = "#fuzzy_input";
var RESULTS_SELECTOR = "#search_results > table > tbody";
// Fuse.js options keys.
var KEYS_KEY = "keys";
var URL_KEY = "url";
var TITLE_KEY = "title";

// Global state.
var MAX_TITLE_LENGTH = 90;
var MAX_URL_LENGTH = 70;
var filtered_tabs = [];
var SELECTED_CLASS_NAME = "selected";

function closeSearchAndNavigate(tab_id, window_id) {
    // Close search UI.
    in_tab_search = false;
    $(OVERLAY_SELECTOR).hide();
    $(SEARCH_BAR_SELECTOR + ", " + SEARCH_RESULTS_SELECTOR).hide();
    $(OVERLAY_SELECTOR).css(OVERLAY_ANIMATION_UNDO);
    chrome.runtime.sendMessage({[SEARCH_SELECT_MSG]:
            {[TAB_ID_KEY]: tab_id, [WINDOW_ID_KEY]: window_id}});
}

// Navigate to the first tab in the results list.
function navigateToSelectedResult(){
    LOG_INFO("Navigate to selected search result");
    var selectedIndex = $(RESULTS_SELECTOR).find("tr." + SELECTED_CLASS_NAME)
            .index();
    var selectedTab = filtered_tabs[selectedIndex];
    closeSearchAndNavigate(selectedTab.id, selectedTab.windowId);
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
    var fuzzy_input = $(FUZZY_INPUT_SELECTOR).val();
    if (fuzzy_input.length > 0) {
        var fuse_options = {[KEYS_KEY]: [URL_KEY, TITLE_KEY]};
        // search_tabs is the original full list of tabs from hotkeys.js.
        var fuse = new Fuse(search_tabs, fuse_options);
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
        var jqTabHeader = $("<p class='result-title'></p>").appendTo(jqTabItem);
        jqTabHeader.append("<img class='favicon' src=" + tab.favIconUrl + ">");
        if (tab.title.length > MAX_TITLE_LENGTH) {
            var formattedTitle = tab.title.substring(0, MAX_TITLE_LENGTH) + "...";
        }
        else {
            var formattedTitle = tab.title;
        }
        jqTabHeader.append(formattedTitle);
        if (tab.url.length > MAX_URL_LENGTH) {
            var formattedUrl = tab.url.substring(0, MAX_URL_LENGTH) + "...";
        }
        else {
            var formattedUrl = tab.url;
        }
        jqTabItem.append(formattedUrl);
        jqTabItem.click(createClosure(tab));
        jqRow.appendTo(results);
    }
    $(RESULTS_SELECTOR).find("tr:first-child").addClass(SELECTED_CLASS_NAME);
}

/* This function is just a wrapper function for the jquery function
 * next(selector) except that it wraps around to the beginning of the list of
 * siblings if you reach the end. 
 */
$.fn.loopNext = function(selector){
    var selector = selector || '';
    return this.next(selector).length ? this.next(selector) : this.siblings(selector).addBack(selector).first();
}

/* This function is just a wrapper function for the jquery function
 * prev(selector) except that it wraps around to the beginning of the list of
 * siblings if you reach the beginning. 
 */
$.fn.loopPrev= function(selector){
    var selector = selector || '';
    return this.prev(selector).length ? this.prev(selector) : this.siblings(selector).addBack(selector).last();
}

// Returns a JQuery object of the new selected row.
function moveSelected(isUp){
    var jqSelected = $("." + SELECTED_CLASS_NAME);
    jqSelected.removeClass(SELECTED_CLASS_NAME);
    var new_selected = isUp ? jqSelected.loopPrev() : jqSelected.loopNext();
    new_selected.addClass(SELECTED_CLASS_NAME);
    return new_selected;
}

$(document).ready(function() {
    // Set up the tab search UI.
    $(FUZZY_INPUT_SELECTOR).on(INPUT, populate);
    $(FUZZY_INPUT_SELECTOR).keypress(function(e){
        if (e.key == ENTER_KEYVAL) {
            navigateToSelectedResult();
        }
    });
    $(window).keydown(function(e){
        if (in_tab_search) {
            if (e.key === ARROW_UP_KEYVAL || e.key === ARROW_DOWN_KEYVAL) {
                var isUp = e.key === ARROW_UP_KEYVAL;
                var new_selected = moveSelected(isUp);
                new_selected[0].scrollIntoView();
            }
        }
    });
});
