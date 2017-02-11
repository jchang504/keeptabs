var HOTKEY_ENTRYS_TABLE_SELECTOR = '#hotkey_entry > tbody';
var HOTKEY_ENTRY_ROWS_SELECTOR = '#hotkey_entry tr:not(:first-child)';
var HOTKEY_ENTRY_LAST_ROW_SELECTOR = '#hotkey_entry tr:last-child';
var HOTKEY_ENTRY_DELETE_SELECTOR = 'button.delete';
var INPUT_SELECTOR = 'input';
var INPUT_TEXT_SELECTOR = 'input[type="text"]';
var INPUT_CHECK_SELECTOR = 'input[type="checkbox"]';
var INPUT_DOMAIN_SELECTOR = 'input[name="domain"]';
var INPUT_HOTKEY_SELECTOR = 'input[name="hotkey"]';
var INPUT_DEDUPLICATE_SELECTOR = 'input[name="deduplicate"]';
var OPTIONS_FORM_SELECTOR = '#options';
var ADD_HOTKEY_ENTRY_BUTTON_SELECTOR = '#add_hotkey';
var SAVE_BUTTON_SELECTOR = '#save';
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
    var hotKeys = [];
    $(HOTKEY_ENTRY_ROWS_SELECTOR).each(function() {
        var jqThis = $(this);
        var domain = jqThis.find(INPUT_DOMAIN_SELECTOR).val();
        var hotkey = jqThis.find(INPUT_HOTKEY_SELECTOR).val();
        var deduplicate = jqThis.find(INPUT_CHECK_SELECTOR).val();
        hotKeys.push({
            domain: domain,
            hotkey: hotkey,
            deduplicate: deduplicate
        });
    });
    return hotKeys;
}

function restoreHotkeyEntrys(hotKeys) {
    for (var i = 0; i < hotKeys.length; i++) {
        addHotkeyEntry();
        var jqHotkeyEntryRow = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
        jqHotkeyEntryRow.find(INPUT_DOMAIN_SELECTOR).val(hotKeys[i].domain);
        jqHotkeyEntryRow.find(INPUT_HOTKEY_SELECTOR).val(hotKeys[i].hotkey);
        jqHotkeyEntryRow.find(INPUT_DEDUPLICATE_SELECTOR).val(hotKeys[i].deduplicate);
    }
}

// Saves options to chrome.storage.sync.
function saveOptions() {
    var hotKeys = getHotkeyEntrys();
    chrome.storage.sync.set({
        hotKeys: hotKeys
    }, function() {
        // Disable save button to indicate that options are saved.
        $(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);
    });
    return false;
}

// Restores options as previously stored in chrome.storage.sync.
function restoreOptions() {
    // Default values.
    chrome.storage.sync.get({
        hotKeys: []
    }, function(items) {
        restoreHotkeyEntrys(items.hotKeys);
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
