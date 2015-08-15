var addReplyHelpText = function(parentElement) {
  var replyHelpP = document.createElement('p');
  replyHelpP.className = 'na-reply-help';
  replyHelpP.innerText = 'click to reply';
  parentElement.appendChild(replyHelpP);
}

var createReplyDiv = function(replyJson) {
  var newReply = document.createElement('div');
  newReply.className = 'na-comment-reply';
  newReply.innerHTML = '<p class="na-user-name">' + (replyJson.user.name ? replyJson.user.name : replyJson.user.email) + 
  '</p><p class="na-comment-text">' + replyJson.text + '</p>';
  return newReply;
}

var createCommentDiv = function(comment, isOverlay) {
  var singleComment = document.createElement('div');
  singleComment.id = 'na-' + comment._id;
  singleComment.setAttribute('data-comment-id', comment._id);
  singleComment.className = 'na-content-element na-comment';
  if (!comment.user) {
    return null;
  }
  singleComment.innerHTML = '<p class="na-user-name">' + (comment.user.name ? comment.user.name : comment.user.email) + 
    '</p><p class="na-comment-text">' + escapeHtml(comment.text) + '</p>';
  for (var replyIdx = 0; replyIdx < comment.replies.length; replyIdx++) {
    var reply = comment.replies[replyIdx];
    singleComment.appendChild(createReplyDiv(reply));
  }
  addReplyHelpText(singleComment);
  singleComment.addEventListener('click', commentClickHandler(isOverlay));
  return singleComment;
}

var commentClickHandler = function(isOverlay) {
  return function() {
    var commentDiv = findElementOfClass(event.target, 'na-comment');
    if (!commentDiv.querySelector('form')) {
      var replyForm = document.createElement('form');
      replyForm.innerHTML = '<textarea class="na-text-input" name="reply" type="text" placeholder="reply here"></textarea>' + 
                            '<button type="submit">reply</button>';
      replyForm.className = 'na-form';
      replyForm.addEventListener('submit', replySubmitHandler(isOverlay));
      commentDiv.removeChild(commentDiv.querySelector('.na-reply-help'));
      commentDiv.appendChild(replyForm);
      if (isOverlay) {
        addCloseButton(commentDiv);
        clearTimeout(commentTimeouts[commentDiv.id]);
        delete commentTimeouts[commentDiv.id];
      }
      replyForm['reply'].focus();
    }
  };
}

var replySubmitHandler = function(isOverlay) {
  return function() {
    event.preventDefault();
    var replyFormElement = event.target;
    var commentDiv = replyFormElement.parentElement;

    var postReplyRequest = new XMLHttpRequest();
    postReplyRequest.onreadystatechange = function() {
      if (postReplyRequest.readyState === 4) {
        if (postReplyRequest.status === 200) {
          commentDiv.appendChild(createReplyDiv(JSON.parse(postReplyRequest.responseText)));
          addReplyHelpText(commentDiv);
          if (isOverlay) {
            commentDiv.removeChild(commentDiv.querySelector('.na-close-button'));
          }
          commentDiv.removeChild(replyFormElement);
          setTimeoutForComment(commentDiv);
        } else {
          alert('error submitting comment! go fuck yourself :-)');
        }
      }
    };
    postReplyRequest.open('POST', host + 'comments/' + commentDiv.dataset.commentId + '/replies');
    postReplyRequest.setRequestHeader('Content-type','application/json');
    postReplyRequest.send(JSON.stringify({'replyText': replyFormElement['reply'].value}));
  };
}

var findElementOfClass = function(targetElement, className) {
  var current = targetElement;
  while (current.className.split(' ').indexOf(className) == -1) {
    if (!current.parentElement) {
      return -1;
    }
    current = current.parentElement;
  }
  return current;
}

var addCloseButton = function(parentDiv) {
  closeButton = document.createElement('button');
  closeButton.className = 'na-close-button';
  closeButton.innerHTML = 'X';
  closeButton.addEventListener('click', function(event) {
    event.stopImmediatePropagation();
    event.target.parentElement.parentElement.removeChild(event.target.parentElement);
  });
  parentDiv.appendChild(closeButton);
}

var padNumber = function(rawInt, totalDigits) {
  return rawInt < Math.pow(10, totalDigits - 1) ? (new Array(totalDigits).join('0') + rawInt).slice(-1 * totalDigits) : rawInt;
}

var convertToReadableTime = function(totalSeconds) {
  var hours = Math.floor(totalSeconds / (60 * 60));
  var minutesAndSeconds = totalSeconds % (60 * 60);
  var minutes = Math.floor(minutesAndSeconds / 60);
  var seconds = minutesAndSeconds % 60;
  var timeString = padNumber(minutes, 2) + ':' + padNumber(seconds, 2);
  if (hours > 0) {
    timeString = padNumber(hours, 2) + ':' + timeString;
  }
  return timeString;
}

var retrieveCommentData = function(commentId, callback) {
  var commentDataRequest = new XMLHttpRequest();
  commentDataRequest.onreadystatechange = function() {
    if (commentDataRequest.readyState === 4) {
      if (commentDataRequest.status === 200) {
        callback(true, JSON.parse(commentDataRequest.responseText));
        
      } else {
        callback(false);
      }
    }
  }
  commentDataRequest.open('GET', host + 'comments/' + commentId, true);
  commentDataRequest.send();
}

var buildCommentUrl = function(comment) {
  return comment.videoUrl + '?na-start-time=' + (Math.max(comment.time * 1000 - 10000, 0));
}

var pollForNotifications = function() {
  var notificationsRequest = new XMLHttpRequest();

  // handles response
  notificationsRequest.onreadystatechange = function() {
    if (notificationsRequest.readyState === 4) {
      if (notificationsRequest.status === 200) {
        chrome.storage.local.get('na-notifications', function(storage) {
          var serverNotifications = JSON.parse(notificationsRequest.responseText);
          var unreadCount = 0;
          for (var notificationIdx = 0; notificationIdx < serverNotifications.length; notificationIdx++) {
            if (serverNotifications[notificationIdx].unread) {
              unreadCount++;
            }
          }
          chrome.storage.local.set({'na-notifications': serverNotifications});
          // chrome.browserAction.setBadgeText({text: (unreadCount > 0 ? unreadCount : '').toString()});
        });
      }
    }
  };

  // submit request for notifications
  notificationsRequest.open('GET', host + 'notifications', 'true');
  notificationsRequest.send();
}

var updateUser = function(user) {
  chrome.storage.local.set({'na-user': user});
}

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

var fetchComments = function(options, cb) {
  var commentsRequest = new XMLHttpRequest();

  commentsRequest.onreadystatechange = function() {
    if (commentsRequest.readyState === 4) {
      if (commentsRequest.status === 200) {
        cb(null, JSON.parse(commentsRequest.responseText));
      }
    }
  };
  commentsRequest.open('GET', host + 'comments?' + serialize(options));
  commentsRequest.send();
}

var createCommentSummaryDiv = function(comment) {
  var commentSummaryDiv = document.createElement('div');
  commentSummaryDiv.className = 'na-comment-summary-div bg-dark-gray-hover';
  commentSummaryDiv.setAttribute('data-comment-id', comment._id);
  commentSummaryDiv.innerHTML = 
    '<p class="na-user-name">' +
      comment.user.name +
    '</p>' +
    '<p class="na-comment-summary-text">' +
      escapeHtml(comment.text) +
    '</p>' +
    '<p>' + 
      '<span class="na-comment-summary-video">' + comment.video + '</span> at <span class="na-comment-summary-time">' + convertToReadableTime(comment.time) + '</span>' +
    '</p>';
    
  if (comment.replies.length > 0) {
    commentSummaryDiv.innerHTML +=
      '<p class="na-comment-summary-replies-count">' +
        comment.replies.length + ' replies' +
      '</p>';
  }

  commentSummaryDiv.addEventListener('click', function() {
    showCommentFullWindow(findElementOfClass(event.target, 'na-comment-summary-div'), 'na-conversations-tab');
  });

  return commentSummaryDiv;
}

var showCommentFullWindow = function(linkElement, originatingHtmlId, isNewComment) {
  retrieveCommentData(linkElement.dataset.commentId, function(success, comment) {
    if (success) {
      var oldCommentDivs = document.querySelectorAll('.na-comment');
      for (var commentIdx = 0; commentIdx < oldCommentDivs.length; commentIdx++) {
        var oldCommentDiv = oldCommentDivs[commentIdx];
        oldCommentDiv.parentElement.removeChild(oldCommentDiv);
      }
      var commentDiv = createCommentDiv(comment, false);
      if (commentDiv) {
        document.getElementById('na-conversation-video').innerText = comment.video;
        document.getElementById('na-conversation-time').innerText = convertToReadableTime(comment.time);
        var videoUrl = buildCommentUrl(comment);
        var watchVideoButtons = document.getElementById('na-conversation-div').querySelectorAll('.na-watch-video-button');
        for (var i = 0; i < watchVideoButtons.length; i++) {
          watchVideoButtons[i].setAttribute('data-video-url', videoUrl);
        };
        document.getElementById('na-conversation-div').appendChild(commentDiv);
        if (isNewComment) {
          document.getElementById('na-spoiler-patrol').style.display = 'block';
          document.getElementById('na-conversation-link').style.display = 'none';
          commentDiv.style.display = 'none';
        } else {
          document.getElementById('na-spoiler-patrol').style.display = 'none';
          document.getElementById('na-conversation-link').style.display = 'block';
          commentDiv.style.display = 'block';
        }
        showDiv('na-conversation-div');
      }
    } else {
      alert('error retrieving that conversation...probably your fault');
    }
  });
}

var showAllCommentsForVideo = function(linkElement) {
  fetchComments({'user': linkElement.dataset.commentUser, 'video': linkElement.dataset.commentVideo}, function(err, comments) {
    if (!err && comments) {
      document.getElementById('na-video-name').innerText = linkElement.dataset.commentVideo;
      var videoCommentListDiv = document.getElementById('na-comments-for-video-div');
      var commentListDiv = videoCommentListDiv.querySelector('#na-comments-for-video-list');
      videoCommentListDiv.classList.add('na-spoiler-mode');
      videoCommentListDiv.querySelector('#na-comment-list-spoiler-patrol').style.display = 'block';
      videoCommentListDiv.querySelector('.na-watch-video-button').setAttribute('data-video-url', linkElement.dataset.commentVideoUrl);
      commentListDiv.innerHTML = '';
      for (var i = 0; i < comments.length; i++) {
        var commentDiv = createCommentSummaryDiv(comments[i]);
        commentListDiv.appendChild(commentDiv);
      };
      showDiv('na-comments-for-video-div');
    } else {
      console.log('fucking oops');
    }
  });
}

var escapeHtml = function(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}