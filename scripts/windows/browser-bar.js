define(['../util/util'], function(util) {
  return {
    init: function() {
      // check for updates to the extension
      chrome.runtime.onUpdateAvailable.addListener(function(details) {
        chrome.runtime.reload();
      });

      chrome.runtime.requestUpdateCheck(function(status) {
      });
      console.log('worked!');
      // check if user is logged in
      // util.checkIfLoggedIn(
      //   function(status) {
      //     if (status === 200) {
      //       transitionToLoggedIn(checkIfLoggedIn.responseText);
      //       updateUser(JSON.parse(checkIfLoggedIn.responseText));
      //     } else {
      //       showDiv('na-logged-out');
      //     }
      //   }
      // );
    }
  };
});
    
  

  