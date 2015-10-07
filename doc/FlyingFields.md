Once in a while, you need to combine a `corpusField` and a `documentField` (to
normalize a value, or to use reference table in a `corpusField`).

`flyingFields` are like `documentFields`, except that they are computed just in
time, thus they can interoperate with `corpusFields`.

> **Warning:** if you have a `corpusFields` with the same name as a
> `documentFields`, one of them will be replaced by the other.
> So don't name them the same way.

A `flyingField` can be seen as a post-treatment (written in JBJ) applicable
through the use of a compute [operator](Operators.md) on a specific field. The
URL begins with `/-/v2/compute.json?operator=` followed by the operator name (often
`distinct`), followed by `&field=` and by a field name. Then you can add
`&flying=` and the name of the `flyingField`.

Example where you replace the name of a country by the ISO code of the
country, using an external table.

If you have a `documentFields` named `country`:

```json
{
  "documentFields": {
    "country": {
      "get": "content.json.countries",
      "parseCSV": ";",
      "foreach": {
        "trim": true
      }
    }
  }
}
```

And a `corpusFields` containing a matching table from a external URL:

```json
{
  "corpusFields": {
    "$country2iso": {
      "$?" : "http://external.domain.org/country2iso3.json",
      "parseJSON": true
    }
  }
}
```

where the `country2iso3.json` file contains some keys like (that's what the
URL in `$?` returns):

```json
{
  "Albania": "ALB",
  "Algeria": "DZA",

  "Zaire": "COD",
  "Zambia": "ZMB"
}
```

The `distinct` operator on `country` `documentFields` will be called with 
http://localhost:3000/-/v2/compute.json?operator=distinct&field=country:

```json
{

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

With a `country2isoTreatment` `flyingFields`:

```json
{
  "flyingFields": {
    "$country2isoTreatment": {
      "$_id": {
        "combine" : ["_id", "country2iso"]
      },
      "mask": "_id,value"
    }
  }
}
```

which `combine` (or `mappingVar`) the `_id` given by the operator and the
`country2iso` `corpusFields`, and then mask all `corpusFields` and other
fields, to only keep `_id` and `value`, the previous URL can be added with
`&flying=country2isoTreatment` to give:

```json
{

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

> **Note:** versions 6.8.0 and previous ones used URL like `http://localhost:3000/-/v2/compute.json?o=sum_field1_by_field2&f=content.json.citation&f=content.json.year&itemsPerPage=` (without `-/v2/` at the beginning).
