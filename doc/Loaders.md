By default, ezVIS is able to load CSV files (each line being a document).

Here is the default settings:

```javascript
  "loaders": [
    {
      "script": "castor-load-csv",
      "pattern": "**/*.csv"
    }
  ]
```

These settings mean that all `.csv` files within the data directory (and all
its descendants, thanks to `**/`) will be loaded by
[`castor-load-csv`](https://github.com/castorjs/castor-load-csv).

You can add any castor loader you find in
[castorjs repositories](https://github.com/castorjs?query=castor-load)
(except [castor-load](https://github.com/castorjs/castor-load), which manages
(all loaders).

For example, to enable ezVIS to load XML files, each containing several
documents (in `/RDF/Topic`), use:

```javascript
  "loaders" : [
    {
      "script" : "castor-load-xmlcorpus",
      "pattern" : "**/*.xml",
      "options" : {
        "cutter" : "/RDF/Topic"
      }
    }
  ]
```

There is an example of TSV settings in the 
[showcase](https://github.com/madec-project/showcase).
