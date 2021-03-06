/**
 * Twitterlib setup
 */
twitterlib.cache(true);

/**
 * Tweet Queue
 */
function Queue(delay, callback) {
  var q = [],
      timer = null,
      processed = {},
      empty = null,
      ignoreRT = twitterlib.filter.format('-"RT @"'); // if you want to reuse this queue, ditch this reference

  function process() {
    var item = null;
    if (q.length) {
      callback(q.shift());
    } else {
      this.stop(); // don't like this, should change to prototype eventually
      setTimeout(empty, 5000);
    }
    return this;
  }

  return {
    push: function (item) {
      var i;
      if (!(item instanceof Array)) {
        item = [item];
      }

      if (timer == null && q.length == 0) {
        this.start();
      }

      for (i = 0; i < item.length; i++) {
        if (!processed[item[i].id_str] && twitterlib.filter.match(item[i], ignoreRT)) {
          processed[item[i].id_str] = true;
          q.push(item[i]);
        }
      }

      // resort the q
      q = q.sort(function (a, b) {
        return a.id_str > b.id_str ? 1 : -1;
      });

      return this;
    },
    start: function () {
      if (timer == null) {
        timer = setInterval(process, delay);
      }
      return this;
    },
    stop: function () {
      clearInterval(timer);
      timer = null;
      return this;
    },
    toggle: function () {
      return this[timer == null ? 'start' : 'stop']();
    },
    empty: function (fn) {
      empty = fn;
      return this;
    },
    q: q,
    next: process
  };
}; //.start();

// selector to find elements below the fold
$.extend($.expr[':'], {
  below: function (a, i, m) {
    var y = m[3];
    return $(a).offset().top > y;
  }
});

function parseTime(t) {
  // var parts = t.split(/[:\s]/g),
  //     hour = parts[0] | 0,
  //     min = parts[1] | 0;

  // if (parts[2] == 'PM' && hour != 12) hour += 12;

  var d = new Date();
  d.setHours(t.substr(0, 2));
  d.setMinutes(t.substr(2, 2));

  return d.getTime();
}

function parseTiming(t) {
  (t+'').replace(/.*?([hms]+).*/, function (all, match) {
    var n = all.replace(new RegExp(match), '') * 1;

    if (match === 'ms') {
      // do nothing
    } else if (match === 's') {
      n *= 1000;
    } else if (match === 'm') {
      n *= 60 * 1000;
    } else if (match === 'h') {
      n *= 60 * 60 * 1000;
    }

    t = n;
  });

  return t;
}

function findNextSchedule(delayM, after) {
  var due = null,
      t = after ? parseTime(after) : window.debugTime || (new Date()).getTime(),
      times = Object.keys(SCHEDULE).sort();

  for (var i = 0; i < times.length; i++) {
    s = times[i];
    if ((parseTime(s) + delayM) > t) break;
  }

  first = false;

  return s;
}

function showSchedule(due) {
  if (due != lastDue) {
    lastDue = due;
    $schedule.hide();
    SCHEDULE[due].show();
    $('#schedule').attr('data-time', due);
    // var $content = $('#content div').html(SCHEDULE[due]),
    //     $img = $content.find('img').remove();
    // $content.parent().css('background-image', 'url(' + $img.attr('src') + ')');
    if (due == '7:00 PM') {
//      $('#content').addClass('map');
    }
  }
}

function schedule() {
  showSchedule(findNextSchedule(config.timings.showNextScheduleEarlyBy || 0));
}

function nextDue() {
  clearInterval(scheduleTimer);
  showSchedule(findNextSchedule(0, lastDue));
}

// only used in testing
function nextSchedule() {
  var keys = Object.keys(SCHEDULE);
  var i = keys.indexOf(lastDue) + 1;
  if (i > keys.length) i = 0;

  showSchedule(keys[i]);
}

function getInstagram(id, url) {
  window['embed' + id] = function (data) {
    if (data.type == 'photo') {
      var el = document.getElementById('pic' + id);
      if (el) {
        el.src = data.url;
      }
    }
  };
  var script = document.createElement('script');
  script.src = 'http://api.instagram.com/oembed?url=' + url + '&callback=embed' + id;
  document.body.appendChild(script);
}

function getFlickr(id, url) {
  var apikey = '18702ea1538bc199e2c7e1d57270cd37',
  photoId = url.split('/').pop();

  if (url.indexOf('flic.kr') !== -1) { // short url - decode first
    var num = url.split('/').pop(),
        decoded = 0,
        multi = 1,
        digit = null,
        alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
    while (num.length > 0) {
      digit = num.substring(num.length-1);
      decoded += multi * alphabet.indexOf(digit);
      multi = multi * alphabet.length;
      num = num.substring(0, num.length -1);
    }
    photoId = decoded;
  }
  var flickrURL = 'http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=18702ea1538bc199e2c7e1d57270cd37&photo_id=' + photoId + '&format=json&jsoncallback=embed' + id;

  window['embed' + id] = function (data) {
    if (data.photo) {
      var photo = data.photo,
          el = $('.embed' + id);
        if (el) {
          $(el).replaceWith('<img class="pic" src="http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '.jpg">');
      }
    }
  };
  var script = document.createElement('script');
  script.src = flickrURL;
  document.body.appendChild(script);

}

function loadImage(id, url) {
  return;
  //  http://www.oohembed.com/oohembed
  window['embed' + id] = function (data) {
    if (data.type == 'photo') {
      var el = document.getElementById('pic' + id);
      if (el) {
        el.src = data.url;
      }
    }
  };
  var script = document.createElement('script');
  script.src = 'http://www.oohembed.com/oohembed?url=' + url + '&callback=embed' + id;
  document.body.appendChild(script);
}

// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
(function(){
  var cache = {};

  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :

      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +

        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +

        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();

// twitter related processing
function renderTweet(data) {
  var embeds = [];

  if (data.entities && data.entities.urls && data.entities.urls.length) {
    data.entities.urls.forEach(function (urldata) {
      var url = urldata.expanded_url;
      if (url.indexOf('yfrog.com') !== -1) {
        embeds.push('<img class="pic" src="' + url + ':iphone" />');
      } else if (url.indexOf('twitpic.com') !== -1) {
        embeds.push('<img class="pic" src="' + url.replace(/twitpic\.com/, 'twitpic.com/show/large') + '" />');
      } else if (url.indexOf('instagr.am') !== -1) {
        if (url.split('').pop() !== '/') {
          url += '/';
        }
        embeds.push('<img class="pic" id="pic' + data.id_str + '" src="' + url + 'media">');
        //getInstagram(data.id_str, url);
      } else if (url.indexOf('lockerz') !== -1) {
        embeds.push('<img class="pic" src="http://api.plixi.com/api/tpapi.svc/imagefromurl?url=' + url + '" />');
      } else if (url.indexOf('flic.kr') !== -1 || url.indexOf('flickr') !== -1) {
        getFlickr(data.id_str, url);
        embeds.push('<span class="embed' + data.id_str + '"></span>');
      } else if (photoURLs.test(url)) {
        embeds.push('<img class="pic" src="' + url + '" />');
      } else if (photoServiceURLs.test(url)) {
        loadImage(data.id_str, url);
        embeds.push('<img class="pic embed' + data.id_str + '" src="data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" />');
      }
    });
  }

  var html = tweetTemplate({
    id: data.id_str,
    screen_name: data.user.screen_name,
    name: data.user.name,
    profile_image_url: data.user.profile_image_url,
    created_at: data.created_at,
    nice_date: twitterlib.time.datetime(data.created_at),
    embeds: embeds,
    tweet: twitterlib.ify.clean(twitterlib.expandLinks(data))
  });

  // since_id is a global tracker to ensure we only hit Twitter for *new* tweets
  since_id = data.id;

  return html;
}

function passToQueue(data, options) {
  if (data.length) {
    twitterQueue.push(data.reverse());
  }
}

function run() {
  var since_id = 1;
  $(document.body).addClass('run');

  var options = { since: since_id };

  var tweets = twitterlib.search(config.search, options, passToQueue);
  if (config.list) tweets.list(config.list, options, passToQueue);
};

function notices() {
  var $notices = $('#notices > div');

  if ($notices.length > 1) {
    // rotate
    var current = 0,
        length = $notices.length;

    var show = function () {
      var $current = $notices.removeClass('show').eq(current % length).addClass('show'),
          customTiming = $current[0].getAttribute('data-hold-time')
      current++;

      if (customTiming) {
        customTiming = parseTiming(customTiming);
      }

      setTimeout(show, customTiming || config.timings.defaultNoticeHoldTime || 10 * 1000);
    };
    show();
  }
}

function init() {
  if (config.title) document.title = config.title;

  // Use the baseUrl from the config to setup twitterlib. This allows it to
  // run from a proxy, not Twitter's API (which doesn't support from-browser
  // requests).
  twitterlib.baseUrl = config.baseUrl;

  if (config.debug) {
    twitterlib.debug({
      'list': '../history/data/list%page%.json?callback=callback',
      'search': '../history/data/search%page%.json?callback=callback'
    });
  }

  // fucking twitter and their daft date format
  var date = new Date(),
      year = date.getYear() + 1900,
      d = date.toString();

  d = d.replace(/\D{3}\+/, '+').replace(/\s\(.*\)/, '').replace(new RegExp(year + ' '), '') + ' ' + year;

  $('#schedule > div').hide();

  run();
  // schedule();
  showSchedule(findNextSchedule(config.timings.showNextScheduleEarlyBy || 0));
  notices();
}

if (config.timings) {
  for (var key in config.timings) {
    // convert string times to milliseconds
    config.timings[key] = parseTiming(config.timings[key]);
  }
}



// schedule based processing
var SCHEDULE = {},
    $schedule = $('#schedule > div').each(function () {
      SCHEDULE[this.getAttribute('data-time')] = $(this);
    }),
    photoServiceURLs = new RegExp('(flickr|instagr.am)'),
    photoURLs = new RegExp('(.jpg|.jpeg|.png|.gif)$'),
    tweetTemplate = tmpl('tweet_template'),
    lastDue = null,
    winners = {};

// Element cache
var $tweets = $('#tweets'),
    $scheduleContainer = $('#schedule');

// blocker
//
// Test text against a set of criteria. Add text, regexs or a function
// to match against, and then use blocker.test('some text') to find a
// match. blocker.test will return true if the text is ok, and false
// if it finds a match (ie, text is not ok).
//
// If you add a callback function it should return true if the text is ok.
//
// For example:
//
//    // Block anything containing @twitter
//    blocker.block('@twitter');
//
//    // Block anything that's entirely lowercase & spaces
//    blocker.block(/^[a-z\s]*$/);
//
//    // Block the text if it's 'I hate the twitterwall!'
//    blocker.block(function (test) {
//      return (test !== 'I hate the twitterwall!');
//    });
//
//    . . .
//
//    // Test your text
//    var textIsOk = blocker.test('Some Text');
//
var blocker = (function () {
  var callbacks = [];

  return {
    block: function (checker) {
      // Callback should return true if the text is clean,
      // false if it should be blocked.

      var cb = function (text) { return true; };

      if (typeof checker === "string") {
        cb = function (text) {
          return (text.toLowerCase().indexOf(checker) === -1);
        };
      }

      else if (({}).toString.call(checker) === '[object RegExp]') {
        cb = function (text) {
          return (text.match(checker) === null);
        };
      }

      else if (typeof checker === "function") {
        cb = checker;
      }

      return callbacks.push(cb) && cb;
    },
    test: function (text) {
      return callbacks.every(function (cb) {
        return cb(text);
      });
    }
  };
}());

var scheduleTimer = setInterval(schedule, 8000);

// start a new queue and on the callback, render the tweet and animate it down
var twitterQueue = new Queue(config.timings.showTweetsEvery || 3000, function (item) {
  // 1. stuff a new p tag, and animate it up - to force content down (with text:visibility:hidden)
  // 2. drop effect from top of page
  // 3. once effect complete, remove animated el, and show text to fake effect

  var tweetText = twitterlib.expandLinks(item),
      tweetIsOk = blocker.test(tweetText);

  if (!tweetIsOk) {
    return twitterQueue.next();
  }

  var tweet = $(renderTweet(item)),
      tweetClone = tweet.clone().hide().css({ visibility: 'hidden' }).prependTo($tweets).slideDown(1000);

  tweet.css({ top: -200, position: 'absolute' }).prependTo($tweets).animate({
    top: 0
  }, 1000, function () {
    tweetClone.css({ visibility: 'visible' });
    $(this).remove();
  });

  // remove elements that aren't visible
  $tweets.find('p:below(' + window.innerHeight + ')').remove();
}).empty(run);

// click on the schedule to move forward (for testing)
$scheduleContainer.click(nextDue);

// space pauses twitter feed
$(window).keydown(function (event) {
  if (event.which === 32) {
    twitterQueue.toggle();
  }
});

init();

var $container = $('#container');
var pckry = $container.data('packery');

// $container.packery({
//   itemSelector: '.item',
//   "columnWidth": '.item',
//   "rowHeight": '.item'
// });

// $("div[class*='full-bg-']").hover(function(e){
//   console.log($(e.currentTarget).css("background"));
// }, function(){
//   console.log("leave");
// });

$('#container').packery({
  itemSelector: '.item',
  "columnWidth": '.item',
  "rowHeight": '.item'
});
var REG = /<img src=.(.*)'\/>/;

var items = [
              {
                title: 'How to Create Community Reports - HUG',
                image: 'http://cdn2.hubspot.net/hub/312413/file-1032098961-png/thumbnail_community_mgmt_report_hubspot.png',
                url: 'http://hug.higherlogic.com/communities/community-home/viewthread/?GroupId=727&MID=20935&tab=digestviewer',
                tileBackground: 'linear-gradient(rgba(200, 73, 145, .7), rgba(200, 73, 145, .5))',
                titleBackground: 'height: 100px;width: 100%;position: absolute;bottom: 0px;background-color: rgba(200, 73, 145, .95);'
              },
              {
                title: 'How to Engage Your Audience Through Content Marketing - Marcus Sheridan',
                image: 'http://cdn2.hubspot.net/hub/312413/file-404865041-jpg/HUG_Buzz_-_December_2013/marcus_sheridan_keynote_image.jpg',
                url: 'http://www.higherlogic.com/resources/learning-series/how-to-engage-your-audience-through-content-marketing',
                tileBackground: 'linear-gradient(rgba(10,172,174, .7), rgba(10,172,174, .5))',
                titleBackground: 'height: 100px;width: 100%;position: absolute;bottom: 0px;background-color: rgba(10,172,174, .95);'
              },
              {
                title: 'Learn How to Build Bigger, Better and More Active Online Communities',
                image: 'http://higherlogicdownload.s3.amazonaws.com/HUG/6ab9a070-fc6c-4010-a591-23cccea8d851/UploadedImages/HUG%20Buzz/image_8_Steps_Guide_iPad_Icons.png',
                url: 'http://www.higherlogic.com/resources/learning-series/fever-bee',
                tileBackground: 'linear-gradient(rgba(9, 140, 182, 0.75), rgba(9, 140, 182, 0.61))',
                titleBackground: 'height: 100px;width: 100%;position: absolute;bottom: 0px;background-color: rgba(255,114,3, .90);'
              },
              {
                title: '10 Community Management Tips',
                image: 'http://higherlogicdownload.s3.amazonaws.com/HL/339ad0cc-c652-4903-ad9b-f95e96ff29eb/UploadedImages/www/Tip_Sheets_and_Guides/10_cool_community_management_tips.png',
                url: 'http://resources.higherlogic.com/higher-logic-cmad-2014',
                tileBackground: 'linear-gradient(rgba(9, 140, 182, 0.75), rgba(9, 140, 182, 0.61))',
                titleBackground: 'height: 100px;width: 100%;position: absolute;bottom: 0px;background-color: rgba(9, 140, 182, .90);'
              },
              {
                title: '5 Tenets of Engagement Success - HUG',
                image: 'http://model.shoppingdelpaseo.com.br/uploads/2011/07/top5.jpg',
                url: 'http://hug.higherlogic.com/browse/blogs/blogviewer/?BlogKey=c35b1bed-2da7-42ce-a166-71a355c439c7',
                tileBackground: 'linear-gradient(rgba(174,176,177, .7), rgba(174,176,177, .5))',
                titleBackground: 'height: 100px;width: 100%;position: absolute;bottom: 0px;background-color: rgba(111, 111, 111, 0.90);'
              },
              {
                title: 'The Anatomy of a Meaningful Community - Moz',
                image: 'http://d2v4zi8pl64nxt.cloudfront.net/the-anatomy-of-a-meaningful-community/541b6ce2de8216.74640903.jpg',
                url: 'http://moz.com/ugc/the-anatomy-of-a-meaningful-community',
                tileBackground: 'linear-gradient(rgba(129,191,79, .7), rgba(129,191,79, .5))',
                titleBackground: 'height: 100px;width: 100%;position: absolute;bottom: 0px;background-color: rgba(129,191,79, .95);'
              },
              {
                title: 'Why Associations Need Actionable Data, Not Big Data - HUG',
                image: 'http://higherlogicdownload.s3.amazonaws.com/HUG/UploadedImages/7a254f66-d28c-430b-acb3-cb570970ec76/Moneyball.jpg',
                url: 'http://hug.higherlogic.com/blogs/howard-pollock/2014/09/15/why-associations-need-actionable-data-not-big-data',
                tileBackground: 'linear-gradient(rgba(255,114,3, .7), rgba(255,114,3, .5))',
                titleBackground: 'height: 100px;width: 100%;position: absolute;bottom: 0px;background-color: rgba(200, 73, 145, .95);'
              }
            ];

var hover_colors = [];
var indexesToReplace = [1, 4, 5];
for(i = 0; i <= 6; i++) {
  var stub = 'url(' + items[i].image + ')';
  console.log(stub);
  $('.full-bg-'+i).css('background', stub, 'important').css('background-size', 'cover', 'important').attr('href', items[i].url);
  var target = $('.background-faded-'+i);
  target.attr("style", target.attr("style") + "; " + items[i].titleBackground);
  $('.item-text-'+i).html(items[i].title);
}