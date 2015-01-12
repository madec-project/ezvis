# OPERATORS

Operators allow different treatments on the data.

They can be used explicitly in apps' configuration (such as in the charts of
[VISIR](https://github.com/castorjs/visir)), or under the hood.

They can be used in URL such as:
`http://localhost:3000/compute.json?o=operator` and their parameters are
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

`http://localhost:3000/compute.json?o=sum_field1_by_field2&f=content.json.citation&f=content.json.year&itemsPerPage=`

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

## count_field1_by_field2
`count_field1_by_field2` counts the different values of a field `field1` when they co-occur with the values of another field `field2`.

As its name suggests, this operator needs two fields as parameters, and their
order is significant.

Ex: to count different sections by year:

`http://localhost:3000/compute.json?o=count_field1_by_field2&f=fields.Section&f=content.json.year&itemsPerPage=`

will return a JSON containing data similar to:

```javascript
data: [
  {
    _id: "2011",
    value: {
      SIC: 570,
      OSU: 523,
      TS: 105,
      OA: 85,
      AA: 3
    }
  },
  {
    _id: "2012",
    value: {
      SIC: 672,
      OSU: 624,
      TS: 99,
      OA: 92,
      AA: 3
    }
  },
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
  }
]
```

## catalog
TODO

## count
TODO

## distinct
`distinct` count the distinct values of a field.

Ex: count the number of documents by year.

`http://lcoalhost:3000/compute.json?o=distinct&f=content.json.year&itemsPerPage=`

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
TODO

## total
`graph` lists the weighted links between all values of one or several fields (it's a non-directed, weighted link). The weight is the number of times two fields' value appear in the same document.

Ex: graph of themes co-occurrences

`http://localhost:3000/compute.json?o=graph&f=fields.Themes&itemsPerPage=`

return JSON data similar to:

```javascript
[
  {
    source: "Agricultural Sciences",
    target: "Chemistry",
    weight: 6
  },
  {
    source: "Agricultural Sciences",
    target: "Clinical Medicine",
    weight: 1
  },
  {
    source: "Agricultural Sciences",
    target: "Computer Science",
    weight: 1
  },
  ...
  {
    source: "Pharmacology & Toxicology",
    target: "Plant & Animal Science",
    weight: 10
  },
  {
    source: "Pharmacology & Toxicology",
    target: "Social Sciences",
    weight: 1
  },
  {
    source: "Physics",
    target: "Space Science",
    weight: 1
  },
  {
    source: "Plant & Animal Science",
    target: "Psychiatry/Psychology",
    weight: 1
  },
  {
    source: "Plant & Animal Science",
    target: "Social Sciences",
    weight: 2
  }
]
```

## ventilate
TODO
