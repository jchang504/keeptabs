var HOTKEY_ENTRYS_TABLE_SELECTOR = '#hotkey_entry > tbody';
var HOTKEY_ENTRY_ROWS_SELECTOR = '#hotkey_entry tr:not(:first-child)';
var HOTKEY_ENTRY_LAST_ROW_SELECTOR = '#hotkey_entry tr:last-child';
var HOTKEY_ENTRY_DELETE_SELECTOR = 'button.delete';
var INPUT_SELECTOR = 'input';
var INPUT_TEXT_SELECTOR = 'input[type="text"]';
var OPTIONS_FORM_SELECTOR = '#options';
var ADD_HOTKEY_ENTRY_BUTTON_SELECTOR = '#add_daily_task';
var SAVE_BUTTON_SELECTOR = '#save';
var DISABLED = 'disabled';

var HOTKEY_ENTRY_HTML = ' \
    <tr> \
        <td><input required type="text" maxlength="50"></td> \
        <td><input required type="number" min="0" max="1440"></td> \
        <td><input required type="time"></td> \
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
    var dailyTasks = [];
    $(HOTKEY_ENTRY_ROWS_SELECTOR).each(function() {
        var jqThis = $(this);
        var name = jqThis.find(INPUT_TEXT_SELECTOR).val();
        var duration = parseInt(jqThis.find(INPUT_NUMBER_SELECTOR).val());
        var completedBy =
                timeStringToMinutes(jqThis.find(INPUT_TIME_SELECTOR).val());
        dailyTasks.push({
            name: name,
            duration: duration,
            completedBy: completedBy
        });
    });
    return dailyTasks;
}

function restoreHotkeyEntrys(dailyTasks) {
    for (var i = 0; i < dailyTasks.length; i++) {
        addHotkeyEntry();
        var jqHotkeyEntryRow = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
        jqHotkeyEntryRow.find(INPUT_TEXT_SELECTOR).val(dailyTasks[i].name);
        jqHotkeyEntryRow.find(INPUT_NUMBER_SELECTOR).val(dailyTasks[i].duration);
        jqHotkeyEntryRow.find(INPUT_TIME_SELECTOR).val(
                minutesToTimeString(dailyTasks[i].completedBy));
    }
}

// Saves options to chrome.storage.sync.
function saveOptions() {
    var dailyTasks = getHotkeyEntrys();
    chrome.storage.sync.set({
        dailyTasks: dailyTasks,
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
        dailyTasks: [],
    }, function(items) {
        restoreHotkeyEntrys(items.dailyTasks);
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
