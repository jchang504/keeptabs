// CSS selectors.
var FUZZY_INPUT_SELECTOR = "#fuzzy_input";
var RESULTS_SELECTOR = "#results";
// Fuse.js options keys.
var KEYS_KEY = "keys"
var URL_KEY = "url"
var TITLE_KEY = "title"

// Global state.
var filtered_tabs = [];
var selectedClassName = "selected";

function closeSearchAndNavigate(tab_id, window_id) {
    chrome.tabs.query({[CURRENT_WINDOW]: true, [ACTIVE]: true},
            function(tabs) {
        // Close search tab.
        window.close();
        // Send message to background script with tab to navigate to and current
        // tab id.
        chrome.runtime.sendMessage({[SEARCH_NAV_MSG]: true,
                [TAB_ID_KEY]: tab_id, [WINDOW_ID_KEY]: window_id,
                [CURRENT_TAB_KEY]: tabs[0].id});
    });
}

// Navigate to the first tab in the results list.
function navigateToSelectedResult(){
    LOG_INFO("Navigate to selected search result");

    var selectedIndex = $("tr." + selectedClassName).index();
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
            var jqTabHeader = $("<p class='result-title'></p>").appendTo(jqTabItem);
            jqTabHeader.append("<img class='favicon' src=" + tab.favIconUrl + ">");
            jqTabHeader.append(tab.title);
            jqTabItem.append(tab.url);
            jqTabItem.click(createClosure(tab));
            jqRow.appendTo(results);
        }

        $("tr:first").addClass(selectedClassName);
    });
}

$.fn.loopNext = function(selector){
    var selector = selector || '';
    return this.next(selector).length ? this.next(selector) : this.siblings(selector).addBack(selector).first();
}
$.fn.loopPrev= function(selector){
    var selector = selector || '';
    return this.prev(selector).length ? this.prev(selector) : this.siblings(selector).addBack(selector).last();
}

function moveSelected(isUp){
    var jqSelected = $("." + selectedClassName);
    jqSelected.removeClass(selectedClassName);

    if(isUp){
        jqSelected.loopPrev().addClass(selectedClassName);
    } else {
        jqSelected.loopNext().addClass(selectedClassName);
    }
}

function scrollToSelected(){
    $('html, body').animate({
        scrollTop: $("."+selectedClassName).offset().top - 55
    }, 100);
}

$(document).ready(function() {
    populate();
    $(FUZZY_INPUT_SELECTOR).on(INPUT, populate);
    $(FUZZY_INPUT_SELECTOR).keypress(function(e){
        //TODO: REMOVE THIS LOG
        LOG_INFO(e.which);
        if (e.which == ENTER_KEY_CODE) {
            navigateToSelectedResult();
        }
    });
    $(document).keydown(function(e){
        if (e.which === ARROW_KEY_UP ||
            e.which === ARROW_KEY_DOWN) {
            LOG_INFO("Arrow key detected");
            var isUp = e.which === ARROW_KEY_UP;
            moveSelected(isUp);
            scrollToSelected();
        }
    });

});
