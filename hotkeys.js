function sendHotkeyMessage(hotkey) {
    return function() {
        console.log("Sending hotkey: " + hotkey);
        chrome.runtime.sendMessage({hotkey: hotkey});
    };
}

$(document).ready(function() {
    var HOTKEY_START_SEQUENCE = ", , ";

    var listener = new window.keypress.Listener();
    listener.sequence_delay = 400;

    // TODO: Will probably have to do from scratch:
    // - Listen for spacebar keydown
    /* - Don't enter text (prevent default behavior) while held down
     * - User can enter alphabetic characters to use hotkey
     * - On spacebar keyup, hotkey sent to background script
     * - OR they can press ; to open tab search in popup window
     * - If user holds spacebar past a certain window of time, it cancels any
     * hotkey entered. Should have a visual on the page (just fixed position
     * small animated dot or something) to indicate the time left before
     * cancel.
     */
    // TODO: Replace with loading hotkeys from options.
    sample_hotkeys = [
        'f',
        'g',
        'w'
    ];

    for (var i = 0; i < sample_hotkeys.length; ++i) {
        var sequence = HOTKEY_START_SEQUENCE + sample_hotkeys[i];
        listener.sequence_combo(sequence, sendHotkeyMessage(sample_hotkeys[i]),
                true);
        console.log("Registered listener for sequence: " + sequence);
    }
});
