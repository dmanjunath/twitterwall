// var $container = $('#container');

$('#container').packery({
  itemSelector: '.item',
  "columnWidth": '.item',
  "rowHeight": '.item'
});

// $.post('http://localhost:8585/rss', {feedUrl: 'http://local.host:3000/rss-feed/V1D'});

var REG = /<img src=.(.*)'\/>/;
$.ajax({
  type: "POST",
  // headers: { 'Access-Control-Allow-Origin': '*' },
  url: 'http://107.170.50.155:8585/rss',
  data: {feedUrl: 'http://local.host:3000/rss-feed/V1D'}
}).done(function(data){
  data.forEach(function(item, idx){
    var id = '.full-bg-'+(idx+2);
    console.log(id);
    var url = REG.exec(item.pic)[1];
    var stub = 'linear-gradient(rgba(10,172,174, .7), rgba(10,172,174, .5)),url(' + url + ')';
    console.log(stub);
    $(id).css('background', stub, 'important').css('background-size', 'cover', 'important');
    $('.item-text-'+(idx+2)).html(item.title);
  });
});