var _ = require('underscore');

var _el = null, _nodes = null;

var _EVT_DOWNLOAD_CLICKED= 'downloadClicked';
var _EVT_ABOUT_CLICKED= 'aboutClicked';
var _EVT_SETTINGS_CLICKED= 'settingsClicked';
var _EVT_RESULT_CLICKED= 'resultClicked';
var _EVT_RADIAL_CLICKED= 'radialClicked';
var _EVT_TREE_CLICKED= 'treeClicked';

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
                            d3.event.preventDefault();
                            controlbar.trigger(_EVT_RESULT_CLICKED, d);
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
            d3.event.preventDefault();
            controlbar.trigger(_EVT_SETTINGS_CLICKED, this);
        });
         
    //Download
    tr.append('td').attr('class','settings').append('a')
        .attr('href', '#')
        .on('click', function(){
            d3.event.preventDefault();
            controlbar.trigger(_EVT_DOWNLOAD_CLICKED, this);
        })
        .append('div')
        .attr('class', 'sprite sprite-save-image');
         
    //About
    tr.append('td').attr('class','settings').append('div')
        .attr('alt', 'About')
        .attr('class', 'sprite sprite-about')
        .on('click', function(){
            d3.event.preventDefault();
            controlbar.trigger(_EVT_ABOUT_CLICKED, this);
        });
    
    //Radial radio !! 0.0
    var div = tr.append('td').append('div');
    
    div.append('input')
        .attr('id','radio1')
        .attr('type', 'radio')
        .attr('name', 'layout')
        .property('checked', 'true')
        .attr('class', 'radio')
        .on('change', function(){
            d3.event.preventDefault();
            controlbar.trigger(_EVT_RADIAL_CLICKED, this);
        });
    
    div.append('label')
        .attr('for', 'radio1')
        .attr('style', 'font-family:Helvetica, arial, freesans, clean, sans-serif')
        .text('Radial');
    
    //Tree radio
    div = tr.append('td').append('div');
    
    div.append('input')
        .attr('id','radio2')
        .attr('type', 'radio')
        .attr('name', 'layout')
        .attr('class', 'radio')
        .on('change', function(){
            d3.event.preventDefault();
            controlbar.trigger(_EVT_TREE_CLICKED, this);
        });
    
    div.append('label')
        .attr('for', 'radio2')
        .attr('style', 'font-family:Helvetica, arial, freesans, clean, sans-serif')
        .text('Tree');

    
    return controlbar;
};
module.exports = controlbar;