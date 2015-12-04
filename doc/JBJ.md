[JBJ](http://jbj.readthedocs.org/) is the syntax used to configure fields, and
treat results of [operators](Operators.md) in the [dashboard](Dashboard.md)
charts ([histogram](Histogram.md), [horizontalbars](HorizontalBars.md),
[pie](Pie.md), [map](Map.md), and [network](Network.md)).

See the whole documentation of JBJ at
[ReadTheDocs](http://jbj.readthedocs.org/) or at
[GitHub](https://github.com/Inist-CNRS/node-jbj).

However, there is a trick included in ezVIS, to facilitate the building of
fields, or of charts configuration: set `addlinkstojbj` to `true`.
This is intented to be used during configuration time, not production time.
A link to [JBJ Playground](http://Inist-CNRS.github.io/jbj-playground/) will be proposed, with the input area already filled in with the data used in the pages where the button appear.

To access the same part as what is in a record (in `documentFields`), you need
to select the `data` part of the input JSON. So, begin with this
stylesheet:

```json
{
    "get": "data"
}
```

Make sure you set `addlinkstojbj` to `false` before deploying in production environment (or simply remove the key from the [configuration file](ConfigurationFile.md)).
