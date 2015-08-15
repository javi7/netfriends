var timePollingDiv = document.createElement('div');
timePollingDiv.innerHTML = '<input id="na-time-poller-input" type="hidden"></input>';
document.body.appendChild(timePollingDiv);                          

var commentsDiv = document.createElement('div');
commentsDiv.id = 'na-comments-div';
commentsDiv.className = 'na-container';
document.body.appendChild(commentsDiv);

var getParameterByName = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var sendSimpleMessage = function(msgType, payload) {
  window.postMessage({'sender': 'nicheflix', 'task': msgType, 'payload': payload}, '*');
}

var s = document.createElement('script');
// TODO: add "script.js" to web_accessible_resources in manifest.json
s.src = chrome.extension.getURL('na-behind-enemy-lines.js');
s.onload = function() {
    this.parentNode.removeChild(this);
    var initialTime = getParameterByName('na-start-time');
    if (initialTime) {
      sendSimpleMessage('seek', initialTime);
    }

    var loadCommentId = getParameterByName('na-load-comment'); 
    if (loadCommentId) {
      retrieveCommentData(loadCommentId, function(success, comment) {
        if (success) {
          var commentDiv = createCommentDiv(comment, true);
          var addToCommentsDiv = setInterval(function() {
            if (document.getElementById('na-comments-div')) {
              document.getElementById('na-comments-div').appendChild(commentDiv);
              clearInterval(addToCommentsDiv);
            }
          }, 50);
        }
      });
    }
};

(document.head||document.documentElement).appendChild(s);

var getTimeSeconds = function() {
  return document.getElementById('na-time-poller-input') ? Math.round(document.getElementById('na-time-poller-input').value / 1000) : null; 
}

var getVideoName = function() {
  var playerStatus = document.querySelector('.player-status');
  var title = '';
  if (playerStatus) {
    var spans = playerStatus.querySelectorAll('span');
    for (var spanIdx = 0; spanIdx < spans.length; spanIdx++) {
      title += spans[spanIdx].innerText + ' ';
    }
  }
  return title.length > 0 ? title.slice(0, title.length - 1) : null;
}

document.addEventListener('keyup', function(event) {
  if (event.shiftKey && event.keyCode === 49 && event.target.className.indexOf('na-text-input') === -1 && !document.getElementById('na-input-div')) {
    var checkIfLoggedIn = new XMLHttpRequest();
    var inputDiv = document.createElement('div');
    inputDiv.id = "na-input-div";
    inputDiv.className = 'na-container na-content-element';
    checkIfLoggedIn.onreadystatechange = function() {
      if (checkIfLoggedIn.readyState === 4) {
        if (checkIfLoggedIn.status === 200) {
          var timeSeconds = getTimeSeconds();
          inputDiv.innerHTML = '<p id="na-input-time-left">@ ' + convertToReadableTime(timeSeconds) + '</p> ' +
                                '<form id="na-comment-form" class="na-form">' +
                                  '<input type="hidden" name="time" value="' + timeSeconds + '">' +
                                  '<textarea rows="2" type="text" class="na-text-input" id="na-input-comment" name="comment" placeholder="say anything (1989)"></textarea>' +
                                  '<button type="submit">submit</button' + 
                                '</form>';
          addCloseButton(inputDiv);
          document.body.appendChild(inputDiv);
          document.getElementById('na-input-comment').focus();
          document.getElementById('na-input-comment').value = '';
          document.getElementById('na-comment-form').addEventListener('submit', function(event) {
            event.preventDefault();
            var newComment = {};
            newComment['video'] = getVideoName();
            newComment['time'] = event.target['time'].value;
            newComment['text'] = event.target['comment'].value;
            newComment['videoUrl'] = window.location.href.split('?')[0];

            var postCommentRequest = new XMLHttpRequest();
            postCommentRequest.onreadystatechange = function() {
              if (postCommentRequest.readyState === 4) {
                if (postCommentRequest.status === 200) {
                  document.body.removeChild(document.getElementById('na-input-div'));
                } else {
                  alert('major fuck up. probably your fault asshole');
                }
              }
            };
            postCommentRequest.open('POST', host + 'comments');
            postCommentRequest.setRequestHeader('Content-type','application/json');
            postCommentRequest.send(JSON.stringify(newComment));
          });
        } else if (checkIfLoggedIn.status === 401) {
          inputDiv.innerText = 'please login using the banana on your toolbar :-P'
          addCloseButton(inputDiv);
          document.body.appendChild(inputDiv);
        }
      }
    };
    checkIfLoggedIn.open('GET', host + 'loggedin',true);
    checkIfLoggedIn.send();
    
  } else if (event.keyCode === 27 && event.target.className.indexOf('na-text-input') !== -1) {
    var toRemove = event.target.parentElement.parentElement;
    toRemove.parentElement.removeChild(toRemove);
  }
});

document.addEventListener('keydown', function(event) {
  if (event.target.className.indexOf('na-text-input') !== -1) {
    event.stopImmediatePropagation();
  }
});

var commentTimeouts = {};
var setTimeoutForComment = function(commentDiv) {
  commentTimeouts[commentDiv.id] = setTimeout(function(commentToRemove) {
    commentsDiv.removeChild(commentToRemove);
    delete commentTimeouts[commentToRemove.id];
  }, 10000, commentDiv);
}

setInterval(function() {
  var time = getTimeSeconds();
  var video = getVideoName();
  if (time && video) {
    fetchComments({'time': time, 'video': video}, function(err, comments) {
      for (var commentIndex = 0; commentIndex < comments.length; commentIndex++) {
        var comment = comments[commentIndex];
        if (!document.getElementById('na-' + comment._id)) {
          var singleComment = createCommentDiv(comment, true);
          if (!singleComment) {
            continue;
          }
          setTimeoutForComment(singleComment);
          commentsDiv.appendChild(singleComment);
        }
      }
    });
  }
}, 750);