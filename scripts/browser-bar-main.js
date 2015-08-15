requirejs(["windows/browser-bar"], function(browserBar) {
  var init = setInterval(function() {
    if (document.readyState === "complete") {
      browserBar.init();
      clearInterval(init);
    }
  }, 50);
});