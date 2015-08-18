define({

  // check if any user is logged in
  // returns status code to @cb
  // sets na-user on chrome storage
  checkIfLoggedIn: function(cb) {
    var checkIfLoggedIn = new XMLHttpRequest();
    checkIfLoggedIn.onreadystatechange = function() {
      if (checkIfLoggedIn.readyState === 4) {
        if (checkIfLoggedIn.status === 200) {
          chrome.storage.local.set({'na-user': JSON.parse(checkIfLoggedIn.responseText)}, null);
        }
        callback(checkIfLoggedIn.status);
      }
    };
    checkIfLoggedIn.open('GET', host + 'loggedin',true);
    checkIfLoggedIn.send();
  },

  // shows div with id @htmlId
  // hides all other divs with class 'na-main-window'
  showDiv: function(htmlId) {
    var divs = document.getElementById('na-main-window').querySelectorAll('.na-browser-container');
    for (var divIdx = 0; divIdx < divs.length; divIdx++) {
      divs[divIdx].style.display = 'none';
    }
    document.getElementById(htmlId).style.display = 'inherit';
  },

  // fetches comments based on query designated by @options
  // passes status code & comments array to @cb
  fetchComments: function(options, cb) {
    var commentsRequest = new XMLHttpRequest();

    commentsRequest.onreadystatechange = function() {
      if (commentsRequest.readyState === 4) {
        cb(commentsRequest.status, JSON.parse(commentsRequest.responseText));
      }
    };

    var serialize = function(obj) {
      var str = [];
      for(var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      return str.join("&");
    }

    commentsRequest.open('GET', host + 'comments?' + serialize(options));
    commentsRequest.send();
  }
});