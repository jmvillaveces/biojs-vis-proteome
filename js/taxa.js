var _ = require('underscore'), d3 = require('d3');
var _nodesMap;

var _getClone = function(taxId){
    
    var n = _nodesMap.get(taxId);
    var cl = _.clone(n);
    
    if(_.has(n, 'children')){
        cl.children = _.map(n.children, _.clone);
    }
    
    return cl;
};

var _getTree = function self(n){
    var ch = n.children;
    _.each(ch, function(taxId, i){
        var c = _getClone(taxId);
        
        n.children[i] = c;
        self(c);
    });
};

var _getReducedTree = function self(n){
    var ch = n.children;
    if(ch.length === 1){
        n.children = _getClone(ch[0]).children;
        self(n);
    }else{
        _.each(ch, function(taxId, i){
            var c = _getClone(taxId);
            n.children[i] = c;
            self(c);
        });   
    }
};

/**
  * Creates a taxa object
  */
var taxa = function(data){
    
    _nodesMap  = d3.map();
        
    _.each(data, function(n){
        _nodesMap.set(n.taxId, n);
    });
};

taxa.getNodes = function(){
    return _nodesMap;
};

taxa.getParents = function(taxId){
    
    var nodes = [], node = _getClone(taxId);
    
    var getParents = function myself(node){
        if(node.taxId !== 1){
            nodes.push(node);
            myself(_getClone(node.parentTaxId));
        }
    }(node);
    
    return nodes;
};

taxa.get = function(taxId){
    var root = _getClone(taxId);
    _getTree(root);
    
    return root;
};

taxa.getReduced = function(taxId){
    var root = _getClone(taxId);
    var map = d3.map();
    
    map.set(taxId, root);
    
    var tmp = function self(n){
        _.each(n.children, function(id){
            var cl = _getClone(id);
            map.set(id, cl);
            self(cl);
        });
    }(root);
    
    map.forEach(function(k, v){
        v.children = _.map(v.children, function(id){
            return map.get(id);
        });
    });
    
    map.forEach(function(k,v){
        if(v.children.length === 1){
            
            var gp = map.get(v.parentTaxId), ch = v.children[0];
            
            ch.parentTaxId = gp.taxId; 
            
            for(var i=0; i<gp.children.length; i++){
                var d = gp.children[i];
                if(d.taxId === v.taxId){
                    gp.children.splice(i, 1);
                    break;
                }
            }
            gp.children.push(ch);
        }
    });
    
    return root;
};

module.exports = taxa;