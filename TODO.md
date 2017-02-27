## P0
    - Switch to non-text key for hotkey

## P1
    - When user saves on options page, send message to background page to
      refresh its hotkeys
    - Prevent default behavior of Escape (hold key) better (on facebook.com,
      still closes chat window). Probably just need to grab the event at the
      top level of the DOM and prevent it from capturing down the tree (instead
      of preventing bubbling up, since when it gets to document it has already
      bubbled almost all the way up from the source element).

## P2

## P3
    - Use keypress instead of keydown for letter keys and removal manual
      implementation of Shift
