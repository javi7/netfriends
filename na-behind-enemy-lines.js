var netflixPlayer = null;

setInterval(function() {   
  if (netflixPlayer) {
    var timePollerInput = document.getElementById("na-time-poller-input"); 
    if (timePollerInput) {
      timePollerInput.value = netflixPlayer.getCurrentTime(); 
    }
  } else {
    if (netflix !== "undefined" && netflix.cadmium && netflix.cadmium.objects && netflix.cadmium.objects.videoPlayer()) { 
      netflixPlayer = netflix.cadmium.objects.videoPlayer();
    }
  } 
}, 500); 

window.addEventListener('message', function(event) {
  if (event.data.sender === 'nicheflix') {
    if (event.data.task === 'seek') {
      var seekToPayload = setInterval(function() {
        if (netflixPlayer && netflixPlayer.getCurrentTime()) {
          netflixPlayer.seek(event.data.payload); 
          clearInterval(seekToPayload);
        }
      }, 50);
    }
  }
});