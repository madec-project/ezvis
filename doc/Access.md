If you want restrict access to your ezVIS, add an `access` key containing
`login` and `plain` or `sha1` subkeys.

Using `plain` will bypass `sha1` value.

`login` is a username.

`plain` is plain password.

`sha1` is the SHA-1 hash of the password (so that it will not be stored in the
settings).

Example for a `pwd` value of the password:

```javascript
  "access": {
    "login": "user",
    "sha1" : "37fa265330ad83eaa879efb1e2db6380896cf639"
  }
```

> **Warning:** when you access the ezVIS report from the same machine as the
> one running the server, you will not be asked for your identity. This is
> to allow `local:///` protocol to work, even when not knowing the password
> (see [corpusFields](CorpusFields.md)).

> **Tip:** to generate a SHA1, either use a Linux commande like `sha1sum` or
> `shasum` (be careful: don't integrate any carriage return, use `^D` at the
> end of plain password), or online services like [SHA-1
> online](http://www.sha1-online.com/)
