EZVIS
=====

A web dashboard to visualize a synthesis on a structured corpus, using several
charts (pies, histograms, ...), powered by
[castor](https://github.com/castorjs/castor-core/), and based on 
[SB Admin v2.0](http://startbootstrap.com/templates/sb-admin-2/).

ezVIS stands for easy **vis**ualization of information in web report.

# Installation

You have to install [mongodb](http://docs.mongodb.org/manual/installation/)
first, and [node](http://nodejs.org/) too.

```bash
$ npm install ezvis -g
```

# Usage

Make sure mongodb is running, and then.

```bash
$ ezvis /path/to/data/repository
```

Then, point your browser to http://localhost:3000/

### hint

If you don't have a data repository, but already loaded data in mongodb, you
can use:

```bash
$ ezvis $PWD/data
```

Before that, you have to configure your mongo connection, by creating a
`./data.json` file containing something like:

```json
{
  "port": 3000,
  "collectionName" : "insu"
}
```

Then, point your browser to http://localhost:3000/

# Configuration

To make charts appear on the dashboard, you have to configure them.

The configuration is done in the JSON file of
[castor](https://github.com/castorjs/castor-core) (e.g.`data.json`),
it's a file with the same name as the data directory
(besides that directory), appended with `.json`.

The whole dashboard configuration is done inside the `dashboard` key of the
JSON configuration file. Except, the `documentFields` configuration, and
`corpusFields`.

Each chart has to be described in the `dashboard.charts` key.

Below is an example with an histogram, and a pie chart. There are two types of
charts: [`histogram`](#histogram) and [`pie`](#pie).

```json
{
  "theme": "/path/to/ezvis",
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

## documentFields

documentFields are fields added to each document at loading/synchronizing files.

They are declared in the JSON settings, in the `documentFields` object.

A simplistic example of a document is:

```json
{
  "wid": "2rgwJl",
  "content": {
    "json": {
      "title": "2001: A Space Odyssey",
      "year": "1968",
      "director": "Stanley Kubrick",
      "actors": "Keir Dullea/Gary Lockwood/William Sylvester/Daniel Richter/Leonard Rossiter/Douglas Rain"
    }
  }
}
```

If you want to easily access the year of document, you can declare a `$year` documentField:

```json
{
  "documentFields": {
    "$year": {
      "get": "content.json.year"
    }
  }
}
```

which will modify the former document to the following:

```json
{
  "wid": "2rgwJl",
  "content": {
    "json": {
      "title": "2001: A Space Odyssey",
      "year": "1968",
      "director": "Stanley Kubrick",
      "actors": "Keir Dullea/Gary Lockwood/William Sylvester/Daniel Richter/Leonard Rossiter/Douglas Rain"
    }
  },
  "year": "1968"
}
```

`$year` indicates to create a `year` property at the document's root, and the
[`get` JBJ action](https://github.com/castorjs/node-jbj#get) points to the
location of the source field in the same document.

All [JBJ actions](https://github.com/castorjs/node-jbj#actions) are
applicable, and for example a `"cast": "number"` after the `get` action will
transtype the year `"1968"` into a number `1968`.

A more useful usage is to separate the `content.json.actors` field into one `actors` array:

```json
{
  "documentFields": {
    "$year": {
      "get": "content.json.year"
    },
    "$actors": {
      "path": "content.json.actors",
      "parseCSV" : "/",
      "foreach": {
        "trim": true
      }
    }
  }
}
```

would produce

```json
{
  "wid": "2rgwJl",
  "content": {
    "json": {
      "title": "2001: A Space Odyssey",
      "year": "1968",
      "director": "Stanley Kubrick",
      "actors": "Keir Dullea/Gary Lockwood/William Sylvester/Daniel Richter/Leonard Rossiter/Douglas Rain"
    }
  },
  "year": "1968",
  "actors": ["Keir Dullea","Gary Lockwood","William Sylvester","Daniel Richter","Leonard Rossiter","Douglas Rain"]
}
```

> **Note:** you can use a dot notation in the name of the field to be created. Using
`"$my.fields.year"` will create a `year` field within the `fields` field
within the `my` field at the root of the document.

> **Note 2:** the generated fields are truncated at 1000 characters (if they are of
string type), except if you add `"noindex": true` to the field (in this case,
performance may be lower, but only if later operations use the field; that is
to say that a field created only to be displayed, not to be used in
computations -like charts- is a good candidate to be noindexed).

### text

The `$text` field is used in the documents table to search the documents, as a
full-text index.

Thus, for the document table to be searchable, you have to build a `$text`
field, using technique similar to this:

```json
    "$text": {
      "get" : ["title", "year", "director", "actors"],
      "join": "|"
    }
```

This field is not truncated at 1000 characters.

## corpusFields

corpusFields are computed after documents loading/synchronizing.

They are used to compute metrics on the whold corpus (hence, the name).

For example, to get the number of documents in the corpus:

```javascript
  "corpusFields": {
    "$filmsNb": {
      "visible": true,
      "label"  : "films",
      "icon"   : "hand-o-right",
      "$?"       : "local:///compute.json?operator=count&field=wid",
      "parseJSON": true,
      "get"      : "data.0.value",
      "cast"     : "number"
    },
```

The `filmsNb` corpusFields above is `visible` on the dashboard page, the
`label` displayed after its value is "films", the `icon` at its left is a
[`hand-o-right`](http://fortawesome.github.io/Font-Awesome/icon/hand-o-right/)
from [font-awesome](http://fortawesome.github.io/Font-Awesome/icons/).

From `"$?"` on, the properties are [JBJ actions](https://github.com/castorjs/node-jbj#actions).

The `"$?"` action means that the remaining actions will be applied to the
result of the `/compute` route of ezvis, using the
[`count` operator](https://github.com/madec-project/ezvis/blob/master/OPERATORS.md#count)
on the `wid` `field`.

It's a [source](https://github.com/castorjs/node-jbj#source) using the `local`
protocol, which is a shortcut to `http://localhost:port` (useful because the
port number is not always known before the launch of the server). This one
could return a page like:

```javascript
{
  template: "compute.html",
  url: {
    protocol: "http:",
    slashes: true,
    auth: null,
    host: "localhost:3000",
    port: "3000",
    hostname: "localhost",
    hash: null,
    search: "?operator=count&field=wid",
    query: "operator=count&field=wid",
    pathname: "/compute.json",
    path: "/compute.json?operator=count&field=wid",
    href: "http://localhost:3000/compute.json?operator=count&field=wid"
  },
  parameters: {
    field: [
      "wid"
    ],
    operator: "count",
    selector: null,
    query: null,
    itemsPerPage: 30,
    startIndex: 0,
    startPage: null,
    search: null,
    order: [
      null
    ],
    columns: [
      null
    ],
    flying: [
      null
    ],
    resource: "data5"
  },
  headers: {
    Content-Type: "application/json"
  },
  recordsTotal: 1,
  recordsFiltered: 1,
  data: [{
    _id: "wid",
    value: 29
  }]
}
```

This page is a text, containing JSON. You have to parse it, using
`"parseJSON": true`, then get the value #0 of the `data` array, using the
`get` action and the dot notation: `data.0.value` (it's the object-path
notation, see
[the examples](https://github.com/mariocasciaro/object-path#usage)).

> **Tip:** You can transform a `local:///compute.json?operator=count&field=wid` into
> `http://localhost:3000/compute.json?operator=count&field=wid` and copy-paste
> its content into the input area of the  [JBJ Playground](http://castorjs.github.io/node-jbj/), and try to enter in the 
> stylesheet area the JBJ actions you want to test, and click "Try it" to see if
> the result matches what you want in the corpusField.

## Dashboard

All dashboard settings are inside a `dashboard` key.

At the moment, there is only the [`charts`](#charts) setting.

## Charts

### Chart types

#### histogram

Used to represent evolution of the number of documents along the time (so,
this field is often a publication year, or anything indicating a point in
time).

Possible configuration: [`size`](#size), and [`color`](#color).

If you want to display the holes in time too (e.g., year with no documents),
add `"parseDates": true` in the configuration:

```javascript
      {
        "field": "content.json.year",
        "type": "histogram",
        "title": "Per year",
        "parseDates": true
      }
```

#### pie

Used to fill the pie chart quarters.

There are some configuration possible: [`size`](#size) of the pie, 
[`colors`](#colors) of the slices, and position of the [`legend`](#legend).

You can also use `groupPercent`: if there is more than one slice whose
percentage of the pie is less than this number, those slices will be grouped
together into one slice. This is the "other" slice. It will always be the last
slice in a pie.

To name the possible grouped slice, use `groupedTitle`.

#### horizontalbars

Used to display the number of documents associated to a field value (for
example, for keywords: how many documents match a keyword?).
Bars are sorted by descending number of documents.

Possible configuration: [`size`](#size), [`color`](#color), and `maxItems`.

`maxItems` limit the number of bars to its value (default value: `100`).

If you want to shorten the field value to display on the chart, use an
associative array to replace too long fields values with shorter ones:

```javascript
      {
        "field": "fields.Themes",
        "type": "horizontalbars",
        "title": "Themes (bars)",
        "maxItems" : 10,
        "labels": {
          "Biology & Biochemistry"    : "Bio & Bio",
          "Pharmacology & Toxicology" : "Pharmaco & Toxico",
          "Plant & Animal Science"    : "Plant & Animal"
        }
      },
```

#### map

Used to project country-related numbers on a geographical map.

At the moment, there is only one usable map: "world".

To be able to project the numbers to the areas on the map, you have to match
numbers and ISO-36166-1 ALPHA-3 codes. To do this, you may need the `mapping`
key in the declaration of a new `documentFields` instance.

Here an example:

```javascript
  "dashboard" : {
    "charts": [
      {
        "type": "map",
        "fields": [ "fields.country" ],
        "title": "Countries map"
      }
    ]
  },
  "documentFields" : {
    "country" : {
      "label": "Country",
      "path" : "content.json.country",
      "parseCSV": ";",
      "foreach" : {
        "mapping": {
          "Afghanistan" : "AFG",
          "Angola": "AGO",
          "Albania" : "ALB",
          "Andorra" : "AND",
          "United Arab Emirates" : "ARE",
          "Argentina" : "ARG",
          "Armenia" : "ARM",
          "Fr. S. and Antarctic Lands" : "ATF",
          "Australia" : "AUS",
          "Austria" : "AUT",
          "Azerbaijan" : "AZE",
          "Burundi" : "BDI",
          "Belgium" : "BEL",
          "Benin": "BEN",
          "Burkina Faso" : "BFA",
          "Bangladesh": "BGD",
          "Bulgaria" : "BGR",
          "Bosnia and Herz." : "BIH",
          "Belarus" : "BLR",
          "Belize" : "BLZ",
          "Bolivia": "BOL",
          "Brazil" : "BRA",
          "Brunei" : "BRN",
          "Bhutan" : "BTN",
          "Botswana" : "BWA",
          "Central African Republic": "CAF",
          "Canada" : "CAN",
          "Switzerland" : "CHE",
          "Chile" : "CHL",
          "People's Republic of China" : "CHN",
          "Ivory Coast" : "CIV",
          "Cameroon": "CMR",
          "Zaire" : "COD",
          "Congo" : "COG",
          "Colombia" : "COL",
          "Costa Rica" : "CRI",
          "Cuba" : "CUB",
          "N. Cyprus" : "CYN",
          "Cyprus" : "CYP",
          "Czech Republic": "CZE",
          "Germany" : "DEU",
          "Djibouti" : "DJI",
          "Denmark" : "DNK",
          "Dominican Rep." : "DOM",
          "Algeria" : "DZA",
          "Ecuador": "ECU",
          "Egypt" : "EGY",
          "Eritrea" : "ERI",
          "Spain" : "ESP",
          "Estonia" : "EST",
          "Ethiopia" : "ETH",
          "Finland" : "FIN",
          "Falkland Is." : "FLK",
          "France" : "FRA",
          "Gabon": "GAB",
          "Gaza" : "GAZ",
          "United Kingdom" : "GBR",
          "Georgia" : "GEO",
          "Ghana": "GHA",
          "Guinea" : "GIN",
          "Gambia" : "GMB",
          "Guinea Bissau" : "GNB",
          "Eq. Guinea" : "GNQ",
          "Greece": "GRC",
          "Greenland" : "GRL",
          "Guatemala": "GTM",
          "Guyana" : "GUY",
          "Hong Kong" : "HKG",
          "Honduras" : "HND",
          "Croatia" : "HRV",
          "Haiti" : "HTI",
          "Hungary": "HUN",
          "Iceland": "ISL",
          "India": "IND",
          "Indonesia": "IDN",
          "Ireland": "IRL",
          "Iran": "IRN",
          "Iraq" : "IRQ",
          "Israel": "ISR",
          "Italy" : "ITA",
          "Jamaica" : "JAM",
          "Jordan": "JOR",
          "Japan" : "JPN",
          "Kazakhstan" : "KAZ",
          "Kenya" : "KEN",
          "Kyrgyzstan" : "KGZ",
          "Cambodia" : "KHM",
          "South Korea" : "KOR",
          "Kosovo" : "KOS",
          "Kuwait" : "KWT",
          "Laos"  : "LAO",
          "Lebanon" : "LBN",
          "Liberia" : "LBR",
          "Libya" : "LBY",
          "Liechtenstein" : "LIE",
          "Sri Lanka" : "LKA",
          "Lesotho" : "LSO",
          "Lithuania" : "LTU",
          "Luxembourg" : "LUX",
          "Latvia" : "LVA",
          "Macau" : "MAC",
          "St. Martin" : "MAF",
          "Morocco" : "MAR",
          "Monaco" : "MCO",
          "Moldova" : "MDA",
          "Madagascar" : "MDG",
          "Mexico" : "MEX",
          "Macedonia, the Former Yugoslave Republic of": "MKD",
          "Mali" : "MLI",
          "Myanmar" : "MMR",
          "Montenegro" : "MNE",
          "Mongolia" : "MNG",
          "Mozambique" : "MOZ",
          "Mauritania" : "MRT",
          "Malawi" : "MWI",
          "Malaysia" : "MYS",
          "Namibia" : "NAM",
          "New Caledonia" : "NCL",
          "Niger" : "NER",
          "Nigeria" : "NGA",
          "Nicaragua" : "NIC",
          "Netherlands" : "NLD",
          "Norway" : "NOR",
          "Nepal" : "NPL",
          "New Zealand" : "NZL",
          "Oman" : "OMN",
          "Pakistan" : "PAK",
          "Panama" : "PAN",
          "Peru": "PER",
          "Philippines" : "PHL",
          "Papua New Guinea" : "PNG",
          "Poland": "POL",
          "N. Korea" : "PRK",
          "Portugal" : "PRT",
          "Paraguay" : "PRY",
          "Qatar" : "QAT",
          "Romania" : "ROU",
          "Russia" : "RUS",
          "Rwanda" :  "RWA",
          "W. Sahara" : "SAH",
          "Saudi Arabia" : "SAU",
          "Sudan" : "SDN",
          "S. Sudan" : "SDS",
          "Senegal" : "SEN",
          "Sierra Leone" : "SLE",
          "El Salvador" : "SLV",
          "Somaliland" : "SOL",
          "Somalia" : "SOM",
          "Serbia" : "SRB",
          "Suriname" : "SUR",
          "Slovakia" : "SVK",
          "Slovenia" : "SVN",
          "Sweden" : "SWE",
          "Swaziland" : "SWZ",
          "Sint Maarten" : "SXM",
          "Syria" : "SYR",
          "Chad" : "TCD",
          "Togo" : "TGO",
          "Thailand" : "THA",
          "Tibet" : "TIB",
          "Tajikistan" : "TJK",
          "Turkmenistan" : "TKM",
          "East Timor" : "TLS",
          "Trinidad and Tobago" : "TTO",
          "Tunisia" : "TUN",
          "Turkey" : "TUR",
          "Taiwan" : "TWN",
          "Tanzania" : "TZA",
          "Uganda" : "UGA",
          "Ukraine" : "UKR",
          "Uruguay" : "URY",
          "United States" : "USA",
          "Uzbekistan" : "UZB",
          "Venezuela" : "VEN",
          "Vietnam" : "VNM",
          "West Bank" : "WEB",
          "Yemen" : "YEM",
          "South Africa" : "ZAF",
          "Zambia" : "ZMB",
          "Zimbabwe" : "ZWE"
        }
      }
    }
  }
```

You can use the [`colors`](#colors) option to set the color scale.

#### network

ex:

Classical Network, with all links (at least until 100k).

```javascript
      {
        "type": "network",
        "fields": [ "actors" ],
        "maxItems": 100000,
        "title": "Actors net",
        "help": "Links between actors."
      },
```

Centered Network, where only the actors "near" `Arnold Schwarzenegger` and
`Peter Weller` are visible.

```javascript
      {
        "type": "network",
        "fields": [ "actors" ],
        "maxItems": 100000,
        "title": "Arnold & Peter",
        "help": "Actors linked to Arnold Schwarzenegger and Peter Weller",
        "centerOn": ["Arnold Schwarzenegger", "Peter Weller"]
      }
```

To change the color of a node, in order to make it more visible, add a `nodes`
array, in which each element is an object with a `value` and a `color`
property. If you don't provide a color, their color will be the current one,
saturated.

```javascript
      {
        "type": "network",
        "fields": [ "actors" ],
        "maxItems": 100000,
        "threshold": 3,
        "title": "Actors net with colors",
        "help": "Network of actors, which common films are at least 3, and where Carrie Fisher is highlighed",
        "nodes": [{
          "value": "Carrie Fisher",
          "color": "#33a02c"
        }]
      }
```

You can also precise in which field the value has to be colored.

```javascript
      {
        "type": "network",
        "fields": ["actors", "director"],
        "maxItems": 100000,
        "title": "Sylvester Stallone and himself",
        "help": "A network centered on Sylvester Stallone, as director",
        "centerOn": ["Sylvester Stallone"],
        "nodes": [{
          "field": "director",
          "value": "Sylvester Stallone",
          "color": "red"
        }]
      }
```

Selected Network, where only documents matching the mongodb `selector` are
visible (using a [MongoDB Match Query Criteria](http://docs.mongodb.org/manual/reference/method/db.collection.find/#find-documents-that-match-query-criteria), but within a JSON, thus using
quotes around operators).

```javascript
      {
        "type": "network",
        "fields": [ "actors" ],
        "maxItems": 100000,
        "title": "Actors net 2000",
        "help": "Actors from films after year 2000",
        "selector": {
          "year": { "$gte": "2000" }
        }
      }
```

Threshold Network, where only links above the threshold value are displayed
(in the example: the actors linked are those who played at least in 3 films
together).

```javascript
      {
        "type": "network",
        "fields": [ "actors" ],
        "maxItems": 100000,
        "threshold": 3,
        "title": "Actors net > 3 films",
        "help": "Network of actors, which common films are at least 3"
      }
```

To display several fields in the same network, put their names in the `fields`
property:

```javascript
      {
        "type": "network",
        "fields": [ "director", "year", "title" ],
        "maxItems": 100000,
        "title": "Director, year, films",
        "help": "Network of directors, year and films"
      }
```

##### fieldsColor
You can set the color of the nodes field by field.

Example: `actors` field in green and `director` field in blue.

```javascript
      {
        "type": "network",
        "fields": ["actors", "director"],
        "maxItems": 100000,
        "title": "Actors and director colored",
        "help": "A network with actors in green and directors in blue",
        "fieldsColor": {
          "actors": "green",
          "director": "blue"
        }
      }
```

### Preferences

#### size

To specify the size of the pie, add the `size` key to your chart.
The `height` you specify is in pixels, and is used both on dashboard, and on chart pages.

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

> **Note:** `columns` and `offset` properties are taken into account only on
dashboard (index) page.

#### legend

To specify where you want the legend to be, add the `legend` key to your chart, with an object as a value.

In general, you can find what's possible in `legend` in 
[amCharts documentation](http://docs.amcharts.com/3/javascriptcharts/AmLegend).

The `position` can take 4 values:
1. 'bottom'  (default)
2. 'right'
3. 'left'
4. 'top'

Ex:

```javascript
{
  "field": "fields.Themes",
  "type": "pie",
  "legend": {
    "position": "left"
  }
}
```

If you don't want a legend, remove `legend` key from the chart.

If you need one, simply add `"legend": {}` in the chart.

```json
{
  "field": "fields.Themes",
  "type": "pie",
  "legend": {}
}
```

Or use the `enabled` property:

```json
{
  "field": "fields.Themes",
  "type": "pie",
  "legend": {
    "enabled": true
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

In a map, you can also parameter a set of colors, but you can use
[ColorBrewer](http://colorbrewer2.org/) to choose only a color scale name
(default value: "YlOrRd" -Yellow, Orange, Red-, but you can try "RdYlBu" -Red,
Yellow Blue-, or "BuGn", -Blue, Green-):

```json
{
  "dashboard": {
    "charts" : [
      {
        "field": "content.json.country",
        "type": "map",
        "colors": "OrRd"
      }
    ]
  }
}
```

Or you can use the following syntax (which allows you to add other color options):

```json
{
  "dashboard": {
    "charts" : [
      {
        "field": "content.json.country",
        "type": "map",
        "colors": {
          "scale" : "OrRd"
        }
      }
    ]
  }
}
```


You can set the type scale you want (or the distribution of the values in the
colors):

- linear: classic
- log (default value): logarithmic scale
- quantiles
- k-means

```json
{
  "dashboard": {
    "charts" : [
      {
        "field": "content.json.country",
        "type": "map",
        "colors": {
          "scale"   : "OrRd",
          "distrib" : "linear"
        }
      }
    ]
  }
}
```


#### help
You can add a helping text for a particular chart, in the `help` key:

```json
{
  "dashboard": {
    "charts": [
      {
        "field": "fields.Themes",
        "type": "pie",
        "help": "Each document may be labelled with several themes"
      }
    ]
  }
}
```

This help text is a markdown text, and will appear after the title of the page
`pages.chart.title`, and possibly after the charts' help text
`pages.chart.help`, which appear on all charts' pages.

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

The solution is to add a *document field* in the JSON configuration file,
using [JBJ](https://github.com/castorjs/node-jbj)'s syntax:

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

### Operators

By default, the charts operator is `distinct`, which count the distinct values
of one field.

There are other operators, and some of them take more than one field.

For these cases, use `operator` and `fields` keys (`fields` replaces `field`,
or you can set only one field in this table).

*Example:* to display, in an `histogram`, the total of citations (by year):

```json
{
  "fields": [
    "content.json.Tc",
    "content.json.Py"
  ],
  "type": "histogram",
  "operator": "sum_field1_by_field2",
  "title": "Citations",
  "help": "Total number of citations per year"
}
```

See [operators](OPERATORS.md).

## Documents table

In `/chart.html` pages, you can see a chart, and a table with documents. This table display the fields you chose to put in the `documentFields` key.

Here is an example, displaying `Year`, `Title`, `Authors`, and `Keywords`:

```javascript
"documentFields" : {
  "$year"   : {
    "visible": true,
    "label": "Publication Year",
    "path" : "content.json.Py"
  },
  "$title"  : {
    "visible": true,
    "label": "Title",
    "path" : "content.json.Ti"
  },
  "$authors": {
    "visible": true,
    "label": "Authors",
    "path" : "content.json.Af"
  },
  "$keywords" : {
    "visible": true,
    "label": "Keywords",
    "path" : "content.json.DiscESI"
  }
}
```

All *document fields* which `visible` key is set to `true` will be
present in the table.

By default, `visible` key value is `false`.

The `Search` field above the documents table uses a field named `text`, which
must contain the content of all fields you want to be able to search.

Ex:

```javascript
"documentFields" : {
  "$text": {
    "get" : ["content.json.Py", "content.json.Ti", "content.json.Af"],
    "join": "|"
  }
}
```

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
          "label": "Year",
          "help": "Production per year",
          "paging": false
        },
        {
          "path": "fields.Themes",
          "label": "Theme",
          "column2": "#Publi"
        }
      ]
    },
```

Here, you have a pie displaying sections, and two facets:

1. pointing to `content.json.Py`  in the document
2. pointing to `fields.Theme`  in the document

The first facet has a `help` field, which will appear as a tooltip.

The first facet won't have pagination buttons, as its `paging` field is set to
`false` (this is useful when there is only one page to display).

The second facet changes the lable of its second columns to `#Publi`, instead
of `Occ` by default.

# Document's page
## Title
To indicate the title of a document, use the `documentFields` named `$title`.

## Fields

In order to make the `/display/id.html` page work, you have to declare all the
fields you want in the document's page.

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

To change the fields column's width, use `fieldsWidth` within `display` key:

```json
{
  "display": {
    "fields": {
      "title"   : "Title",
      "year"    : "Year",
      "director": "Director",
      "vactors" : "Actors"
    },
    "fieldsWidth": "50%"
  }
}
```

Any CSS width will work. However, be aware that it is preferable to let it be responsive.

# Pages settings

Each URL of the theme may be customized:

- `title` (appears in the head of the page, and is a part of the browser's tab)
- `description` (short description of the page)
- `help` (first paragraph in the page)

For example, you may customize the `/index.html` page using:

```javascript
  "pages" : {
    "index" : {
      "title"       : "Dashboard",
      "description" : "Study Foo's dashboard",
      "help"        : "This comes from Web Of Science, and does only contain documents from Foo University."
    }
  }
```

Notice that the path for `index` settings is `pages.index`.

# Loaders

By default, this castor theme is able to load CSV files (each line being a document).

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

For example, to enable castor to load XML files, each containing several documents (in `/RDF/Topic`), use:

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

# Access restriction by login/password

If you want restrict access to your ezVIS, add an `access` key containing
`login` and `plain` or `sha1` subkeys.

Using `plain` will bypass `sha1` value.

`login` is a username.

`plain` is plain password.

`sha1` is the SHA-1 hash of the password (so that it will not be stored in the settings).

