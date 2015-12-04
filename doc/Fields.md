## Simple configuration

To indicate which field is used by a chart, you have to specify it inside the chart.

These are used to point inside the mongodb document, using the dot notation.

Often, they are placed in the `content` field, or in `fields`.

Ex:

```javascript
"dashboard" : {
  "charts": [
      {
          "field": "content.json.Py",
          "type": "histogram"
      },
      {
          "field": "content.json.DiscESI",
          "type": "pie"
      }
  ]
}
```


## Multivalued fields

Maybe your fields are *multivalued*, for example, if you load `csv` files.

For example, in a `Keywords` columns, you have such values:

```
Dashboard; Nodejs; Github
Web; Dashboard; Statistics
```

The direct way, is to point to `content.json.keywords`, but that will
distinguish the `Dashboard` from the first row to the one from the second row.
Moreover, they will be bound to other keywords on the same row.

The solution is to add a *document field* in the JSON configuration file,
using [JBJ](https://github.com/Inist-CNRS/node-jbj)'s syntax:

```javascript
"documentFields" : {
  "$Keywords" :  {
    "path" : "content.json.Keywords",
    "parseCSV" : ";",
    "foreach"  : {
      "trim" : true
    }
  }
},
```

Then, you have to add

```javascript
"dashboard" : {
  "charts": [
      {
          "field": "content.json.Py",
          "type": "histogram"
      },
      {
          "field": "Keywords",
          "type": "pie"
      }
  ]
}
```

Here is an example with a normal field `Py` (Publication year, which
is unique in each row), and a multivalued one, `Keywords` (several
keywords):

```javascript
"documentFields" : {
  "$Keywords" :  {
    "content.json.Keywords",
    "parseCSV" : ";",
    "foreach"  : {
      "trim" : true
    }
  }
},
"dashboard" : {
  "charts": [
      {
          "field": "content.json.Py",
          "type": "histogram"
      },
      {
          "field": "Keywords",
          "type": "pie"
      }
  ]
}
```
