var assert = require('chai').assert,
    data = require('../data/taxa.json');
    taxa = require('../js/taxa.js');

//Init taxa with data
taxa(data);

describe('Get tree', function () {
    it('should return tree for Homininae (207598)', function () {
        var node = taxa.get(207598);
        var ch = node.children;
        
        assert.isDefined(node, 'root is defined');
        assert.isArray(ch, 'children is array');
        
        assert.equal(ch[0].taxId, 9592);
        assert.equal(ch[1].taxId, 9596);
        assert.equal(ch[2].taxId, 9605);
    });
});

describe('Get reduced tree', function () {
    it('should return tree for Homininae (207598)', function () {
        var node = taxa.getReduced(207598);
        var ch = node.children;
        
        assert.isDefined(node, 'root is defined');
        assert.isArray(ch, 'children is array');
        
        assert.equal(ch[0].taxId, 9595);// Gorilla
        assert.equal(ch[1].taxId, 9598);// Chimp
        assert.equal(ch[2].taxId, 9606);// Human
    });
});