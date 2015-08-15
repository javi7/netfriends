define(function(divId, beforeShowingFunction) {
  return {
    showDiv: function() {
      beforeShowingFunction();
      var divs = document.getElementById('na-main-window').querySelectorAll('.na-browser-container');
      for (var divIdx = 0; divIdx < divs.length; divIdx++) {
        divs[divIdx].style.display = 'none';
      }
      document.getElementById(divId).style.display = 'inherit';

      var menuItems = document.querySelectorAll('.na-menu-item');
      for (var i = 0; i < menuItems.length; i++) {
        var menuItem = menuItems[i];
        if (menuItem.getAttribute('href') === divId) {
          menuItem.classList.add('na-menu-item-active');
        } else {
          menuItem.classList.remove('na-menu-item-active');
        }
      };
    };
  };
});