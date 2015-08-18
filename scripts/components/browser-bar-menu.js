define(function() {
  var menuElement = document.getElementById('na-menu-div');
  var menuItems = document.querySelectorAll('.na-menu-item');
  return {
    'show': function() {
      menuElement.style.display = 'block';
    },
    'hide': function() {
      menuElement.style.display = 'none';
    },
    'setActive': function(activeMenuItem) {
      for (var i = 0; i < menuItems.length; i++) {
        var menuItem = menuItems[i];
        if (menuItem.getAttribute('href') === divId) {
          menuItem.classList.add('na-menu-item-active');
        } else {
          menuItem.classList.remove('na-menu-item-active');
        }
      }
    }
  }
});