/**
  * Creates a tooltip object
  */
var tooltip = function(el){
    
    
    var  xOffset = 20, yOffset = 10;
        
    var toolt = d3.select('#'+el).append('div')
                    .attr('class', 'tooltip')
                    .style('display', 'none');
    
    function showTooltip(content, position){
        toolt.html(content);
        toolt.style('display', 'block');
            
        updatePosition(position);
    }
        
    function hideTooltip(){
        toolt.style('display', 'none');
    }
        
    function updatePosition(position){
        toolt.style('left', position[0] + xOffset);
        toolt.style('top', position[1]+ yOffset);
    }
        
    return { 
        showTooltip:showTooltip,
        hideTooltip:hideTooltip,
        updatePosition:updatePosition
    };  
};
module.exports = tooltip;