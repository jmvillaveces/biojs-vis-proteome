var _ = require('underscore'), d3 = require('d3');

//Private members
var _opt = null,
    _svg = null,
    _g = null,
    _data = null,
    _layout = null;

//Radial Layout
var _radial = function(){
    
    function project(d) {
      var r = d.y, a = (d.x - 90) / 180 * Math.PI;
      return [r * Math.cos(a), r * Math.sin(a)];
    }

    function step(d) {
      var s = project(d.source),
          m = project({x: d.target.x, y: d.source.y}),
          t = project(d.target),
          r = d.source.y,
          sweep = d.target.x > d.source.x ? 1 : 0;
      return (
        "M" + s[0] + "," + s[1] +
        "A" + r + "," + r + " 0 0," + sweep + " " + m[0] + "," + m[1] +
        "L" + t[0] + "," + t[1]);
    }
    
    var diameter = Math.min(_opt.width, _opt.height);

    var tree = d3.layout.tree()
        .size([360, diameter/2])
        .sort(function comparator(a, b) { return d3.ascending(a.name, b.name); })
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });
    
    var nodes = tree.nodes(_data);
    
    _.each(nodes, function(d){
        if(_data.taxId === d.taxId) return;
        d.y = d.parent.y + 12*(d.children ? d.children.length+1 : 1); 
    });
    
    var links = tree.links(nodes);
    
    links = _g.selectAll('.link').data(links, function(d) { return d.source.taxId + '-' + d.target.taxId; });
    
    links.enter().append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1.5);
    
    nodes = _g.selectAll('.node').data(nodes, function(d) { return d.name; });
    
    nodes.enter().append('circle')
                .attr('class', 'node')
                .attr('stroke-width', 1.5)
                .attr('stroke', function(d){return _styleScale(d.category);})
                .attr('fill', '#fff')
                .attr('r', 4.5);
    
    var t = _g.transition().duration(500).attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')');
    
    var link = t.selectAll('.link')
                .attr('d', step);
    
    var node = t.selectAll('.node')
                .attr('transform', function(d) { return 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')'; });
    
    links.exit().remove();
    nodes.exit().remove();
};

//Tree Layout
var _tree = function(){
    
    var tree = d3.layout.tree().size([_opt.width - 10, _opt.height - 10]);
    
    var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });
    
    var nodes = tree.nodes(_data), links = tree.links(nodes);
    
    links = _g.selectAll('.link').data(links, function(d) {  return d.source.taxId + '-' + d.target.taxId; });
    
    links.enter().append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1.5);
    
    nodes = _g.selectAll('.node').data(nodes, function(d) { return d.name; });
    
    nodes.enter().append('circle')
                .attr('class', 'node')
                .attr('stroke-width', 1.5)
                .attr('stroke', function(d){return _styleScale(d.category);})
                .attr('fill', '#fff')
                .attr('r', 4.5);
    
    
    var t = _g.transition().duration(500).attr('transform', 'translate(' + 5 + ',' + 0 + ')');
    
    var link = t.selectAll('.link')
                .attr('d', diagonal);
    
    var node = t.selectAll('.node')
                .attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; });
    
    links.exit().remove();
    nodes.exit().remove();
};

/**
  * Creates a taxa object
  */
var vis = function(opt){
    
    _opt = opt;
    
    // Init the node style scale
    _styleScale = d3.scale.ordinal()
            .domain(['CP','RP','-'])
            .range(_opt.nodeColours);
    
    _svg = d3.select('#'+_opt.el).append('svg')
        .attr('width', _opt.width)
        .attr('height', _opt.height);
    
    _g = _svg.append('g');
};

vis.data = function(_){
     if (!arguments.length)
        return _data;
    _data = _;
    return vis;
};

vis.layout = function(_){
     if (!arguments.length)
        return _layout;
    _layout = _;
    return vis;
};

vis.update = function(){
    if(_layout == 'tree'){
        _tree();
    }else{
        _radial();
    }
    return vis;
};

module.exports = vis;