//Libraries
var _ = require('underscore');
var d3 = require('d3');
var Events = require('biojs-events');

//App components
var controlbar = require('./controlbar.js');
var Dialog = require('./dialog.js');
var Tooltip = require('./tooltip.js');
var Taxa = require('./taxa.js');
var Vis = require('./vis.js');

//Private Members
var _opt = {
    el: 'YourOwnDivId',
    graphReduction: true,
    taxaURL: 'taxa.json',
    rootTaxa: 1,
    nodeColours: ['red', 'gold', 'steelblue'],
    width: 200,
    height:200
};

var _connErrorMsg = 'There was an error fetching the data. Please check your connection or try again later!',  // Default error message to show on connection error
    _toolTip = null,  //Tooltip
    _aboutPopup = null,  //About Popup
    _optionsPopup = null,  //Options Popup
    _navBar = null,  //Navigation line
    _data = null; //Current display data

/**
  * Makes an ajax call and retrieves the taxa data from taxaURL
  */
var _getData = function(){
    
    var url = _opt.taxaURL;
        
    //Get taxa json
    d3.json(url,function(error, data){
        
        //If there is an error, show error message
        if(error){
            d3.select('#'+_opt.el)
                .attr('class', 'errorMSG')
                .text(_connErrorMsg);
                
            console.warn(error);
            return;
        }
        Taxa(data);
        _data = Taxa.getReduced(_opt.rootTaxa);
        
        controlbar
            .el(_opt.el)
            .nodes(Taxa.getNodes()).init()
            .on('downloadClicked', function(a){
                var html ='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="'+_opt.width+'" height="'+_opt.height+'">' + 
                    Vis.svg().node().innerHTML +'</svg>';
                
            
                var l = document.createElement('a');
                l.download = 'sample.svg';
                l.href = 'data:image/svg+xml;base64,' + btoa(html);
                l.click();
            })
            .on('aboutClicked', function(){
                
            })
            .on('settingsClicked', function(){
                
            })
            .on('resultClicked', function(d){
    
            })
            .on('radialClicked', function(d){
                Vis.layout('radial').update();
            })
            .on('treeClicked', function(d){
                Vis.layout('tree').update();
            });
        
        _update();
    });
};

// Updates the visualisation
var _update = function(){
    Vis.data(_data).update();
    _updateNavLine();
};

/**
  * Update the navigation line
  *
  * @param {object} node The starting taxa to render the tree
  *
  */
var _updateNavLine = function(){
    
    var nodes = Taxa.getParents(_data.taxId).reverse();
    var line = _navBar.selectAll('line').data([{id:'navLine'}]);
    
    // Init the node style scale
    var styleScale = d3.scale.ordinal()
            .domain(['CP','RP','-'])
            .range(_opt.nodeColours);
    
    //Enter
    line.enter().append('line');
        
    //Update
    line.attr('x1', 0)
        .attr('y1', 12)
        .attr('x2', nodes.length*20)
        .attr('y2', 12)
        .style('stroke', '#ccc');
        
    //Remove
    line.exit().remove();
        
    var circle = _navBar.selectAll('circle').data(nodes);
        
    //Enter
    circle.enter().append('circle')
        .on('mouseover', function(d){
            d3.select(this).transition().attr('r', 10).style('cursor','pointer');
        })
        .on('mouseout', function(d){
            d3.select(this).transition().attr('r', 4).style('cursor','default');
        })
        .on('click', function(d){
            _data = Taxa.get(d.taxId);
            _update();
        }).append("title").text(function(d) { return d.name + ' ('+d.taxId+')'; });
        
    //Update
    circle.attr('cx', function(d,i){return i*20 + 20;})
        .attr('cy', 12)
        .attr('r', 4)
        .attr('stroke-width', function(d){ return 1.5; })
        .attr('stroke', function(d){return styleScale(d.category);})
        .attr('fill', function(d){ return (d.taxId === _data.taxId) ? styleScale(d.category) : '#fff';});
        
    //Remove
    circle.exit().remove();
        
    var data =  _.isUndefined(_.last(nodes)) ? [] : [_.last(nodes)];
    var text = _navBar.selectAll('text').data(data);

    //Enter
    text.enter().append('text');
        
    //Update
    text.text( function (d) { return d.name + ' ('+d.taxId+')'; })
        .attr('x', (nodes.length-1) * 20 + 20)
        .attr('y', 30)
        .attr('font-family', 'Helvetica, arial, freesans, clean, sans-serif')
        .attr('text-anchor', 'right')
        .attr('font-size', 12);
        
    //Remove
    text.exit().remove();
};

//Public members
var proteome = function(options){
    //extend options
    _.extend(_opt, options);
    
    _toolTip = Tooltip(_opt.el); //init tooltip
    
    //Init Vis
    Vis(_opt).on('click', function(d){
        _data = d;
        _update();
    })
    .on('mouseOver', function(d, coords){
        if(_.isNull(_toolTip)) return;
        _toolTip.showTooltip(d.name, coords);
    })
    .on('mouseOut', function(d){           
        if(_.isNull(_toolTip)) return;
        _toolTip.hideTooltip();
    });
    
    //Init navigation bar
    _navBar = d3.select('#'+_opt.el).append('svg')
            .attr('width', _opt.width)
            .attr('height', 50);
    
    //Get data
    _getData();
};

_.extend(proteome, Events);
module.exports = Proteome = proteome;