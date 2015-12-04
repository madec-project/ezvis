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

`$year` indicates to create a `year` property at the document's root (or a
[variable](https://github.com/Inist-CNRS/node-jbj#variables), in JBJ's
terminology), and the [`get` JBJ action](https://github.com/Inist-CNRS/node-jbj#get)
points to the location of the source field in the same document.

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

> **Note 3:** the '$?' [source](https://github.com/castorjs/node-jbj#source)
is available in `documentFields` (but only with the `http:` protocol).

## text

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

## nosave

The `nosave` property of a variable prevents its value to be saved in the
document.
This is useful for external resources, like `http:` or `local:` protocols.

```json
    "$country2iso": {
      "nosave": true,
      "$?" : "http://localhost:35000/country2iso3.json",
      "parseJSON": true
    },
    "$codes": {
      "mappingVar": ["country","country2iso"]
    },
```

However, the field is available to other `documentFields`.
