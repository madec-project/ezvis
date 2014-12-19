# OPERATORS

Operators allow different treatments on the data.

They can be used explicitly in apps' configuration (such as in the charts of
[VISIR](https://github.com/castorjs/visir)), or under the hood.

They can be used in URL such as: http://localhost:3000/compute.json?o=operator
and their parameters are fields (`f`).

## sum_field1_by_field2

`sum_field1_by_field2` sums a numeric field (field1), grouped by the values of
another field (field2).

As its name suggests, this operator needs two fields as parameters, and their
order is significant.

Ex: to sum the citation field of all documents, grouped year field:

http://localhost:3000/compute.json?o=sum_field1_by_field2&f=content.json.citation&f=content.json.year&itemsPerPage=

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
TODO

## catalog
TODO

## count
TODO

## distinct
TODO

## graph
TODO

## total
TODO

## ventilate
TODO
    