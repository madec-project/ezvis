castor-theme-sbadmin
======================

A Castor theme to visualize a synthesis on a corpus using pies and histograms, based on [SB Admin v2.0](http://startbootstrap.com/templates/sb-admin-2/).

Installation
------------

You have to install [mongodb](http://docs.mongodb.org/manual/installation/)
first, and [node](http://nodejs.org/) too.

```bash
$ npm install castor-cli -g
$ npm install castor-theme-sbadmin -g
```

Usage
-----

```bash
$ castor --theme ./castor-theme-sbadmin/ /path/to/data/repository
```

If you don't have a data repository, but already loaded data in mongodb, you
can use:

```bash
$ castor --theme ./castor-theme-sbadmin/ $PWD/data
```

Before that, you have to configure your mongo connection, by creating a
`./data.json` file containing something like:

```json
{
  "port": 3000,
  "collectionName" : "insu"
}
```

Or, if you prefer (assuming you use `insu` collection):

```bash
$ castor --theme ./castor-theme-sbadmin/ --collectionName insu
```

Configuration
-------------

To make charts appear on the dashboard, you have to configure them.

The configuration is done in the JSON file of
[castor](https://github.com/castorjs/castor-core) (e.g.`data.json`),
it's a file with the same name as the data directory
(besides that directory), appended with `.json`.

The whole dashboard configuration is done inside the `dashboard` key
of the JSON configuration file.

Each chart has to be described in the `dashboard.charts` key.

Below is an example with an histogram, and a pie chart. There are two types of
charts: [`histogram`](#histogram) and [`pie`](#pie).

```json
{
  "theme": "/path/to/castor-theme-sbadmin",
  "documentFields": {
    "Themes" : {
      "path" : "content.json.DiscESI",
      "separator" : ";"
    }
  },
  "dashboard" : {
    "charts": [
        {
            "field": "content.json.Py",
            "type": "histogram"
        },
        {
            "field": "fields.Themes",
            "type": "pie"
        }
    ]
  }
}
```
## Dashboard
### type
A documents' field which number of distinct values has to be displayed. 
**Replaced** (see [corpusFields](https://github.com/castorjs/castor-compute)).

For example: a type of paper (for scientific articles).

#### keys
* path: path to the field, in dotted notation (default value: `mimetype`)
* label (default value: `MIME Types`)

#### example
```json
{
  "dashboard" : {
    "type" : {
      "path": "content.json.Pt",
      "label": "Document types"
    }
  }
}
```

## Charts

### Chart types

#### histogram

Used to represent evolution of the number of documents along the time (so,
this field is often a publication year, or anything indicating a point in
time).

Possible configuration: [`size`](#size), [`legend`](#legend), and [`color`](#color).

#### pie

Used to fill the pie chart quarters.

There are some configuration possible: [`size`](#size) of the pie, and
position of the [`legend`](#legend).

#### horizontalbars

Used to display the number of documents associated to a field value (for
example, for keywords: how many documents match a keyword?).
Bars are sorted by descending number of documents.

Possible configuration: [`size`](#size), [`color`](#color), [`legend`](#legend), and `maxItems`.

`maxItems` limit the number of bars to its value (default value: `100`).

### Preferences

#### size

To specify the size of the pie, add the `size` key to your chart.
Then, you can follow the [C3's example](http://c3js.org/samples/options_size.html) to fill it.

Ex:

```javascript
{
  "field": "fields.Themes",
  "type": "pie",
  "size": {
    "height": 400
  }
}
```

You can add a `columns` property too, knowing that the display has a "width"
of 12 columns (Twitter bootstrap).

Here is  an example where the pie should take half of the page's width:

```javascript
{
  "field": "fields.Themes",
  "type": "pie",
  "size": {
    "height": 400,
    "columns": 6
  }
}
```

If you need to separate two charts, you can add an offset before a chart, using
`offset` property. It is a number which represent the "width" of `offset`
columns.

Below is an example where the horizontal bars should take 5 columns, with a
preceding offset of 1 column.

```javascript
{
  "field": "fields.Themes",
  "type": "horizontalbars",
  "title": "Thèmes",
  "size": {
    "height": 420,
    "columns": 5,
    "offset": 1
  }
}
```

#### legend

To specify where you want the legend to be, add the `legend` key to your chart.
Then, you follow the [C3's example](http://c3js.org/samples/legend_position.html) to fill it.

There are currently only two positions: `bottom` and `right`.

Ex:

```javascript
{
  "field": "fields.Themes",
  "type": "pie",
  "legend": {
    "position": "bottom"
  }
}
```

You can also hide/show the legend, using `"show": false` or `"show": true`:

```json
{
  "field": "fields.Themes",
  "type": "pie",
  "legend": {
    "show": false
  }
}
```

#### color
You can set a `color` value (hexadecimal color value).
Example with a red histogram:

```json
{
  "dashboard": {
    "charts" : [
      {
        "field": "content.json.Year",
        "type": "histogram",
        "color": "#ff0000"
      }
    ]
  }
}
```

#### colors
In a pie, you can parameter a set of colors to be used:

```json
{
  "dashboard": {
    "charts" : [
      {
        "field": "content.json.Keywords",
        "type": "pie",
        "colors": [ "#BB9FF5", "#ff7a85", "#44b2ba", "#ffa65a", "#34cdb8"]
      }
    ]
  }
}
```

### Field configuration

#### Simple configuration

To indicate which field is used by a chart, you have to specify it inside the can use the JSON configuration field.

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


### Multivalued fields

Maybe your fields are *multivalued*, for example, if you load `csv` files.

For example, in a `Keywords` columns, you have such values:

```
Dashboard; Nodejs; Github
Web; Dashboard; Statistics
```

The direct way, is to point to `content.json.keywords`, but that will
distinguish the `Dashboard` from the first row to the one from the second row.
Moreover, they will be bound to other keywords on the same row.

The solution is to add a *custom field* in the JSON configuration file:

```javascript
"documentFields" : {
  "Keywords" :  {
    "path" : "content.json.Keywords",
    "separator" : ";"
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
          "field": "fields.Keywords",
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
  "Keywords" :  {
    "content.json.Keywords",
    "separator" : ";"
  }
},
"dashboard" : {
  "charts": [
      {
          "field": "content.json.Py",
          "type": "histogram"
      },
      {
          "field": "fields.Keywords",
          "type": "pie"
      }
  ]
}
```

## Documents table

In `/chart.html` pages, you can see a chart, and a table with documents. This table display the fields you chose to put in the `documentFields` key.

Here is an example, displaying `Year`, `Title`, `Authors`, and `Keywords`:

```javascript
"documentFields" : {
  "year"   : {
    "path" : "content.json.Py",
    "label": "Publication Year",
    "visible": true
  },
  "title"  : {
    "path" : "content.json.Ti",
    "label": "Title",
    "visible": true
  },
  "authors": {
    "path" : "content.json.Af",
    "label": "Authors",
    "visible": true
  },
  "keywords" : {
    "path" : "content.json.DiscESI",
    "label": "Keywords",
    "visible": true
  }
}
```

All *custom fields* which `visible` key is set to `true` will be
present in the table.

By default, `visible` key value is `false`.

## Facets

In a chart page, you can add facets: others fields' values.

Thus, you can have facets in each chart. Example:

```javascript
  "charts": [
    {
      "field": "fields.Section",
      "type": "pie",
      "title": "Sections",
      "facets": [
        {
          "path": "content.json.Py",
          "label": "Year"
        },
        {
          "path": "fields.Themes",
          "label": "Theme"
        }
      ]
    },
```

Here, you have a pie displaying sections, and two facets:

1. pointing to `content.json.Py`  in the document
2. pointing to `fields.Theme`  in the document

# Document's page
## Title
To indicate the title of a document, use the `documentFields` named `title`.

## Fields
In order to make the `/display/id.html` page work, one filter has
to be declared in the configuration:

```json
{
  "filters": {
    "objectPath": "objectPath"
  }
}
```

Then, you have to declare all the fields you want in the document's page.

They have to be in `display.fields`, they'll be displayed in the same
order as their declaration's order.

Use `"path": "label"`

Ex:

```json
{
  "display" : {
    "fields" : {
      "fields.title": "Titre",
      "fields.authors": "Auteurs",
      "fields.year": "Année de publication",
      "content.json.SourceCorrigee": "Source",
      "content.json.DiscESI": "Discipline ESI",
      "content.json.SectionEtude": "Marquage INSU - Section",
      "content.json.La": "Langue de la publication",
      "content.json.PaysFRERegroupe": "Pays",
      "content.json.Di": "DOI",
      "content.json.Ut": "Identifiant WoS"
    }
  }
}
```

## Fields' number
To modify the number of fields displayed per page, change the
`display.fieldsPerPage` value in the configuration.

Ex:

```json
{
  "display" : {
    "fieldsPerPage": 10
  }
}
```
