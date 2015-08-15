chrome.alarms.getAll(function(alarms) {
  var notisAlarmExists = false;
  for (var alarmIdx = 0; alarmIdx < alarms.length; alarms++) {
    if (alarms[alarmIdx].name === 'poll for notis breh') {
      notisAlarmExists = true;
    }
  }
  if (!notisAlarmExists) {
    chrome.alarms.create('poll for notis breh', {periodInMinutes: 1});
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'poll for notis breh') {
    pollForNotifications();
  }
});
