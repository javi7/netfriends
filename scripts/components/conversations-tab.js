define(['../components/browser-bar-tab', '../components/conversation-summary'], function(BrowserBarTab, ConversationSummary) {
  return function() {
    var conversationsTab = BrowserBarTab(
      'na-conversations-tab', 
      function() {
        fetchComments({'useLoggedInUser': true, 'allConvos': true}, function(statusCode, conversations) {
          if (statusCode === 200) {
            chrome.storage.set({'na-conversations': conversations});
          }
        });
      }, 
      {
        'fieldName': 'na-conversations',
        'updateFunction': function(changes) {
          this.clear();
          for (var i = 0; i < changes['na-conversations'].length; i++) {
            var conversation = changes['na-conversations'][i];
            this.tabElement.appendChild(ConversationSummary(conversation));
          };
        }
      }
    );
    return conversationsTab;
  };
});