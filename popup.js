function populate(){
  chrome.tabs.query({}, function(tabs){
      var id_prefix = "tab-";
      var table = document.getElementById('results');

      table.innerHTML = "";
      
      for (var i = 0; i < tabs.length; i++){

        var tab = tabs[i];
        var id = id_prefix + i;
        table.innerHTML += '<tr><td id ="' + id + '" tab_id="' + tab.id + '"'
          + ' window_id="' + tab.windowId + '"'
          + '>' + tab.url + "</td></tr>";
       
      }

      $(document).ready(function(){

        for(var j = 0; j < tabs.length; j++){

          var id = id_prefix + j;
          var jqElem = $('#' + id);
          var tab = tabs[j];
          jqElem.click(function(event){
            var target = $('#' + event.target.id);
            console.log(event.target);
            chrome.windows.update(parseInt(target.attr("window_id")), {"focused":true});
            chrome.tabs.update(parseInt(target.attr("tab_id")), {"active":true});
            window.close();
          });

        }

      });
  });

}



$(document).ready(populate);
