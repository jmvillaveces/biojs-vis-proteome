//Libraries
var _ = require('underscore');
var d3 = require('d3');
var Events = require('biojs-events');

var Dialog = require('./dialog.js');
var Tooltip = require('./tooltip.js');

//App components
var controlbar = require('./controlbar.js');

//Private Members
var _opt = {
    el: 'YourOwnDivId',
    graphReduction: true,
    taxaURL: 'taxa.json',
    rootTaxa: -1,
    nodeColours: ['steelblue', 'orange', 'green', 'purple', 'red', 'gold', 'gray']
};

var _width = null, // visualization width
    _height = null, // visualization height
    _canvas = null,  //canvas tag
    _context = null, //canvas context
    _curLinksData = [],  //Data of the displayed links 
    _curNodesData = [],  //Data of the displayed nodes 
    _connErrorMsg = 'There was an error fetching the data. Please check your connection or try again later!',  // Default error message to show on connection error
    _nodesMap = null,  //Map containing all nodes
    _translate = [0,0],  //Current translate
    _scale = 1,  // Current scale,
    _radiusScale = null, // Scale to calculate the nodes size
    _toolTip = null,  //Tooltip
    _aboutPopup = null,  //About Popup
    _optionsPopup = null,  //Options Popup
    _navBar = null,  //Navigation line
    _styleScale = null, //Scale to calculate nodes colour
    _forceWorker = null,
    _cnvsId = _.uniqueId('cnvs_'); // unique canvas Id


/**
  * Changes the mouse style according to bool
  *
  * @param {boolean} bool If true, the cursor is set to wait else is set to default
  *
  */
var _loading = function(bool){
    if(bool) {
        d3.select('#'+_opt.el).style('cursor','wait'); 
        return;
    }
    d3.select('#'+_opt.el).style('cursor','default'); 
};

 /**
  * Makes an ajax call and retrieves the taxa data from taxaURL
  */
var _getData = function(cb){
    
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
            
        //Create nodesMap
        _nodesMap = d3.map();
        
        _.each(data, function(n){
            n.grChildren = n.children;
            n.grParentTaxId = n.parentTaxId;
            _nodesMap.set(n.taxId, n);
        });
        cb();
    });   
};

/**
  * Recursive function to calculate graph reduction as well as node categories
  */
var _graphReduction = function myself(node, cat){
    
    if(node.category === '-'){
        if(_.indexOf([2, 2759, 10239, 2157], node.taxId) !== -1) cat = node.taxId+'';            
        node.category = cat;
    }
        
    var childrenIds = node.grChildren;
        
    if(childrenIds.length === 1){
            
        //update child
        var child = _nodesMap.get(childrenIds[0]);
        child.grParentTaxId = node.grParentTaxId;
            
        // update parent
        var parent = _nodesMap.get(node.grParentTaxId);
        parent.grChildren = _.without(parent.grChildren, node.taxId);
        parent.grChildren.push(child.taxId);
            
        //recursion on child
        myself(child, cat);
            
    }else if(childrenIds.length > 1){
        _.each(childrenIds, function(id){
            myself(_nodesMap.get(id), cat);
        });
    }
};

var _selectionWindow = function(){
    var table = d3.select('#'+_opt.el).append('table').attr('class', 'browse');
        
    var row = table.append('tr');
        
    row.append('td')
        .on('click', function(){browseClick(10239);})
        .attr('class', 'browse-box viruses')
        .html('Viruses').append('div').attr('class', 'virus-bkg');
    row.append('td')
        .on('click', function(){browseClick(2);})
        .attr('class', 'browse-box bacteria')
        .html('Bacteria').append('div').attr('class', 'bacteria-bkg');
        
    row = table.append('tr');
        
    row.append('td')
        .on('click', function(){browseClick(2157);})
        .attr('class', 'browse-box archaea')
        .html('Archaea').append('div').attr('class', 'bacteria-bkg');
    row.append('td')
        .on('click', function(){browseClick(2759);})
        .attr('class', 'browse-box eukaryota')
        .html('Eukaryota').append('div').attr('class', 'eukaryota-bkg');
    
    function browseClick(taxId){
        var tax = _nodesMap.get(taxId);
        
        if(! _.isUndefined(tax)){
            table.style('display', 'none');
            _nodeClick(tax);
        }
    }
};

/**
  * Geometric zoom using d3 translate and scale values to redraw the canvas
  */
var _zoom = function () {
        _translate = d3.event.translate;
        _scale = d3.event.scale;
        _draw();
};
    
/**
  * Updates translate and scale values before updating the visualization
  */
var _nodeClick = function(node){
    if(!_.isUndefined(node)) {
        //Reset scale and translate
        _translate = [0,0];
        _scale = 1;
        _updateViz(node);
            
        proteome.trigger('onTaxaChanged', node);
    }
};

/**
  * Finds nodes in the defined coordinates.
  * 
  * @param {int[]} array containing x and y coordinates
  *
  * @return {Object} node in coordintes. Returns undefined if there nothing is found
  */
var _findNode = function(coords) {
    var node = _.find(_curNodesData, function(n){
        var nCoords = _getScreenCoords(n.x, n.y);
        var radius = _radiusScale(n.r); //* self.scale;
        if(coords[0] > nCoords.x-radius && coords[0] < nCoords.x+radius && coords[1] > nCoords.y-radius && coords[1] < nCoords.y+radius ){
            return n;
        }
    });
        
    return node;
};
    
/**
  * Translates mouse coordinates 
  */
var _getScreenCoords = function (x, y) {
    var xn = _translate[0] + x*_scale,
        yn = _translate[1] + y*_scale;
    return { x: xn, y: yn };
};

/**
  * Set the nodes and edges to display
  *
  * @param {object} node The starting taxa to render the tree
  *
  */
var _formatData = function(node){
    
    var nodes = [], links = [],
        children = (_opt.graphReduction) ? 'grChildren' : 'children',
        max = 0;
        
    var getNodes = function myself(n){
        nodes.push(n);
            
        _.each(n[children], function(ch){
            myself(_nodesMap.get(ch));
        });
            
    }(node);
        
    //create links
    _.each(nodes, function(n){
        var source = n;
            
        n.r = n[children].length;
        if(n.r > max) max = n.r;
        _.each(source[children], function(ch){
            var target = _nodesMap.get(ch);
            links.push({
                source: source,
                target: target
            });
        });
    });
        
    _radiusScale = d3.scale.ordinal().domain([0, max]).range([5,8]);
        
    _curNodesData = nodes;
    _curLinksData = links;
};

/**
  * Update the navigation line
  *
  * @param {object} node The starting taxa to render the tree
  *
  */
var _updateNavLine = function(node){
    
    var nodes = [],
        parent = (_opt.graphReduction) ? 'grParentTaxId' : 'parentTaxId';
        
    var getParents = function myself(node){
        if(node.taxId !== 1){
            nodes.push(node);
            myself(_nodesMap.get(node[parent]));
        }
    }(node);
        
    nodes = nodes.reverse();
        
    var line = _navBar.selectAll('line').data([{id:'navLine'}]);
        
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
        }).on('click', function(d){
            _nodeClick(d);
        }).append("title").text(function(d) { return d.name + ' ('+d.taxId+')'; });
        
    //Update
    circle.attr('cx', function(d,i){return i*20 + 20;})
        .attr('cy', 12)
        .attr('r', 4)
        .style('fill', function(d){return _styleScale(d.category);})
        .style('stroke', '#003300')
        .style('stroke-width', function(d){ return (d.taxId === node.taxId) ? 2 : 0; });
        
    //Remove
    circle.exit().remove();
        
    var data =  _.isUndefined(_.last(nodes)) ? [] : [_.last(nodes)];
    var text = _navBar.selectAll('text').data(data);

    //Enter
    text.enter().append('text');
        
    //Update
    text.text( function (d) { return d.name + ' ('+d.taxId+')'; })
        .attr('x', (nodes.length-1)*20+20)
        .attr('y', 30)
        .attr('text-anchor', 'right')
        .attr('font-size', 12);
        
    //Remove
    text.exit().remove();
};

/**
* Updates the current visualizaion using node as input
* 
* @param {object} node The starting taxa to render the tree
*/
_updateViz = function(node){
    _loading(true);//start loading
        
    // Use a timeout to allow the rest of the page to load first.
    setTimeout(function() {
        _formatData(node);
        _updateNavLine(node);

        // Start force
        var force = d3.layout.force()
                .charge(-90)
                .linkDistance(5)
                .size([_width, _height])
                .nodes(_curNodesData)
                .links(_curLinksData)
        .on('tick', function tick(){
            
        });


        // Run the layout a fixed number of times.
        // The ideal number of times scales with graph complexity.
        // Of course, don't run too long—you'll hang the page!
        var n = 90;
        force.start();
        for (var i = n; i > 0; --i) force.tick();
        force.stop();
        
        //Draw the canvas
        _draw();

        _loading(false);//stop loading
    }, 10);
};
    
/** 
  * Draws the graph using canvas. To avoid unnecessary canvas state changes colours are rendered
  * in different paths.
  */
var _draw = function() {
        
    // Start timing now
    console.time('draw');
                
    _context.save();
    _context.clearRect(0, 0, _width, _height);
    _context.translate(_translate[0], _translate[1]);
    _context.scale(_scale, _scale);
        
    // draw links
    _context.strokeStyle = '#444';
    _context.beginPath();
    _curLinksData.forEach(function(d) {
        _context.moveTo(d.source.x, d.source.y);
        _context.lineTo(d.target.x, d.target.y);
    });
    _context.stroke();
    _context.closePath();

    // draw nodes
    var root = _curNodesData[0];
        
    //Highlight root
    _context.beginPath();
    _context.moveTo(root.x, root.y);
    _context.arc(root.x, root.y, 10, 0, 2 * Math.PI); //root is bigger than other nodes
    _context.lineWidth = 2;
    _context.strokeStyle = '#003300';
    _context.closePath();
    _context.stroke();
        
    //Its less costly to draw things by colour
    var groups = _.groupBy(_curNodesData, 'category');
        
    _.each(_.keys(groups), function(cat){
        _context.beginPath(); // one path per category
        _context.fillStyle = _styleScale(cat);
            
        _.each(groups[cat], function(d){
            _context.moveTo(d.x, d.y);
            _context.arc(d.x, d.y, _radiusScale(d.r), 0, 2 * Math.PI);
        });
        _context.closePath();
        _context.fill();
    });
        
    _context.restore();
        
    console.log('nodes '+_curNodesData.length);
        
    // ... and stop.
    console.timeEnd("draw");
};

var proteome = function(options){
    //extend options
    _.extend(_opt, options);
    
    
    _loading(true); // start loading
    
    // Component dimensions
    _width =  document.getElementById(_opt.el).clientWidth; // inner width of the target element in pixels
    _height = document.getElementById(_opt.el).clientHeight; // inner height of the target element in pixels
        
    _width = (_width === 0) ? 500 : _width;
    _height = (_height === 0) ? 500 : _height;

    // Initialize the canvas component with defined size, click, mousemove and zoom behavior
    _canvas = d3.select('#'+_opt.el).append('canvas')
                .text('your browser doesn\'t support canvas!')
                .attr('id', _cnvsId)
                .attr('width',_width)
                .attr('height',_height)
                .call(d3.behavior.zoom().on('zoom', function(){_zoom();}))
                .on('click', function(){
                    var coords = d3.mouse(this);
                    var node = _findNode(coords);
                    _nodeClick(node);
                })
                .on('mousemove', function() {
                    var coords = d3.mouse(this);
                    
                    if(_.isNull(_toolTip)) return;
                    
                    var node = _findNode(coords);
                    if(!_.isUndefined(node)){
                        _toolTip.showTooltip(node.name, coords);
                    }else{
                        _toolTip.hideTooltip();
                    }
                });
    
    //Init canvas 2d context
    _context = _canvas.node().getContext('2d');
        
    //Init navigation bar
    _navBar = d3.select('#'+_opt.el).append('svg')
            .attr('width', _width)
            .attr('height', 50);
        
    // Init the node style scale
    _styleScale = d3.scale.ordinal()
            .domain(['2', '2759', '10239', '2157', 'CP','RP','-'])
            .range(_opt.nodeColours);
        
    _getData(function(){
        
        //Set selected taxa and root taxa
        var selected =  _nodesMap.get(_opt.rootTaxa), 
            root = _nodesMap.get(1);

        //Calculate graph reduction
        _graphReduction(root, '-');
        
        // Init control bar
        controlbar
            .el(_opt.el)
            .nodes(_nodesMap).init()
            .on('onDownloadClicked', function(a){
                var dataURL = document.getElementById(_cnvsId).toDataURL('image/png');
                a.href = dataURL;
            })
            .on('onAboutClicked', function(){
                var str = '<p class="title">About</p>'+
                    '<p class="content">' +
                    'Welcome to the <b>Proteome Taxonomy Viewer</b>. A <b>proteome</b> consists of the set of proteins thought to be ' +
                    'expressed by an organism whose genome has been completely sequenced. Here we provide a representation ' +
                    'of the taxonomy tree for all ' +
                    'the taxon nodes that have a proteome in UniProt. It further marks the nodes that have a ' +
                    '<b>reference proteome</b> in UniProt, i.e., the proteome of a representative, ' +
                    'well-studied model organism or an organism of interest for biomedical research and phylogenetic analyses. ' +
                    '</p><p>We undertake <b>graph reduction</b> by skipping the nodes that only have one child and go directly to ' +
                    'the next level. You can turn this off in the <b>&#x2699;</b> Settings.' +
                    '</p>';
                
                if(_.isNull(_aboutPopup)) _aboutPopup = Dialog(_opt.el, str);
                _aboutPopup.showDialog();
            })
            .on('onSettingsClicked', function(){
                var content = function(div){
                    div.append('p').attr('class','title').html('Options');
                    
                    var cbox = div.append('p').attr('class', 'content').text('Graph Reduction').append('input').attr('type', 'checkbox');
                    
                    if(_opt.graphReduction) cbox.attr('checked','');
                    
                    cbox.on('click', function(){
                        _opt.graphReduction = !_opt.graphReduction;
                        if(_curNodesData.length > 0) _nodeClick(_curNodesData[0]);//update viz
                    });
                };
                
                if(_.isNull(_optionsPopup)) _optionsPopup = Dialog(_opt.el, content);
                
                _optionsPopup.showDialog();
            })
            .on('onResultClicked', function(d){
                _updateViz(d);
            });
        
        _toolTip = Tooltip(_opt.el); //init tooltip
        if(_.isUndefined(selected)){ 
            _selectionWindow();
        }else{
            _updateViz(selected); //Start visualization with selected taxa
        }
        
        _loading(false);
    });
};

_.extend(proteome, Events);
module.exports = Proteome = proteome;