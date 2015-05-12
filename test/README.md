# TESTS

## Requirements

### dalekjs

```bash
$ npm install dalek-cli -g
$ npm install -d
```

## How to launch tests

Each dataset has its own test file.

ex: `test/dataset/data1` has its configuration file `test/dataset/data1.json` and its test file: `test/test1.js`

To run a test, you need:

1. run ezvis on the matching dataset (and wait for files to be synchronized)
2. launch dalek on the test

Ex:

```bash
$ node cli test/dataset/data1
```

and in another session:

```bash
$ dalek test/test1.js
```
