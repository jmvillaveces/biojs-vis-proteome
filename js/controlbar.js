var _ = require('underscore');

var _el = null,
    _nodes = null;

var _EVT_ON_DOWNLOAD_CLICKED= 'onDownloadClicked';
var _EVT_ON_ABOUT_CLICKED= 'onAboutClicked';
var _EVT_ON_SETTINGS_CLICKED= 'onSettingsClicked';
var _EVT_ON_RESULT_CLICKED= 'onResultClicked';

//Public members
var controlbar = function(){};

_.extend(controlbar, require('biojs-events'));

controlbar.el = function(_){
    if (!arguments.length)
        return _el;
    _el = _;
    return controlbar;
};

controlbar.nodes = function(_){
    if (!arguments.length)
        return _nodes;
    _nodes = _;
    return controlbar;
};

controlbar.init = function(){
    
    var tr = d3.select('#'+_el).append('table')
            .style('position', 'absolute').append('tr');
         
    //Input
    var inputdiv = tr.append('td').append('div').attr('class', 'search');
         
    inputdiv.append('input')
            .attr('type', 'text')
            .attr('placeholder', 'Search...')
            .attr('autocomplete', 'off')
            .attr('class', 'sprite sprite-magnifier')
            .on('keyup', function(){
                d3.select('.results').html(''); 
                
                if(this.value.length < 3) return;
                    
                var searchRegEx = new RegExp(this.value.toLowerCase());
                var res = _.filter(_nodes.values(), function(d){    
                    var matchName = d.name.toLowerCase().search(searchRegEx);
                    var matchId = d.taxId.toString().toLowerCase().search(searchRegEx);
                        
                    return matchName >= 0 || matchId >= 0;
                });
        
                _.each(res, function(d){
                    d3.select('.results').append('li')
                        .html('<a href="#">'+d.name+'<br/><span>'+d.taxId+'</span></a>')
                        .on('click', function(){
                            d3.selectAll('table.browse').style('display', 'none');
                            controlbar.trigger(_EVT_ON_RESULT_CLICKED, d);
                        }); 
                });
                    
                if(res.length > 0) d3.select('.results').transition().style('display', 'block');
            })
            .on('focusout', function(){
                setTimeout(function(){d3.select('.results').transition().style('display', 'none');}, 100);
            })
            .on('focusin', function(){
                if (d3.selectAll('.results li').length > 0) d3.select('.results').transition().style('display', 'block');
            });
    
    inputdiv.append('ul').attr('class', 'results');
    
    //Settings
    tr.append('td').attr('class','settings').append('div')
        .attr('class', 'sprite sprite-settings')
        .on('click', function(){
            controlbar.trigger(_EVT_ON_SETTINGS_CLICKED, this);
        });
         
    //Download
    tr.append('td').attr('class','settings').append('a')
        .attr('target', '_blank')
        .attr('href', '#')
        .attr('download', 'network.png')
        .on('click', function(){
            controlbar.trigger(_EVT_ON_DOWNLOAD_CLICKED, this);
        })
        .append('div')
        .attr('class', 'sprite sprite-save-image');
         
    //About
    tr.append('td').attr('class','settings').append('div')
        .attr('alt', 'About')
        .attr('class', 'sprite sprite-about')
        .on('click', function(){
            controlbar.trigger(_EVT_ON_ABOUT_CLICKED, this);
        });
    
    return controlbar;
};
module.exports = controlbar;