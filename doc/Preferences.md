## size

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

## legend

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


## color
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

## colors
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


## help
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
