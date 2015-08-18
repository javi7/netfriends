define(['../util/na-utils', '../components/browser-bar-tab', '../components/browser-bar-menu'], function(util, BrowserBarTab, menu) {
  return {
    init: function() {
      // check for updates to the extension
      chrome.runtime.onUpdateAvailable.addListener(function(details) {
        chrome.runtime.reload();
      });

      chrome.runtime.requestUpdateCheck(function(status) {
      });

      var convoTab = BrowserBarTab('na-conversations-tab');
      var streamTab = BrowserBarTab('na-stream-tab');
      var friendsTab = BrowserBarTab('na-friends-tab');
      var accountTab = BrowserBarTab('na-account-tab');
      // check if user is logged in
      util.checkIfLoggedIn(
        function(status) {
          if (status === 200) {
            this.transitionToLoggedIn();
          } else {
            this.transitionToLoggedOut();
          }
        }
      );
    },
    transitionToLoggedIn: function() {
      menu.show();
    },
    transitionToLoggedOut: function() {
      chrome.storage.local.set({'na-user': 'Harold Crick'});
      menu.hide();
      util.showDiv('na-logged-out');
    }
  };
});
    
  

  