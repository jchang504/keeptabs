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
