/*
 * url: the string that includes the protocol and domain name of the site you want to go to
 * (e.g. "https://google.com"). Must include the "www." if applicable.
 * deduplicate: true if you want to check for a duplicate and go to it if it exists instead of
 * creating a new tab. false if you want to create a new tab regardless of pre-existing tabs.
 */
function checked_new_tab(url, deduplicate){

  chrome.tabs.query({}, function(tabs){

    var domain_regex = new RegExp('^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)', 'i');
    var target_domain = domain_regex.exec(url)[1];
    if(deduplicate){
      for (tab of tabs){
        var tab_url = tab.url;
        var tab_domain = domain_regex.exec(tab_url)[1];
        if (target_domain == tab_domain){
          var tab_id = tab.id;
          // TODO: For multi-window, it makes the matching tab the active tab
          // of its window. Need to also switch focus to that window.
          console.log("Switch active tab to: " + tab_url);
          chrome.tabs.update(tab_id, {"active":true});
          chrome.windows.update(tab.windowId, {"focused":true});
          return;
        };
      }
    }
    console.log("Create new tab of: " + url);
    chrome.tabs.create({"url": url});

  });

}



function go_left_right(goLeft) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {

      var curr_tab;
      for (tab of tabs){
          if(tab.active){
            curr_tab = tab;
            break;
          }
      }

      var next_tab;
      var length = tabs.length;
      if(goLeft){
        console.log("Switch active tab to left");
        if(curr_tab.index == 0){
            next_tab = tabs[length-1];
        }else{
            next_tab = tabs[curr_tab.index - 1];
        }
      }else{
        console.log("Switch active tab to right");
        if(curr_tab.index == length - 1){
            next_tab = tabs[0];
        }else{
            next_tab = tabs[curr_tab.index + 1];
        }
      }
      chrome.tabs.update(next_tab.id, {"active":true});
    });
}

var mappings = {};

function get_mapped_domains() {
  chrome.storage.sync.get({
    hotkeys:[]
  }, function(items){

    for (hotkey_info of items.hotkeys){
      var hotkey_map = {};
      var hotkey = hotkey_info.hotkey;
      hotkey_map.domain = hotkey_info.domain;
      hotkey_map.deduplicate = hotkey_info.deduplicate;

      mappings[hotkey] = hotkey_map;

    }
  });
}

get_mapped_domains()

var NAV_LEFT_SYMBOL = '[';
var NAV_RIGHT_SYMBOL = ']';

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      var hotkey = request.hotkey;
      console.log("Received hotkey: " + hotkey);

      if(hotkey == NAV_LEFT_SYMBOL){
          go_left_right(true);
      }
      else if(hotkey == NAV_RIGHT_SYMBOL){
          go_left_right(false);
      }
      else{
          var normalized = hotkey.toLowerCase();
          var overrideDeduplicate = hotkey != normalized;

          if (normalized in mappings) {
              var hotkey_info = mappings[normalized];
              domain = hotkey_info.domain;
              if (domain) {
                  checked_new_tab(domain, hotkey_info.deduplicate &&
                        !overrideDeduplicate);
              }
          }
      }
  }
);