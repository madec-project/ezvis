corpusFields are computed after documents loading/synchronizing.

They are used to compute metrics on the whold corpus (hence, the name).

For example, to get the number of documents in the corpus:

```javascript
  "corpusFields": {
    "$filmsNb": {
      "visible": true,
      "label"  : "films",
      "icon"   : "hand-o-right",
      "$?"       : "local:///-/v2/compute.json?operator=count&field=wid",
      "parseJSON": true,
      "get"      : "data.0.value",
      "cast"     : "number"
    },
```

The `filmsNb` corpusFields above is `visible` on the dashboard page, the
`label` displayed after its value is "films", the `icon` at its left is a
[`hand-o-right`](http://fortawesome.github.io/Font-Awesome/icon/hand-o-right/)
from [font-awesome](http://fortawesome.github.io/Font-Awesome/icons/).

From `"$?"` on, the properties are [JBJ actions](https://github.com/Inist-CNRS/node-jbj#actions).

That `"$?"` action (with `local:` protocol) means that the remaining actions
will be applied to the result of the `/compute` route of ezvis, using the
[`count` operator](https://github.com/madec-project/ezvis/blob/master/Operators.md#count)
on the `wid` field.

It's a [source](https://github.com/Inist-CNRS/node-jbj#source) using the
`local` protocol, which is a shortcut to `http://localhost:port` (useful
because the port number is not always known before the launch of the server).
This one could return a page like:

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
    pathname: "/-/v2/compute.json",
    path: "/-/v2/compute.json?operator=count&field=wid",
    href: "http://localhost:3000/-/v2/compute.json?operator=count&field=wid"
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

> **Tip:** You can transform a `local:///-/v2/compute.json?operator=count&field=wid` into
> `http://localhost:3000/-/v2/compute.json?operator=count&field=wid` and copy-paste
> its content into the input area of the  [JBJ Playground](http://Inist-CNRS.github.io/jbj-playground/), and try to enter in the
> stylesheet area the JBJ actions you want to test, and click "Try it" to see if
> the result matches what you want in the corpusField.

> **Note:** versions 6.8.0 and previous ones used URL like
> `http://localhost:3000/-/v2/compute.json?operator=count&field=wid`
> (without `-/v2/` at the beginning). This applies to `local:///` protocol
> too.
