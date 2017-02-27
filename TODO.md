## P0
    - Switch to non-text key for hotkey

## P1
    - When user saves on options page, send message to background page to
      refresh its hotkeys
    - Fix flakiness of left-right navigation. Pretty sure it's due to the
      repeat delay of the keydown event, so that when you switch to another
      tab, it doesn't recognize the hold key as down until after the repeat
      interval (or maybe if it's already down when you switch, it doesn't fire
      a keydown event at all on the new tab?).
      
    - Prevent default behavior of Escape (hold key) better (on facebook.com,
      still closes chat window). Probably just need to grab the event at the
      top level of the DOM and prevent it from capturing down the tree (instead
      of preventing bubbling up, since when it gets to document it has already
      bubbled almost all the way up from the source element).

## P2

## P3
    - Use keypress instead of keydown for letter keys and removal manual
      implementation of Shift
