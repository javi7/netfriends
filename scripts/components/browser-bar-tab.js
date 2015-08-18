define(['../util/na-utils', '../components/browser-bar-menu', function(util){
  return function (divId, prepareForDisplay, storageListener) {
    
    var tabElement = document.getElementById(divId);

    // register listener for data changes if provided
    if (storageListener) {
      chrome.storage.local.onChanged.addListener(function(changes, areaName) {
        if (changes[storageListener.fieldName]) {
          storageListener.updateFunction(changes);
        }
      });
    }

    return {
      show: function() {
        if (prepareForDisplay) {
          prepareForDisplay();
        }
        util.showDiv(divId);
        menu.setActive(divId);
      },
      clear: function() {
        tabElement.innerHTML = '';
      }
    };
  };
});