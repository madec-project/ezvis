`flying` indicates to a chart that you want to apply the JBJ actions of the
said `flyingFields` to the data elements returned by the [operator](Operators.md).

Often, the operator will return a JSON page containing at least:

```json
{

  "recordsTotal": 108,
  "recordsFiltered": 108,
  "data": [
    {
      "_id": "Albania",
      "value": 2
    },
    {
      "_id": "Algeria",
      "value": 15
    }
  ]
}
```

If you declared a `flyingFields` like:

```json
    "$country2iso": {
      "$_id": {
        "get": "_id",
        "mapping": {
          "Albania": "ALB",
          "Algeria": "DZA"
        }
      },
      "mask": "_id,value"
    }
```

and added a `flying` key to the chart, and its value was `country2iso`, then
the data projected to the chart will be the previous `data`, treated by
`country2iso`:

```json
{

  "recordsTotal": 108,
  "recordsFiltered": 108,
  "data": [
    {
      "_id": "ALB",
      "value": 2
    },
    {
      "_id": "DZA",
      "value": 15
    }
  ]
}
```
