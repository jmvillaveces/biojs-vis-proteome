var _ = require('underscore'), d3 = require('d3');

//Private members
var _opt = null,
    _svg = null,
    _g = null,
    _data = null,
    _layout = 'radial',
    _styleScale = null, //color scale
    _sizeScale = null,
    _tg = null; //transform group

//Events
var _EVT_MOUSE_OVER = 'mouseOver', _EVT_MOUSE_OUT = 'mouseOut', _EVT_CLICK = 'click';

var _createSizeScale = function(){
    
    var max =0;
    var getMax = function self (node){
        var ch = node.children || [];
        
        if(ch.length > max) max = ch.length;

        _.each(ch, function(){
            self(ch, max);
        });
    }(_data, max);
    
    // Init the node style scale
    _sizeScale = d3.scale.ordinal()
                    .domain([0, max])
                    .range([4,6]);
};

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
        'M' + s[0] + ',' + s[1] +
        'A' + r + ',' + r + ' 0 0,' + sweep + ' ' + m[0] + ',' + m[1] +
        'L' + t[0] + ',' + t[1]);
    }
    
    var diameter = Math.min(_opt.width, _opt.height);

    var tree = d3.layout.tree()
        .size([360, diameter/2])
        .sort(function comparator(a, b) { return d3.ascending(a.name, b.name); })
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 5) / a.depth; });
    
    var nodes = tree.nodes(_data);
    
    _.each(nodes, function(d){
        if(_data.taxId === d.taxId) return;
        d.y = d.parent.y + 15*(d.children ? d.children.length + 1 : 1); 
    });
    
    var links = tree.links(nodes);
    
    _g.selectAll('.link').remove();
    links = _g.selectAll('.link').data(links);
    
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
                .attr('r', function(d){ var ch = d.children || []; return _sizeScale(ch.length);})
                .on('mouseover', function(d){
                    d3.select(this).style('cursor','pointer');
                    
                    var coords = [d3.event.pageX, d3.event.pageY];
                    vis.trigger(_EVT_MOUSE_OVER, d, coords);
                })
                .on('mouseout', function(d){
                    d3.select(this).style('cursor','default');
                    vis.trigger(_EVT_MOUSE_OUT, d);
                })
                .on('click', function(d){vis.trigger(_EVT_CLICK, d);});
    
    var translate = [diameter / 2, diameter / 2];
    var t = _g.transition().duration(500).attr('transform', 'translate(' + translate + ')');
    
    var link = t.selectAll('.link')
                .attr('d', step);
    
    var node = t.selectAll('.node')
                .attr('fill', function(d){ return (d.taxId === _data.taxId) ? _styleScale(d.category) : '#fff';})
                .attr('transform', function(d) { return 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')'; })
                .attr('cx', '')
                .attr('cy', '');
    
    links.exit().remove();
    nodes.exit().remove();
};

//Tree Layout
var _tree = function(){
    
    var tree = d3.layout.tree().size([_opt.width - 10, _opt.height - 10]);
    
    var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });
    
    var nodes = tree.nodes(_data); 
    
    _.each(nodes, function(d){
        if(_data.taxId === d.taxId) return;
        d.y = d.parent.y + 50*(d.children ? d.children.length + 1 : 1); 
    });
    
    var links = tree.links(nodes);
    
    _g.selectAll('.link').remove();
    links = _g.selectAll('.link').data(links);
    
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
                .attr('r', function(d){ var ch = d.children || []; return _sizeScale(ch.length);})
                .on('mouseover', function(d){
                    d3.select(this).style('cursor','pointer');
                    
                    var coords = [d3.event.pageX, d3.event.pageY];
                    vis.trigger(_EVT_MOUSE_OVER, d, coords);
                })
                .on('mouseout', function(d){
                    d3.select(this).style('cursor','default');
                    vis.trigger(_EVT_MOUSE_OUT, d);
                })
                .on('click', function(d){vis.trigger(_EVT_CLICK, d);});
    
    var translate = [5, 0];
    var t = _g.transition().duration(500).attr('transform', 'translate(' + translate + ')');
    
    var link = t.selectAll('.link')
                .attr('d', diagonal);
    
    var node = t.selectAll('.node')
                .attr('cx', '')
                .attr('cy', '')
                .attr('fill', function(d){ return (d.taxId === _data.taxId) ? _styleScale(d.category) : '#fff';})
                .attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; });
    
    links.exit().remove();
    nodes.exit().remove();
};

//Force Layout
var _force = function(){
    
    var nodes = _flatten(_data),
        links = d3.layout.tree().links(nodes);
    
    // Restart the force layout.
    var force = d3.layout.force()
        .size([_opt.width, _opt.height])
        .on('tick', _tick)
        .nodes(nodes)
        .links(links)
        .start();
    
    _g.selectAll('.link').remove();
    links = _g.selectAll('.link').data(links);
    
    links.enter().append('line')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1.5)
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });
    
    nodes = _g.selectAll('.node').data(nodes, function(d) { return d.name; });
    
    nodes.enter().append('circle')
                .attr('class', 'node')
                .attr('stroke-width', 1.5)
                .attr('stroke', function(d){return _styleScale(d.category);})
                .attr('r', function(d){ var ch = d.children || []; return _sizeScale(ch.length);})
                .on('mouseover', function(d){
                    d3.select(this).style('cursor','pointer');
                    
                    var coords = [d3.event.pageX, d3.event.pageY];
                    vis.trigger(_EVT_MOUSE_OVER, d, coords);
                })
                .on('mouseout', function(d){
                    d3.select(this).style('cursor','default');
                    vis.trigger(_EVT_MOUSE_OUT, d);
                })
                .on('click', function(d){vis.trigger(_EVT_CLICK, d);})
                .call(force.drag);
    
    _g.transition().attr('transform', '');
    
    nodes.attr('fill', function(d){ return (d.taxId === _data.taxId) ? _styleScale(d.category) : '#fff';})
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('transform', '');
    
    links.exit().remove();
    nodes.exit().remove(); 
};

var _tick = function(){
    
  _g.selectAll('.link').attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; });

  _g.selectAll('.node').attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; });
};

// Returns a list of all nodes under the root.
var _flatten = function(root){
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        nodes.push(node);
    }

    recurse(root);
    return nodes;
};

/**
  * Creates a taxa object
  */
var vis = function self(opt){
    
    _opt = opt;
    
    // Init the node style scale
    _styleScale = d3.scale.ordinal()
            .domain(['CP','RP','-'])
            .range(_opt.nodeColours);
    
    _svg = d3.select(_opt.el).append('svg')
        .attr('width', _opt.width)
        .attr('height', _opt.height);
    
    var zoom = d3.behavior.zoom()
            .on('zoom', function(){
                _tg.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            });
    
    _tg = _svg.call(zoom).append('g');
    _g = _tg.append('g');
    
    return self;
};

vis.data = function(_){
     if (!arguments.length)
        return _data;
    _data = _;
    _createSizeScale();
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
    }else if (_layout == 'radial'){
        _radial();
    }else{
        _force();
    }
    return vis;
};

vis.svg = function(){return _svg;};

//Add events
_.extend(vis, require('biojs-events'));
module.exports = vis;
