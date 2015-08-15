var loggedIn = false;

var updateSettingsForm = function() {
  chrome.storage.local.get('na-user', function(storage) {
    var settingsMap = storage['na-user'].settings;
    var settingsForm = document.getElementById('na-account-settings-form');
    for (var setting in settingsMap) {
      if (settingsMap.hasOwnProperty(setting) && settingsForm[setting]) {
        settingsForm[setting].checked = settingsMap[setting];
      }
    }
  });
}

var createFollowingDiv = function(user, followingStatus, requestId) {
  var followingDiv = document.createElement('div');
  followingDiv.className = 'na-following-div';
  followingDiv.innerHTML = '<p class="na-user-name">' + user.name + '</p>';
  if (followingStatus === 'incoming-request') {
    var respondToStatusHandler = function(event) {
      var statusResponse = new XMLHttpRequest();
      statusResponse.onreadystatechange = function() {
        if (statusResponse.readyState === 4 && statusResponse.status === 200) {
          if (statusResponse.responseText.indexOf('successfully') > -1) {
            findElementOfClass(event.target, 'na-following-div').querySelector('.na-follower-request-response-buttons').innerHTML = event.target.innerText + 'ed';
          }
        }
      }
      statusResponse.open('GET', host + 'followrequest/' + event.target.dataset.requestId + '?accept=' + (event.target.innerText === 'accept'), true);
      statusResponse.send();
    }
    var buttonSpan = document.createElement('span');
    buttonSpan.className = 'na-follower-request-response-buttons';
    var acceptButton = document.createElement('button');
    acceptButton.setAttribute('data-request-id', requestId);
    acceptButton.innerText = 'accept';
    acceptButton.addEventListener('click', respondToStatusHandler);
    var rejectButton = document.createElement('button');
    rejectButton.setAttribute('data-request-id', requestId);
    rejectButton.innerText = 'reject';
    rejectButton.addEventListener('click', respondToStatusHandler);
    buttonSpan.appendChild(acceptButton);
    buttonSpan.appendChild(rejectButton);
    followingDiv.appendChild(buttonSpan);
  } else {
    var followOrUnfollowButton = document.createElement('button');
    if (followingStatus === 'pending') {
      followOrUnfollowButton.innerText = 'pending';
      followOrUnfollowButton.className = 'na-inactive-button';
    } else {
      followOrUnfollowButton.innerText = followingStatus === 'following' ? 'unfollow' : 'follow';
      followOrUnfollowButton.addEventListener('click', createFollowOrUnfollowHandler(user._id));
    }
    followingDiv.appendChild(followOrUnfollowButton);
  }
  return followingDiv;
}

var createFollowOrUnfollowHandler = function(userId) {
  return function(event) {
    event.preventDefault();
    var intendToFollow = event.target.innerText === 'follow';
    var followRequest = new XMLHttpRequest();
    followRequest.onreadystatechange = function() {
      if (followRequest.readyState === 4 && followRequest.status === 200) {
        updateUser(JSON.parse(followRequest.responseText));
        event.target.innerText = intendToFollow ? 'unfollow' : 'follow';
      }
    }
    followRequest.open('PUT', host + 'follow', true);
    followRequest.setRequestHeader("Content-type","application/json");
    followRequest.send('{"' + userId + '":' + intendToFollow.toString() + '}');
  }
}

var updateFollowingList = function() {
  chrome.storage.local.get('na-user', function(storage) {
    var requestFollowingInfo = new XMLHttpRequest();
    requestFollowingInfo.onreadystatechange = function() {
      if (requestFollowingInfo.readyState === 4 && requestFollowingInfo.status === 200) {
        var followingList = JSON.parse(requestFollowingInfo.responseText);
        var followingListDiv = document.getElementById('na-following-list');
        if (followingList.length === 0) {
          followingListDiv.innerHTML = '<p>you must be lonely ;-(</p><p>start following some users :-)</p>';
        } else {
          followingListDiv.innerHTML = '';
        }
        for (var i = 0; i < followingList.length; i++) {
          followingListDiv.appendChild(createFollowingDiv(followingList[i], 'following'));
        } 
      }
    }

    var requestFollowerRequests = new XMLHttpRequest();
    requestFollowerRequests.onreadystatechange = function() {
      if (requestFollowerRequests.readyState === 4 && requestFollowerRequests.status === 200) {
        var followerRequests = JSON.parse(requestFollowerRequests.responseText);
        var followerRequestsListDiv = document.getElementById('na-follower-requests-list');
        if (followerRequests.length === 0) {
          document.getElementById('na-follower-requests-list-container').style.display = 'none';
        } else {
          document.getElementById('na-follower-requests-list-container').style.display = 'block';
          followerRequestsListDiv.innerHTML= '';
        }
        for (var i = 0; i < followerRequests.length; i++) {
          followerRequestsListDiv.appendChild(createFollowingDiv(followerRequests[i].requestingUser, 'incoming-request', followerRequests[i]._id));
        };
      }
    }

    requestFollowerRequests.open('GET', host + 'followerrequests');
    requestFollowerRequests.send();

    var idString = '';
    for (var i = 0; i < storage['na-user'].following.length; i++) {
      if (i != 0 ) {
        idString += '&';
      }
      idString += 'id=' + storage['na-user'].following[i];
    };
    requestFollowingInfo.open('GET', host + 'users?' + idString, true);
    requestFollowingInfo.send();
  });
}

var preShow = {
  'na-conversations-tab': function() {
    fetchComments({'useLoggedInUser': true, 'allConvos': true}, function(err, comments) {
      if (!err && comments) {
        var conversationsTab = document.getElementById('na-conversations-tab');
        conversationsTab.innerHTML = '';
        for (var i = 0; i < comments.length; i++) {
          var comment = comments[i];
          var commentSummaryDiv = createCommentSummaryDiv(comment);
          conversationsTab.appendChild(commentSummaryDiv);
        };
      }
    })
  },
  'na-notifications-tab': pollForNotifications,
  'na-logged-out': function() {
    document.getElementById('na-menu-div').style.display = 'none';
  },
  'na-account-tab': updateSettingsForm,
  'na-friends-tab': updateFollowingList
};

var showDiv = function(htmlId) {
  if (preShow[htmlId]) {
    preShow[htmlId]();
  }
  var divs = document.getElementById('na-main-window').querySelectorAll('.na-browser-container');
  for (var divIdx = 0; divIdx < divs.length; divIdx++) {
    divs[divIdx].style.display = 'none';
  }
  document.getElementById(htmlId).style.display = 'inherit';

  var menuItems = document.querySelectorAll('.na-menu-item');
  for (var i = 0; i < menuItems.length; i++) {
    var menuItem = menuItems[i];
    if (menuItem.getAttribute('href') === htmlId) {
      menuItem.classList.add('na-menu-item-active');
    } else {
      menuItem.classList.remove('na-menu-item-active');
    }
  };
}

var transitionToLoggedIn = function(responseString) {
  pollForNotifications();
  chrome.storage.local.get('na-notifications', function(storage) {
    updateNotifications(storage['na-notifications']);
  });
  loggedIn = true;
  var user = JSON.parse(responseString);

  document.getElementById('na-menu-div').style.display = 'initial';
  document.getElementById('na-account-tab-user-span').innerText = user.name;
  showDiv('na-conversations-tab');
}

var transitionToLogin = function() {
  showDiv('na-login-div');
  document.getElementById('na-login-form')['email'].focus();
}

var createNotiDiv = function(notification) {
  var newNotiDiv = document.createElement('div');
  newNotiDiv.id = 'na-noti-' + notification._id;
  newNotiDiv.setAttribute('data-comment-id', notification.comment._id);
  newNotiDiv.setAttribute('data-unread', notification.unread);
  newNotiDiv.setAttribute('data-comment-video', notification.comment.video);
  newNotiDiv.setAttribute('data-comment-user', notification.comment.user);
  newNotiDiv.setAttribute('data-comment-video-url', notification.comment.videoUrl);
  newNotiDiv.className = 'na-notification bg-dark-gray-hover';
  var notiHtml = '';
  if (notification.type === 'reply') {
    if (notification.newReplies > 1) {
      notiHtml = '<p>' + notification.newReplies + ' new replies on a discussion on ';
    } else {
      notiHtml = '<p><span class="na-user-name">' + notification.names[0] + '</span> replied to a discussion on ';
    }
    notiHtml += notification.comment.video + ' at ' + convertToReadableTime(notification.comment.time) + '</p>';
  } else if (notification.type === 'newComment') {
    if (notification.comments === 1) {
      notiHtml = '<p><span class="na-user-name">' + notification.notifyingUser + '</span> posted a new comment on ' + notification.comment.video + ' at ' + convertToReadableTime(notification.comment.time) + '</p>';
    } else {
      notiHtml = '<p><span class="na-user-name">' + notification.notifyingUser + '</span> posted ' + notification.comments + ' new comments on ' + notification.comment.video + '</p>';
    }
  }
  newNotiDiv.innerHTML = notiHtml;
  newNotiDiv.addEventListener('click', createNotificationClickHandler(notification));
  return newNotiDiv;
}

var createNotificationClickHandler = function(notification) {
  return function(event) {
    event.preventDefault();
    var notiDiv = findElementOfClass(event.target, 'na-notification');

    if (notification.type === 'newComment' && notification.comments > 1) {
      showAllCommentsForVideo(notiDiv);
    } else {
      showCommentFullWindow(notiDiv, 'na-notifications-tab', notification.type === 'newComment');
    }

    if (notiDiv.dataset.unread) {
      markNotisReadRequest = new XMLHttpRequest();
      markNotisReadRequest.open('POST', host + 'markNotificationsAsRead', true);
      markNotisReadRequest.setRequestHeader("Content-type","application/json");
      markNotisReadRequest.send('{"commentId":"' + notiDiv.dataset.commentId + '"}');

      chrome.browserAction.getBadgeText({}, function(badgeText) {
        var unreadCount = parseInt(badgeText) - 1;
        chrome.browserAction.setBadgeText({text: (unreadCount > 0 ? unreadCount : '').toString()});
      });
    }
  };
}

var updateNotifications = function(notificationsArray) {
  var prevNotifications = document.querySelectorAll('.na-notification');
  for (var divIdx = 0; divIdx < prevNotifications.length; divIdx++) {
    document.getElementById('na-notifications-tab').removeChild(prevNotifications[divIdx]);
  }
  var unreadCount = 0;
  for (var notificationIdx = 0; notificationIdx < notificationsArray.length; notificationIdx++) {
    var notification = notificationsArray[notificationIdx];
    unreadCount = notification.unread ? unreadCount + 1 : unreadCount;
    var notiDiv = createNotiDiv(notification);
    document.getElementById('na-notifications-tab').appendChild(notiDiv);
  }
  chrome.browserAction.setBadgeText({text: (unreadCount > 0 ? unreadCount : '').toString()});
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.onUpdateAvailable.addListener(function(details) {
    chrome.runtime.reload();
  });

  chrome.runtime.requestUpdateCheck(function(status) {
  });
  var checkIfLoggedIn = new XMLHttpRequest();
  checkIfLoggedIn.onreadystatechange = function() {
    if (checkIfLoggedIn.readyState === 4) {
      if (checkIfLoggedIn.status === 200) {
        transitionToLoggedIn(checkIfLoggedIn.responseText);
        updateUser(JSON.parse(checkIfLoggedIn.responseText));
      } else if (checkIfLoggedIn.status === 401) {
        showDiv('na-logged-out');
      }
    }
  };
  checkIfLoggedIn.open('GET', host + 'loggedin',true);
  checkIfLoggedIn.send();

  document.getElementById('na-logout-button').addEventListener('click', function(event) {
    event.preventDefault();
    var logoutRequest = new XMLHttpRequest();
    logoutRequest.onreadystatechange = function() {
      if (logoutRequest.readyState === 4) {
        if (logoutRequest.status === 200) {
          loggedIn = false;
          document.getElementById('na-menu-div').style.display = 'none';
          showDiv('na-logged-out');
        } else {
          alert('unknown error occurred trying to log out. tweet @javijavi7');
        }
      }
    }
    logoutRequest.open('POST',  host + 'logout', true);
    logoutRequest.send();
  });

  document.getElementById('na-login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    // clear any error text
    if (document.getElementById('na-error-text')) {
      document.getElementById('na-login-div').removeChild(document.getElementById('na-error-text'));
    }

    // get email & password from form
    var loginForm = document.getElementById('na-login-form');
    var email = loginForm['email'].value;
    var password = loginForm['password'].value;

    // attempt to login
    var loginRequest = new XMLHttpRequest();
    loginRequest.onreadystatechange = function() {
      if (loginRequest.readyState === 4) {
        if (loginRequest.status === 200) {
          transitionToLoggedIn(loginRequest.responseText);
          updateUser(JSON.parse(loginRequest.responseText));
        } else if (loginRequest.status === 401) {
          var errorText = document.createElement('p');
          errorText.id = 'na-error-text';
          errorText.innerText = 'invalid email or password';
          document.getElementById('na-login-div').appendChild(errorText);
        } 
      } 
    };
    loginRequest.open("POST", host + 'login', true);
    loginRequest.setRequestHeader("Content-type","application/json");
    loginRequest.send('{"email":"' + email + '","password":"' + password + '"}');
  });

  document.getElementById('na-register-form').addEventListener('submit', function(event) {
    event.preventDefault()

    var registerForm = document.getElementById('na-register-form');
    var name = registerForm['name'].value;
    var email = registerForm['email'].value;
    var password = registerForm['password'].value;

    var registerRequest = new XMLHttpRequest();
    registerRequest.onreadystatechange = function() {
      if (registerRequest.readyState === 4) {
        if (registerRequest.status === 200) {
          transitionToLoggedIn(registerRequest.responseText);
          updateUser(JSON.parse(registerRequest.responseText));
        } else {
          alert('error registering. let\'s be honest. you probably fucked this up for all of us');
        }
      }
    };
    registerRequest.open('POST',  host + 'register', true);
    registerRequest.setRequestHeader("Content-type","application/json");
    registerRequest.send('{"name":"' + name + '","email":"' + email + '","password":"' + password + '"}');
  });

  document.getElementById('na-login-screen-button').addEventListener('click', function(event) {
    transitionToLogin();
  });

  document.getElementById('na-register-screen-button').addEventListener('click', function(event) {
    showDiv('na-register-div');
  });

  var watchVideoButtons = document.querySelectorAll('.na-watch-video-button');
  for (var i = 0; i < watchVideoButtons.length; i++) {
    watchVideoButtons[i].addEventListener('click', function(event) {
      event.preventDefault();
      var targetButton = event.target;
      var targetUrl = targetButton.className.indexOf('na-watch-video-from-start') === -1 ? targetButton.dataset.videoUrl : targetButton.dataset.videoUrl.split('?')[0];
      chrome.tabs.query({url: '*://*.netflix.com/*'}, function(tabs) {
        if (tabs.length > 0) {
          if (confirm('I have to redirect your existing Netflix tab for you to jump to this clip. Would you like to continue?')) {
            for (var i = 0; i < tabs.length; i++) {
              chrome.tabs.update(tabs[i].id, {'url': targetUrl, 'active': true}, null);
            };
          }
        } else {
          chrome.tabs.create({ url: targetUrl });
        }
      });
    })
  };

  document.getElementById('na-see-comment-button').addEventListener('click', function(event){
    event.preventDefault();
    document.getElementById('na-spoiler-patrol').style.display = 'none';
    document.getElementById('na-conversation-link').style.display = 'block';
    document.getElementById('na-conversation-div').querySelector('.na-comment').style.display = 'block';
  });

  document.getElementById('na-reveal-comments-button').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('na-comments-for-video-div').classList.remove('na-spoiler-mode');
    document.getElementById('na-comment-list-spoiler-patrol').style.display = 'none';
  });

  document.getElementById('na-forgot-password-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var form = document.getElementById('na-forgot-password-form');
    var passwordTokenRequest = new XMLHttpRequest();
    passwordTokenRequest.open('POST', host + 'resetpasswordtoken', true);
    passwordTokenRequest.onreadystatechange = function() {
      if (passwordTokenRequest.readyState === 4) {
        if (passwordTokenRequest.status === 200) {
          alert("you'll get an email from a man in a yellow poncho. he'll take you the rest of the way");
        } else {
          alert('something went wrong. contact @javijavi7');
        }
      }
    }
    passwordTokenRequest.setRequestHeader("Content-type","application/json");
    passwordTokenRequest.send('{"email": "' + form['email'].value + '"}');
  });

  var settingInputs = document.getElementById('na-account-settings-form').querySelectorAll('input');
  for (var i = 0; i < settingInputs.length; i++) {
    settingInputs[i].addEventListener('change', function(event){
      event.preventDefault();
      var settingChangeRequest = new XMLHttpRequest();
      settingChangeRequest.onreadystatechange = function() {
        if (settingChangeRequest.readyState === 4 && settingChangeRequest.status === 200) {
          updateUser(JSON.parse(settingChangeRequest.responseText));
        }
      }
      settingChangeRequest.open('PUT', host + 'settings', true);
      settingChangeRequest.setRequestHeader("Content-type","application/json");
      settingChangeRequest.send('{"settingName": "' + event.target.name + '", "settingValue": "' + event.target.checked + '"}');
    });
  };

  var internalLinks = document.querySelectorAll('.na-div-link');
  for (var i = 0; i < internalLinks.length; i++) {
    var internalLink = internalLinks[i];
    internalLink.addEventListener('click', function(event) {
      event.preventDefault();
      showDiv(event.target.getAttribute('href'));
    });
  };

  document.getElementById('na-friends-search-form')['name'].addEventListener('input', function(event) {
    event.preventDefault();
    var userSearchRequest = new XMLHttpRequest();
    var user = null;
    userSearchRequest.onreadystatechange = function() {
      if (userSearchRequest.readyState === 4 && userSearchRequest.status === 200) {
        var users = JSON.parse(userSearchRequest.responseText);
        var searchResultsContainer = document.getElementById('na-friends-search-results-container');
        searchResultsContainer.style.display = 'block';
        var searchResultsList = searchResultsContainer.querySelector('#na-friends-search-results');
        if (users.length === 0) {
          searchResultsList.innerHTML = '<p>no users found</p>';
        } else {
          searchResultsList.innerHTML = '';
        }
        for (var i = 0; i < users.length; i++) {
          var followingStatus = 'not following';
          if (user.following.indexOf(users[i]._id) > -1) {
            followingStatus = 'following';
          } else if (user.pendingFollowRequests.indexOf(users[i]._id) > -1) {
            followingStatus = 'pending';
          }
          searchResultsList.appendChild(createFollowingDiv(users[i], followingStatus));
        };
      }
    }

    chrome.storage.local.get('na-user', function(storage) {
      user = storage['na-user'];
      userSearchRequest.open('GET', host + 'users?name=' + event.target.value, true);
      userSearchRequest.send();
    });
  });

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'sync') {
      if (changes['na-notifications']) {
        updateNotifications(changes['na-notifications'].newValue);
      }
      if (changes['na-user'] && changes['na-user'].newValue) {
        updateSettingsForm();
        updateFollowingList();
      }
    }
  });

});

