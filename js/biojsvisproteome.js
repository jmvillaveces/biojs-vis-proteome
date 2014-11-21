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
        _update();
    });   
};

// Updates the visualisation
var _update = function(){
    Vis(_opt);
    Vis.data(_data).update();
    
    setTimeout(function(){
        Vis.data(Taxa.getReduced(337050)).layout('tree').update();
    }, 1000);
    
};

//Public members
var proteome = function(options){
    //extend options
    _.extend(_opt, options);
    
    _getData();
};

_.extend(proteome, Events);
module.exports = Proteome = proteome;