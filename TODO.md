## P0
    - Set up customizable non-text hotkey

## P1
    - When user saves on options page, send message to background page to
      refresh its hotkeys
    - Fix flakiness of left-right navigation. Pretty sure it's due to the
      repeat delay of the keydown event, so that when you switch to another
      tab, it doesn't recognize the hold key as down until after the repeat
      interval (or maybe if it's already down when you switch, it doesn't fire
      a keydown event at all on the new tab?).

## P2

## P3
    - Use keypress instead of keydown for letter keys and removal manual
      implementation of Shift
