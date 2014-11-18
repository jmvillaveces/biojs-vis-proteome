_ = require('underscore');

/**
  * Creates a dialog
  */
var dialog = function(el, content){
        
    var popup = d3.select('#'+el).append('div')
                        .attr('class', 'dialog')
                        .style('display', 'none');
        
    popup.append('div')
            .attr('class', 'settings sprite sprite-close')
            .style('position','absolute')
            .style('top','0px')
            .style('right','0px')
            .on('click', hideDialog);
        
    var contentDiv = popup.append('div');
        
    if(_.isString(content)){
        contentDiv.html(content);
    }else if(_.isFunction(content)){
        content(contentDiv);
    }
        
    function showDialog(){
        popup.style('display', 'block');
    }
        
    function hideDialog(){
        popup.style('display', 'none');
    }
        
    return { 
        showDialog:showDialog,
        hideDialog:hideDialog
    };
};
module.exports = dialog;