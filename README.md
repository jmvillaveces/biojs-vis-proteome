biojs-vis-proteome
==================

A BioJS component for dynamic, multilevel visualisation of proteomes in UniProt.

Click [here](http://jmvillaveces.github.io/biojs-vis-proteome/example.html) to see this component in action.

Here is the code for the example above:
```
<meta charset="utf-8">
<link rel="stylesheet" type="text/css" href="https://rawgit.com/jmvillaveces/biojs-vis-proteome/master/build/css/proteome.css">
<script src="https://rawgit.com/jmvillaveces/biojs-vis-proteome/master/build/biojs-vis-proteome.js"></script>

<div id=yourDiv style="height:700px"></div>

<script>
var proteome = new Proteome({
        el:'yourDiv', 
        rootTaxa:333750,
        taxaURL: 'http://rawgit.com/jmvillaveces/biojs-vis-proteome/master/build/data/taxa.json',
        width: 800,
        height:800
});
</script>
```
