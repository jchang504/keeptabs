// CSS selectors.
var HOTKEY_ENTRYS_TABLE_SELECTOR = '#hotkey_entry > tbody';
var HOTKEY_ENTRY_ROWS_SELECTOR = '#hotkey_entry tr:not(:first-child)';
var HOTKEY_ENTRY_LAST_ROW_SELECTOR = '#hotkey_entry tr:last-child';
var HOTKEY_ENTRY_DELETE_SELECTOR = 'button.delete';
var INPUT_SELECTOR = 'input';
var INPUT_TEXT_SELECTOR = 'input[type="text"]';
var INPUT_DOMAIN_SELECTOR = 'input[name="domain"]';
var INPUT_HOTKEY_SELECTOR = 'input[name="hotkey"]';
var INPUT_DEDUPLICATE_SELECTOR = 'input[name="deduplicate"]';
var OPTIONS_FORM_SELECTOR = '#options';
var ADD_HOTKEY_ENTRY_BUTTON_SELECTOR = '#add_hotkey';
var SAVE_BUTTON_SELECTOR = '#save';
var CHECKED = 'checked';
var DISABLED = 'disabled';

var HOTKEY_ENTRY_HTML = ' \
    <tr> \
        <td><input required type="text" name="domain"></td> \
        <td><input required type="text" maxlength="5" name="hotkey"></td> \
        <td><input type="checkbox" name="deduplicate"></td> \
        <td><button class="delete">Delete</button></td> \
    </tr> \
';

function addHotkeyEntry() {
    $(HOTKEY_ENTRYS_TABLE_SELECTOR).append(HOTKEY_ENTRY_HTML);
    var jqHotkeyEntryRow = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
    jqHotkeyEntryRow.find(INPUT_SELECTOR).change(enableSaveButton);
    jqHotkeyEntryRow.find(HOTKEY_ENTRY_DELETE_SELECTOR).click(function() {
        jqHotkeyEntryRow.remove();
        enableSaveButton();
    });
}

function getHotkeyEntrys() {
    var hotkeys = [];
    $(HOTKEY_ENTRY_ROWS_SELECTOR).each(function() {
        var jqThis = $(this);
        var domain = jqThis.find(INPUT_DOMAIN_SELECTOR).val();
        var hotkey = jqThis.find(INPUT_HOTKEY_SELECTOR).val();
        var deduplicate = jqThis.find(INPUT_DEDUPLICATE_SELECTOR).is(':' +
                CHECKED);
        hotkeys.push({
            [DOMAIN_KEY]: domain,
            [HOTKEY_KEY]: hotkey,
            [DEDUPLICATE_KEY]: deduplicate
        });
    });
    return hotkeys;
}

function restoreHotkeyEntrys(hotkeys) {
    for (var i = 0; i < hotkeys.length; i++) {
        addHotkeyEntry();
        var jqHotkeyEntryRow = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
        jqHotkeyEntryRow.find(INPUT_DOMAIN_SELECTOR).val(
                hotkeys[i][DOMAIN_KEY]);
        jqHotkeyEntryRow.find(INPUT_HOTKEY_SELECTOR).val(
                hotkeys[i][HOTKEY_KEY]);
        jqHotkeyEntryRow.find(INPUT_DEDUPLICATE_SELECTOR).prop(CHECKED,
                hotkeys[i][DEDUPLICATE_KEY]);
    }
}

// Saves options to chrome.storage.sync.
function saveOptions() {
    var hotkeys = getHotkeyEntrys();
    chrome.storage.sync.set({
        [HOTKEYS_KEY]: hotkeys
    }, function() {
        LOG_INFO("Sending refresh request to background script");
        chrome.runtime.sendMessage({[REFRESH_MSG]: true});
        // Disable save button to indicate that options are saved.
        $(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);
    });
    return false;
}

// Restores options as previously stored in chrome.storage.sync.
function restoreOptions() {
    // Default values.
    chrome.storage.sync.get({[HOTKEYS_KEY]: HOTKEYS_DEFAULT}, function(items) {
        restoreHotkeyEntrys(items[HOTKEYS_KEY]);
    });
}

function enableSaveButton() {
    $(SAVE_BUTTON_SELECTOR).prop(DISABLED, false);
}

// Load stored options.
$(document).ready(restoreOptions);

// Set up add button.
$(ADD_HOTKEY_ENTRY_BUTTON_SELECTOR).click(addHotkeyEntry);

// Set up save button.
$(OPTIONS_FORM_SELECTOR).submit(saveOptions);
$(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);
$(INPUT_SELECTOR).change(enableSaveButton);
