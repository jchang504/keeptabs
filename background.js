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
    if(dup){
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



function go_left_right(goLeft) {
    chrome.tabs.query({}, function(tabs) {

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
        if(curr_tab.index == 0){
            next_tab = tabs[length-1];
        }else{
            next_tab = tabs[curr_tab.index - 1];
        }
      }else{
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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var hotkey = request.hotkey;
    console.log(hotkey);

    if(hotkey == "["){
      go_left_right(true);
    }else if(hotkey == "]"){
      go_left_right(false);
    }else{
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
      if(url){
        checked_new_tab(url, isLower);
      }
    }
  }
);
