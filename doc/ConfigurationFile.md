To make charts appear on the dashboard, you have to configure them.

The configuration is done in the JSON file of
[castor](https://github.com/castorjs/castor-core) (e.g.`data.json`),
it's a file with the same name as the data directory
(besides that directory), appended with `.json`.

```
.
├── data
│   └── data.csv
└── data.json
```

The *fields* are set separated from the *dashboard* and its charts itself. They
form the [`documentFields`](DocumentFields.md), [`corpusFields`](CorpusFields.md)
and [`flyingFields`](FlyingFields.md) parts.

The whole dashboard configuration is done inside the `dashboard` key of the
JSON configuration file.

Each chart has to be described in the `dashboard.charts` key.

Below is an example with an histogram, and a pie chart. There are two types of
charts: [`histogram`](Histogram.md) and [`pie`](Pie.md).

```json
{
  "documentFields": {
    "$fields.Themes" : {
      "path" : "content.json.DiscESI",
      "parseCSV" : ";",
      "foreach": {
        "trim": true
      }
    },
  },
  "dashboard" : {
    "charts": [
        {
            "fields": ["content.json.Py"],
            "type": "histogram"
        },
        {
            "fields": ["fields.Themes"],
            "type": "pie"
        }
    ]
  }
}
```

> **Tip:** to make `documentFields`, and `charts` configuration easier, you can set `addlinkstojbj` to `true`. This will add links from charts, documents list, and document display to the [JBJ Playground](http://Inist-CNRS.github.io/jbj-playground/), filling the `input` area with JSON data useful to configuration.
