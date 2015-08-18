define(['../components/conversation-full-window'], function(fullWindowConversation) {
  return function(conversation) {
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
      fullWindowConversation.showConversation(conversation);
    });

    return commentSummaryDiv;
  }
});