var config = {
  // Twitter API (Proxy) URL
  baseUrl: 'http://localhost:7890',

  debug: false,
  title: 'HigherLogic',

  search: 'from:@HigherLogic OR #HLlearn OR #HUGSF14',
  // list: 'fullfrontalconf/delegates11', // optional, just comment it out if you don't want it

  timings: {
    showNextScheduleEarlyBy: '5m', // show the next schedule 10 minutes early
    defaultNoticeHoldTime: '1s',
    showTweetsEvery: '5s'
  }
};

// allows reuse in the node script
if (typeof exports !== 'undefined') {
  module.exports = config;
}
