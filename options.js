// CSS selectors.
var RECOMMENDED_DESCRIPTION_SELECTOR = "#recommended_description";
var CHANGED_DESCRIPTION_SELECTOR = "#changed_description";
var DETECTED_OS_SELECTOR = "#detected_os";
var HOLD_KEY_NAME_SELECTOR = ".hold_key_name";
var EXTRA_SUGGESTION_SELECTOR = "#extra_suggestion";
var HOTKEY_ENTRYS_TABLE_SELECTOR = '#hotkey_entry > tbody';
var HOTKEY_ENTRY_ROWS_SELECTOR = '#hotkey_entry tr:not(:first-child)';
var HOTKEY_ENTRY_LAST_ROW_SELECTOR = '#hotkey_entry tr:last-child';
var HOTKEY_ENTRY_DELETE_SELECTOR = 'input.delete';
var HOTKEY_ENTRY_RESTORE_SELECTOR = 'input.restore';
var INPUT_SELECTOR = 'input';
var BUTTON_TYPE_SELECTOR = '[type="button"]';
var INPUT_TEXT_SELECTOR = 'input[type="text"]';
var INPUT_HOTKEY_SELECTOR = 'input[name="hotkey"]';
var INPUT_TARGET_SELECTOR = 'input[name="target"]';
var INPUT_USE_TARGET_SELECTOR = 'input[name="use_target"]';
var INPUT_MATCH_PREFIX_SELECTOR = 'input[name="match_prefix"]';
var INPUT_ALWAYS_SELECTOR = 'input[name="always"]';
var DELETED_CLASS = "deleted";
var HOTKEY_ENTRY_INVALID_CLASS = 'invalid';
var OPTIONS_FORM_SELECTOR = '#options';
var ADD_HOTKEY_ENTRY_BUTTON_SELECTOR = '#add_hotkey';
var SAVE_BUTTON_SELECTOR = '#save';
var CLOSE_BUTTON_SELECTOR = '#close';
var WARNING_SELECTOR = '#warning';
var OPEN_ADVANCED_SELECTOR = "#open_advanced > a";
var ADVANCED_SELECTOR = "#advanced";
var HOLD_KEY_SELECTOR = '#hold_key';
var OPTION_ALT_SELECTOR = 'option[value="Alt"]';
var OPTION_META_SELECTOR = 'option[value="Meta"]';
var CHECKED = 'checked';
var DISABLED = 'disabled';
var ALPHA_REGEX = /^[A-Za-z]+$/;
// Messages.
var UNSAVED_WARNING_MSG = "You may have unsaved changes. Are you sure you want to close without saving them?";
var CLOSE_BUTTON_SAVED_MSG = "Close";
var CLOSE_BUTTON_UNSAVED_MSG = "Close (drops unsaved changes)";
var DUPLICATE_ERROR_MSG = " is already being used as a hotkey.";
var CHARACTER_ERROR_MSG = " is an invalid entry. Only alphabetic characters accepted.";
var LENGTH_ERROR_MSG = "Hotkeys cannot be empty.";
// Maps OS to extra suggestion for reducing interference with system shortcuts.
var OS_TO_EXTRA_SUGGESTION = {
    [MAC_OS]: "",
    [WINDOWS_OS]: 'You may also consider disabling the Alt+space shortcut using <a href="https://autohotkey.com/">AutoHotkey</a> to avoid interference with the KeepTabs previous tab hotkey.',
    [ANDROID_OS]: "",
    [CHROME_OS]: "",
    [LINUX_OS]: "If you're on Ubuntu with Unity, it's recommended that you disable the default Alt+space (System Settings > Keyboard > Shortcuts > Windows > 'Activate the window menu') and Alt tap (System Settings > Keyboard > Shortcuts > Launchers > 'Key to show the HUD') shortcuts. Other distros: I'm sure you can figure it out; you're using Linux after all.",
    [OPEN_BSD_OS]: ""
};
// Save OS so we know what the default hold key choice is.
var OS;

var HOTKEY_ENTRY_HTML = ' \
    <tr> \
        <td><input required type="text" maxlength="5" name="hotkey"></td> \
        <td><input required type="text" name="target"></td> \
        <td class="checkbox"><input type="checkbox" name="use_target"></td> \
        <td><input required type="text" name="match_prefix"></td> \
        <td class="checkbox"><input type="checkbox" name="always"></td> \
        <td><input class="delete" type="button" value="Delete"></input> \
        <input class="restore" type="button" value="Restore"></input></td> \
    </tr> \
';


// If the popup is open, assume the current options page is in the popup. It
// works because even if you have the options page open on chrome://extensions,
// you can't interact with it while you have the popup open, so only one of the
// options pages can ever be active at a time.
var IN_POPUP = chrome.extension.getViews({type: "popup"}).length > 0;

// The function to attach to the INPUT event handler of a target input to make
// the corresponding match prefix mirror its value.
function matchPrefixMirrorTarget() {
    var jq_target = $(this);
    jq_target.parent().parent().find(INPUT_MATCH_PREFIX_SELECTOR).val(jq_target.val());
}

// Disables the match prefix of the row and sets it to mirror the target. Also
// unchecks "Always open in new tab", since the two are mutually exclusive.
function setMatchPrefixToTarget(jq_hotkey_entry_row) {
    var jq_target = jq_hotkey_entry_row.find(INPUT_TARGET_SELECTOR);
    var jq_match_prefix = jq_hotkey_entry_row.find(INPUT_MATCH_PREFIX_SELECTOR);
    jq_match_prefix.prop(DISABLED, true);
    jq_match_prefix.val(jq_target.val());
    jq_target.on(INPUT, matchPrefixMirrorTarget);
}

// Re-enables the match prefix input and stops it from mirroring the target.
function unsetMatchPrefixToTarget(jq_hotkey_entry_row) {
    jq_hotkey_entry_row.find(INPUT_TARGET_SELECTOR).off(INPUT,
            matchPrefixMirrorTarget);
    jq_hotkey_entry_row.find(INPUT_MATCH_PREFIX_SELECTOR).prop(DISABLED, false);
}

function addHotkeyEntry() {
    $(HOTKEY_ENTRYS_TABLE_SELECTOR).append(HOTKEY_ENTRY_HTML);
    var jq_hotkey_entry_row = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
    // Enable the save button on input (or change for checkboxes) events.
    jq_hotkey_entry_row.find(INPUT_SELECTOR).on(INPUT, markUnsaved)
            .change(markUnsaved);
    // Uncheck "Always open new tab" and set match prefix to mirror target
    // iff "Use target as match prefix" is checked.
    jq_hotkey_entry_row.find(INPUT_USE_TARGET_SELECTOR).change(function() {
        if ($(this).is(":" + CHECKED)) {
            var jq_always = jq_hotkey_entry_row.find(INPUT_ALWAYS_SELECTOR);
            if (jq_always.is(":" + CHECKED)) {
                jq_always.click();
            }
            setMatchPrefixToTarget(jq_hotkey_entry_row);
        } else {
            unsetMatchPrefixToTarget(jq_hotkey_entry_row);
        }
    });
    // Uncheck "Use target as match prefix" and disable the match prefix input
    // iff "Always open new tab" is checked.
    jq_hotkey_entry_row.find(INPUT_ALWAYS_SELECTOR).change(function() {
        var always_checked = $(this).is(":" + CHECKED);
        if (always_checked) {
            var jq_use_target = jq_hotkey_entry_row.find(
                    INPUT_USE_TARGET_SELECTOR);
            if (jq_use_target.is(":" + CHECKED)) {
                jq_use_target.click();
            }
        }
        jq_hotkey_entry_row.find(INPUT_MATCH_PREFIX_SELECTOR).prop(DISABLED,
                always_checked);
    });
    // Disable the row when deleted, but still allow it to be restored.
    jq_hotkey_entry_row.find(HOTKEY_ENTRY_DELETE_SELECTOR).click(function() {
        jq_hotkey_entry_row.find(INPUT_SELECTOR).not(BUTTON_TYPE_SELECTOR)
                .prop(DISABLED, true);
        jq_hotkey_entry_row.find(HOTKEY_ENTRY_DELETE_SELECTOR).hide();
        jq_hotkey_entry_row.find(HOTKEY_ENTRY_RESTORE_SELECTOR).show();
        jq_hotkey_entry_row.addClass(DELETED_CLASS);
        markUnsaved();
    });
    // Un-disable the row when restore is clicked.
    jq_hotkey_entry_row.find(HOTKEY_ENTRY_RESTORE_SELECTOR).click(function() {
        jq_hotkey_entry_row.find(INPUT_SELECTOR).prop(DISABLED, false);
        // If either checkbox is checked, keep match prefix disabled.
        if (jq_hotkey_entry_row.find(INPUT_USE_TARGET_SELECTOR)
                .is(":" + CHECKED) || jq_hotkey_entry_row.find(
                INPUT_ALWAYS_SELECTOR).is(":" + CHECKED)) {
            jq_hotkey_entry_row.find(INPUT_MATCH_PREFIX_SELECTOR).prop(DISABLED, true);
        }
        jq_hotkey_entry_row.find(HOTKEY_ENTRY_RESTORE_SELECTOR).hide();
        jq_hotkey_entry_row.find(HOTKEY_ENTRY_DELETE_SELECTOR).show();
        jq_hotkey_entry_row.removeClass(DELETED_CLASS);
        markUnsaved();
    });
}

function getHotkeyEntries() {
    var hotkeys = [];
    $(HOTKEY_ENTRY_ROWS_SELECTOR).not("." + DELETED_CLASS).each(function() {
        var jq_this = $(this);
        var hotkey = jq_this.find(INPUT_HOTKEY_SELECTOR).val();
        // Prepare target and display changes for transparency.
        var jq_input_target = jq_this.find(INPUT_TARGET_SELECTOR);
        var target = prepareTarget(jq_input_target.val());
        jq_input_target.val(target);
        var use_target = 
            jq_this.find(INPUT_USE_TARGET_SELECTOR).is(":" + CHECKED);
        // Prepare match prefix and display changes for transparency.
        jq_input_match_prefix = jq_this.find(INPUT_MATCH_PREFIX_SELECTOR);
        var match_prefix = prepareMatchPrefix(jq_input_match_prefix.val());
        jq_input_match_prefix.val(match_prefix);
        var always_open_new_tab =
            jq_this.find(INPUT_ALWAYS_SELECTOR).is(":" + CHECKED);
        hotkeys.push({
            [HOTKEY_KEY]: hotkey,
            [TARGET_KEY]: target,
            [USE_TARGET_KEY]: use_target,
            [MATCH_PREFIX_KEY]: match_prefix,
            [ALWAYS_KEY]: always_open_new_tab
        });
    });
    return hotkeys;
}

// Prepend http:// if no scheme is specified.
function prepareTarget(target) {
    var scheme_delimiter_index = target.indexOf("://");
    if (scheme_delimiter_index == -1) {
        target = "http://" + target;
    }
    return target;
}

// Cleans up the user_prefix so it can be made a valid URL match pattern by
// adding just a *. See https://developer.chrome.com/extensions/match_patterns.
function prepareMatchPrefix(user_prefix) {
    var scheme_delimiter_index = user_prefix.indexOf("://");
    var end_of_domain_index;
    if (scheme_delimiter_index == -1) {
        end_of_domain_index = user_prefix.indexOf("/");
        // No scheme specified, use "*" (matches either http or https).
        user_prefix = "*://" + user_prefix;
    }
    else {
        end_of_domain_index = user_prefix.indexOf("/",
                scheme_delimiter_index + 3);
    }
    // If no slash within the prefix (bare domain), add a slash at the end.
    if (end_of_domain_index == -1) {
        user_prefix += "/";
    }
    return user_prefix;
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
        var jq_hotkey_entry_row = $(HOTKEY_ENTRY_LAST_ROW_SELECTOR);
        jq_hotkey_entry_row.find(INPUT_HOTKEY_SELECTOR).val(
                hotkeys[i][HOTKEY_KEY]);
        jq_hotkey_entry_row.find(INPUT_TARGET_SELECTOR).val(
                hotkeys[i][TARGET_KEY]);
        jq_hotkey_entry_row.find(INPUT_USE_TARGET_SELECTOR).prop(CHECKED,
                hotkeys[i][USE_TARGET_KEY]);
        jq_hotkey_entry_row.find(INPUT_MATCH_PREFIX_SELECTOR).val(
                hotkeys[i][MATCH_PREFIX_KEY]);
        jq_hotkey_entry_row.find(INPUT_ALWAYS_SELECTOR).prop(CHECKED,
                hotkeys[i][ALWAYS_KEY]);
        // If "Use target as match prefix" is checked, make match prefix mirror
        // target.
        if (hotkeys[i][USE_TARGET_KEY]) {
            setMatchPrefixToTarget(jq_hotkey_entry_row);
        } else {
            unsetMatchPrefixToTarget(jq_hotkey_entry_row);
        }
        // Disable the match prefix input iff "Always open new tab" is checked.
        if (hotkeys[i][ALWAYS_KEY]) {
            jq_hotkey_entry_row.find(INPUT_MATCH_PREFIX_SELECTOR).prop(
                    DISABLED, true);
        }
    }
}

// Saves options to chrome.storage.sync.
function saveOptions() {
    var holdKey = $(HOLD_KEY_SELECTOR).val();
    var hotkeys = getHotkeyEntries();
    
    chrome.storage.sync.set({
        [HOLD_KEY_KEY]: holdKey,
        [HOTKEYS_KEY]: hotkeys
    }, function() {
        LOG_INFO("Sending refresh request to background script");
        chrome.runtime.sendMessage({[REFRESH_MSG]: true});
        // Disable save button and reset close button text.
        $(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);
        $(CLOSE_BUTTON_SELECTOR).val(CLOSE_BUTTON_SAVED_MSG);
    });
    return false;
}

// Fill in the OS-specific names of the hold key choices.
function fillHoldKeyChoiceNames(os) {
    $(OPTION_ALT_SELECTOR).html(OS_TO_HOLD_KEY_NAMES[os][ALT]);
    $(OPTION_META_SELECTOR).html(OS_TO_HOLD_KEY_NAMES[os][META]);
}

// Restore all elements related to OS and hold key.
function restoreOsAndHoldKey(os, hold_key) {
    if (os == OS_EMPTY) {
        // This should never happen, unless the background script
        // somehow failed to save the OS.
        LOG_ERROR("No OS saved in chrome.storage.sync.");
        os = WINDOWS_OS;
    }
    // Save operating system in global.
    OS = os;
    fillHoldKeyChoiceNames(os);
    if (hold_key == HOLD_KEY_EMPTY || hold_key == OS_TO_DEFAULT_HOLD_KEY[os]) {
        // Use OS default hold key choice.
        hold_key = OS_TO_DEFAULT_HOLD_KEY[os];
        $(RECOMMENDED_DESCRIPTION_SELECTOR).show();
        $(DETECTED_OS_SELECTOR).html(OS_TO_READABLE_NAME[os]);
        $(EXTRA_SUGGESTION_SELECTOR).html(OS_TO_EXTRA_SUGGESTION[os]);
    }
    else {
        // Hold key changed to non-default.
        $(CHANGED_DESCRIPTION_SELECTOR).show();
    }
    $(HOLD_KEY_NAME_SELECTOR).html(OS_TO_HOLD_KEY_NAMES[os][hold_key]);
    $(HOLD_KEY_SELECTOR).val(hold_key);
}

// Restores options as previously stored in chrome.storage.sync.
function restoreOptions() {
    // Default values.
    chrome.storage.sync.get({
        [OS_KEY]: OS_EMPTY,
        [HOLD_KEY_KEY]: HOLD_KEY_EMPTY,
        [HOTKEYS_KEY]: HOTKEYS_DEFAULT
    }, function(items) {
        var hold_key = items[HOLD_KEY_KEY];
        var os = items[OS_KEY];
        restoreOsAndHoldKey(os, hold_key);
        restoreHotkeyEntrys(items[HOTKEYS_KEY]);
    });
}

function markUnsaved() {
    $(CLOSE_BUTTON_SELECTOR).val(CLOSE_BUTTON_UNSAVED_MSG);
    // Display warnings and disable save button on invalid hotkey inputs.
    var unique_hotkeys = new Set();
    $(WARNING_SELECTOR).hide();
    $(SAVE_BUTTON_SELECTOR).prop(DISABLED, false);
    $(HOTKEY_ENTRY_ROWS_SELECTOR).not("." + DELETED_CLASS).find(INPUT_HOTKEY_SELECTOR).each(function() {
        var jq_this = $(this);
        var hotkey = jq_this.val();
        jq_this.addClass(HOTKEY_ENTRY_INVALID_CLASS);
        // Duplicate checking
        if (unique_hotkeys.has(hotkey)) {
            $(WARNING_SELECTOR).show();
            $(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);
            $(WARNING_SELECTOR).html(hotkey + DUPLICATE_ERROR_MSG);
        }
        // Length validation
        else if (hotkey.length == 0) {
            $(WARNING_SELECTOR).show();
            $(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);
            $(WARNING_SELECTOR).html(LENGTH_ERROR_MSG);
        }
        // Character validation
        else if (!(hotkey.match(ALPHA_REGEX))) {
            $(WARNING_SELECTOR).show();
            $(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);
            $(WARNING_SELECTOR).html(hotkey + CHARACTER_ERROR_MSG);
        }
        else {
            jq_this.removeClass(HOTKEY_ENTRY_INVALID_CLASS);
        }
        unique_hotkeys.add(hotkey);
    });
}

// If there are unsaved changes, gives the user a confirmation dialog
// (OK/cancel) before closing.
function warnIfUnsaved() {
    if (!$(SAVE_BUTTON_SELECTOR).prop(DISABLED)) {
        if (IN_POPUP) {
            if (!confirm(UNSAVED_WARNING_MSG)) {
                return;
            }
        }
        // Chromium bug makes alert/confirm/prompt not work in options within
        // extension page; using workaround from
        // https://bugs.chromium.org/p/chromium/issues/detail?id=476350.
        else if (!chrome.extension.getBackgroundPage()
                .confirm(UNSAVED_WARNING_MSG)) {
            return;
        }
    }
    window.close();
}

function openAdvancedOptions() {
    $(OPEN_ADVANCED_SELECTOR).hide();
    $(ADVANCED_SELECTOR).show();
}

$(document).ready(function() {
    // Load stored options.
    restoreOptions();

    // Set up add button.
    $(ADD_HOTKEY_ENTRY_BUTTON_SELECTOR).click(addHotkeyEntry);

    // Set up save button.
    $(OPTIONS_FORM_SELECTOR).submit(saveOptions);
    $(SAVE_BUTTON_SELECTOR).prop(DISABLED, true);

    // Set up hold key select element.
    $(HOLD_KEY_SELECTOR).change(function() {
        var new_hold_key = $(this).val();
        $(HOLD_KEY_NAME_SELECTOR).html(OS_TO_HOLD_KEY_NAMES[OS][new_hold_key]);
        if (new_hold_key == OS_TO_DEFAULT_HOLD_KEY[OS]) {
            $(RECOMMENDED_DESCRIPTION_SELECTOR).show();
            $(CHANGED_DESCRIPTION_SELECTOR).hide();
        }
        else {
            $(CHANGED_DESCRIPTION_SELECTOR).show();
            $(RECOMMENDED_DESCRIPTION_SELECTOR).hide();
        }
        markUnsaved();
    });

    // Set up the close button.
    $(CLOSE_BUTTON_SELECTOR).click(warnIfUnsaved);

    // Set up advanced section.
    $(OPEN_ADVANCED_SELECTOR).click(openAdvancedOptions);
});
