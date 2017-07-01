// CSS selectors.
var HOLD_KEY_SELECTOR ='#hold_key';
var HOTKEY_ENTRYS_TABLE_SELECTOR ='#hotkey_entry > tbody';
var HOTKEY_ENTRY_ROWS_SELECTOR ='#hotkey_entry tr:not(:first-child)';
var HOTKEY_ENTRY_LAST_ROW_SELECTOR ='#hotkey_entry tr:last-child';
var HOTKEY_ENTRY_DELETE_SELECTOR ='button.delete';
var INPUTTABLE_ELEMENT_SELECTOR ='input,select';
var INPUT_TEXT_SELECTOR ='input[type="text"]';
var INPUT_TARGET_SELECTOR ='input[name="target"]';
var INPUT_HOTKEY_SELECTOR ='input[name="hotkey"]';
var INPUT_DEDUPLICATE_SELECTOR ='input[name="deduplicate"]';
var INPUT_MATCH_PREFIX_SELECTOR ='input[name="match_prefix"]';
var OPTIONS_FORM_SELECTOR ='#options';
var ADD_HOTKEY_ENTRY_BUTTON_SELECTOR ='#add_hotkey';
var SAVE_BUTTON_SELECTOR ='#save';
var CHECKED ='checked';
var DISABLED ='disabled';

// TODO: Make match_prefix input required when we start actually using this
// field.
var HOTKEY_ENTRY_HTML = ' \
    <tr> \
        <td><input required type="text" maxlength="5" name="hotkey"></td> \
        <td><input required type="text" name="target"></td> \
        <td><input type="checkbox" name="deduplicate"></td> \
        <td><input type="text" name="match_prefix"></td> \
        <td><button class="delete">Delete</button></td> \
    </tr> \
';

function addHotkeyEntry() {
    $(HOTKEY_ENTRYS_TABLE_SELECTOR).append(HOTKEY_ENTRY_HTML);
    var jqHotkeyEntryRow = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
    // Enable the save button on input or change (for checkboxes) events.
    jqHotkeyEntryRow.find(INPUTTABLE_ELEMENT_SELECTOR).on(INPUT,
            enableSaveButton).change(enableSaveButton);
    // Enable the match prefix input iff deduplicate is checked.
    jqHotkeyEntryRow.find(INPUT_DEDUPLICATE_SELECTOR).change(function() {
        jqHotkeyEntryRow.find(INPUT_MATCH_PREFIX_SELECTOR).prop(DISABLED,
                !$(this).is(":" + CHECKED));
    });
    jqHotkeyEntryRow.find(HOTKEY_ENTRY_DELETE_SELECTOR).click(function() {
        jqHotkeyEntryRow.remove();
        enableSaveButton();
    });
}

function getHotkeyEntrys() {
    var hotkeys = [];
    $(HOTKEY_ENTRY_ROWS_SELECTOR).each(function() {
        var jqThis = $(this);
        var hotkey = jqThis.find(INPUT_HOTKEY_SELECTOR).val();
        var target = jqThis.find(INPUT_TARGET_SELECTOR).val();
        var deduplicate = jqThis.find(INPUT_DEDUPLICATE_SELECTOR).is(":" +
                CHECKED);
        var match_prefix = jqThis.find(INPUT_MATCH_PREFIX_SELECTOR).val();
        hotkeys.push({
            [HOTKEY_KEY]: hotkey,
            [TARGET_KEY]: target,
            [DEDUPLICATE_KEY]: deduplicate,
            [MATCH_PREFIX_KEY]: match_prefix
        });
    });
    return hotkeys;
}

function restoreHotkeyEntrys(hotkeys) {
    function compareHotkey(entry1, entry2) {
        if (entry1[HOTKEY_KEY] < entry2[HOTKEY_KEY]) {
            return -1;
        }
        else if (entry1[HOTKEY_KEY] > entry2[HOTKEY_KEY]) {
            return 1;
        }
        else {
            return 0;
        }
    }
    hotkeys.sort(compareHotkey);
    for (var i = 0; i < hotkeys.length; i++) {
        addHotkeyEntry();
        var jqHotkeyEntryRow = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
// TODO: Remove after options transition.
        if (hotkeys[i].hasOwnProperty(DOMAIN_KEY)) {
            hotkeys[i][TARGET_KEY] = hotkeys[i][DOMAIN_KEY];
        }
// TODO: End Remove section.
        jqHotkeyEntryRow.find(INPUT_HOTKEY_SELECTOR).val(
                hotkeys[i][HOTKEY_KEY]);
        jqHotkeyEntryRow.find(INPUT_TARGET_SELECTOR).val(
                hotkeys[i][TARGET_KEY]);
        jqHotkeyEntryRow.find(INPUT_DEDUPLICATE_SELECTOR).prop(CHECKED,
                hotkeys[i][DEDUPLICATE_KEY]);
        jqHotkeyEntryRow.find(INPUT_MATCH_PREFIX_SELECTOR).val(
                hotkeys[i][MATCH_PREFIX_KEY]);
        // Enable the match prefix input iff deduplicate is checked.
        jqHotkeyEntryRow.find(INPUT_MATCH_PREFIX_SELECTOR).prop(DISABLED,
                !hotkeys[i][DEDUPLICATE_KEY]);
    }
}

// Saves options to chrome.storage.sync.
function saveOptions() {
    var holdKey = $(HOLD_KEY_SELECTOR).val();
    var hotkeys = getHotkeyEntrys();
    chrome.storage.sync.set({
        [HOLD_KEY_KEY]: holdKey,
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
    chrome.storage.sync.get({
            [HOLD_KEY_KEY]: HOLD_KEY_DEFAULT,
            [HOTKEYS_KEY]: HOTKEYS_DEFAULT
            }, function(items) {
        $(HOLD_KEY_SELECTOR).val(items[HOLD_KEY_KEY]);
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
// Enable the save button on input events.
$(INPUTTABLE_ELEMENT_SELECTOR).on(INPUT, enableSaveButton);
