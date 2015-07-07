Each URL may be customized:

- `title` (appears in the head of the page, and is a part of the browser's tab)
- `description` (short description of the page)
- `help` (first paragraph in the page)

For example, you may customize the `/index.html` page using:

```javascript
  "pages" : {
    "index" : {
      "title"       : "Dashboard",
      "description" : "Study Foo's dashboard",
      "help"        : "This comes from Web Of Science, and does only contain documents from Foo University."
    }
  }
```

Notice that the path for `index` settings is `pages.index`.
