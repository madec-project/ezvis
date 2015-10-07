By default, the charts operator is [`distinct`](#distinct), which count the distinct values of one field.

There are other operators, and some of them take more than one field.

For these cases, use `operator` and `fields` keys (`fields` replaces `field`,
or you can set only one field in this table).

*Example:* to display, in an [`histogram`](Histogram.md), the total of citations (by year):

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

Operators allow different treatments on the data.

They can be used explicitly in apps' configuration (such as in the charts of
ezVIS), or under the hood.

They can be used in URL such as:
`http://localhost:3000/-/v2/compute.json?o=operator` and their parameters are
fields (`f`).

List:

- [sum_field1_by_field2](#sum_field1_by_field2)
- [count_field1_by_field2](#count_field1_by_field2)
- [catalog](#catalog)
- [count](#count)
- [distinct](#distinct)
- [graph](#graph)
- [total](#total)
- [ventilate](#ventilate)

## sum_field1_by_field2

`sum_field1_by_field2` sums a numeric field (field1), grouped by the values of
another field (field2).

As its name suggests, this operator needs two fields as parameters, and their
order is significant.

Ex: to sum the citation field of all documents, grouped year field:

`http://localhost:3000/-/v2/compute.json?o=sum_field1_by_field2&f=content.json.citation&f=content.json.year&itemsPerPage=`

will return a JSON containing data similar to:

```javascript
data: [
  {
    _id: "2009",
    value: 10141
  },
  {
    _id: "2010",
    value: 6694
  },
  {
    _id: "2011",
    value: 3809
  },
  {
    _id: "2012",
    value: 2666
  }
]
```

(`itemsPerPage` limits the number of year returned, and `0` means all)

> **Note:** versions 6.8.0 and previous ones used URL like `http://localhost:3000/-/v2/compute.json?o=sum_field1_by_field2&f=content.json.citation&f=content.json.year&itemsPerPage=` (without `-/v2/` at the beginning).

## count_field1_by_field2
`count_field1_by_field2` counts the different values of a field `field1` when they co-occur with the values of another field `field2`.

As its name suggests, this operator needs two fields as parameters, and their
order is significant.

Ex: to count different sections by year:

`http://localhost:3000/-/v2/compute.json?o=count_field1_by_field2&f=fields.Section&f=content.json.year&itemsPerPage=`

will return a JSON containing data similar to:

```javascript
data: [
  {
    _id: "2009",
    value: {
      SIC: 614,
      OSU: 564,
      TS: 84,
      OA: 66,
      AA: 3
    }
  },
  {
    _id: "2010",
    value: {
      SIC: 676,
      OSU: 615,
      TS: 109,
      OA: 71,
      AA: 1
    }
  },
  {
    _id: "2011",
    value: {
      SIC: 570,
      OSU: 523,
      OA: 85,
      TS: 105,
      AA: 3
    }
  },
  {
    _id: "2012",
    value: {
      SIC: 672,
      OSU: 624,
      OA: 92,
      AA: 3,
      TS: 99
    }
  }
]
```

## catalog
TODO

## count
`count` counts (!) the number of occurrences of a field in all documents.

Often used to count the number of documents in the corpus (using the `wid`
identifier, which is always present in the records of the database via
[http://localhost:3000/-/v2/compute.json?operator=count&field=wid](http://localhost:3000/-/v2/compute.json?operator=count&field=wid)).

Ex: `http://localhost:3000/-/v2/compute.json?operator=count&field=wid`

return JSON similar to:

```json
{
  "recordsFiltered": 1,
  "recordsTotal": 1,
  "data": [{
    "_id": "wid",
    "value": 29
  }]
}
```

## distinct
`distinct` count the distinct values of a field.

Ex: count the number of documents by year.

`http://lcoalhost:3000/-/v2/compute.json?o=distinct&f=content.json.year&itemsPerPage=`

return JSON data similar to:

```javascript
[
  {
    _id: "2009",
    value: 614
  },
  {
    _id: "2010",
    value: 676
  },
  {
    _id: "2011",
    value: 570
  },
  {
    _id: "2012",
    value: 672
  }
]
```

## graph

`graph` lists the weighted links between all values of one or several fields (it's a non-directed, weighted link). The weight is the number of times two fields' value appear in the same document.

Ex: graph of themes co-occurrences

`http://localhost:3000/-/v2/compute.json?o=graph&f=fields.Themes&itemsPerPage=`

return JSON `data` similar to:

```javascript
[
  {
    _id: "[{"fields.Themes":"Agricultural Sciences"},{"fields.Themes":"Chemistry"}]",
    value: 6
    },
  {
    _id: "[{"fields.Themes":"Agricultural Sciences"},{"fields.Themes":"Clinical Medicine"}]",
    value: 1
  },
  {
    _id: "[{"fields.Themes":"Agricultural Sciences"},{"fields.Themes":"Computer Science"}]",
    value: 1
  },
  ...
  {
    _id: "[{"fields.Themes":"Pharmacology & Toxicology"},{"fields.Themes":"Plant & Animal Science"}]",
    value: 10
  },
  {
    _id: "[{"fields.Themes":"Pharmacology & Toxicology"},{"fields.Themes":"Social Sciences"}]",
    value: 1
  },
  {
    _id: "[{"fields.Themes":"Physics"},{"fields.Themes":"Space Science"}]",
    value: 1
  },
  {
    _id: "[{"fields.Themes":"Plant & Animal Science"},{"fields.Themes":"Psychiatry/Psychology"}]",
    value: 1
  },
  {
    _id: "[{"fields.Themes":"Plant & Animal Science"},{"fields.Themes":"Social Sciences"}]",
    value: 2
  }
]
```

Ex: graph of themes and year co-occurrences

`http://localhost:3000/-/v2/compute.json?o=graph&f=fields.Themes&f=fields.year&itemsPerPage=`

return JSON `data` similar to:

```javascript
[
  ...
  {
    _id: "[{"fields.Themes":"Agricultural Sciences"},{"fields.Themes":"Physics"}]",
    value: 1
  },
  {
    _id: "[{"fields.Themes":"Agricultural Sciences"},{"fields.Themes":"Plant & Animal Science"}]",
    value: 19
  },
  {
    _id: "[{"fields.Themes":"Agricultural Sciences"},{"fields.year":"2009"}]",
    value: 30
  },
  {
    _id: "[{"fields.Themes":"Agricultural Sciences"},{"fields.year":"2010"}]",
    value: 33
  },
  ...
  {
    _id: "[{"fields.Themes":"Plant & Animal Science"},{"fields.Themes":"Psychiatry/Psychology"}]",
    value: 1
  },
  {
    _id: "[{"fields.Themes":"Plant & Animal Science"},{"fields.Themes":"Social Sciences"}]",
    value: 2
  },
  {
    _id: "[{"fields.Themes":"Plant & Animal Science"},{"fields.year":"2009"}]",
    value: 87
  },
  {
    _id: "[{"fields.Themes":"Plant & Animal Science"},{"fields.year":"2010"}]",
    value: 77
  },
  ...
]
```


## total
`total` operator apply the `+` operator to all the occurrences of the specified field.

> **Warning:** if the field has a string format, `+` will only concatenate the
>              strings, not add the number they may contain.

## ventilate
TODO
