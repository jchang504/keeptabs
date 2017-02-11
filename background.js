/*
 * url: the string that includes the protocol and domain name of the site you want to go to
 * (e.g. "https://google.com"). Must include the "www." if applicable.
 * deduplicate: true if you want to check for a duplicate and go to it if it exists instead of
 * creating a new tab. false if you want to create a new tab regardless of pre-existing tabs.
 */
function checked_new_tab(url, deduplicate){

  chrome.tabs.query({}, function(tabs){

    var domain_regex = new RegExp('^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)', 'i');
    var curr_domain = domain_regex.exec(url)[1];
    if(deduplicate){
      for (tab of tabs){
        var tab_url = tab.url;
        var tab_domain = domain_regex.exec(tab_url)[1];
        if(curr_domain === tab_domain){
          var tab_id = tab.id;
          chrome.tabs.update(tab_id, {"active":true});
          return;
        };
      }
    }
    chrome.tabs.create({"url": url});

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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var hotkey = request.hotkey;
    console.log(hotkey);
    var isLower = true;
    var alpha_regex = new RegExp('/^[A-Z]$')
    for (c of hotkey) {
      var check_value = alpha_regex.exec(c);
      if(check_value){
        isUpper = false;
        break;
      }
    }

    url = mappings.hotkey;
    console.log(mappings);
    if(url){
      checked_new_tab(url, isLower);
    }

  }
);
