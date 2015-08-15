define({
  checkIfLoggedIn: function(successCallback, failureCallback) {
    var checkIfLoggedIn = new XMLHttpRequest();
    checkIfLoggedIn.onreadystatechange = function() {
      if (checkIfLoggedIn.readyState === 4) {
        callback(checkIfLoggedIn.status);
      }
    };
    checkIfLoggedIn.open('GET', host + 'loggedin',true);
    checkIfLoggedIn.send();
  }
});