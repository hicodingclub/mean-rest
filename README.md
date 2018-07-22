# mean-rest
Middleware and tools for Restful API based MEAN stack (MongoDB, Express.js, AngularJS or Angular, and Node.js) end to end development. 

It composes of two compoments: mean-rest-express for the back end and mean-rest-angular for the front end.

Both compoments take the single input from the Mongoose schema you defined, and generate Restful API for express on the fly (mean-rest-express), and generate Angular boilerplate code with ready-to-use UIs.



                 |------  mean-rest-express --------> Express REST API
                 |
   Schema / Views  
                 |
                 |------  mean-rest-angular --------> Angular Modules
## mean-rest-express
Usage:
- Install mean-rest-express to your project
```
$ npm install mean-rest-express
```
- Define your Mongoose schema and views in "blog.js"

```javascript
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Schema definition
var blogSchema = new Schema({
    title:  String,
    author: String,
    body:   String,
    date: { type: Date, default: Date.now }
});
//Define views for query(blogBrief, blogDetail), create (blogCreate), Update (blogEdit), and Search (blogSearch)
var blogBrief = "title author date";
var blogDetail = "title author body date";
var blogCreat = "title body"
var blogEdit = "title body"
var blogSearch = "title author body date"
//Export the views so mean-rest-express and mean-rest-angular can use
module.exports.views = {
	"blog": [blogSchema, blogBrief, blogDetail, blogCreat, blogEdit, blogSearch]
};
```
- Create Express Router for above schema and views in "app.js"

```javascript
var blog = require('./blog');

var meanRestExpress = require('mean-rest-express');
var blogRouter = meanRestExpress.RestRouter(blog.views);

app.use('/', blogRouter);
```
- Now you can access the Blog with following REST APIs:
  + GET /blog/   -- list of blogs with Brief View
  + GET /blog/:id  -- get details of a blog (Detail View)
  + PUT /blog/ - -create a new blog, with information in the Create View
  + POST /blog/:id -- update a blog, with information in the Edit View
  + DELETE /blog/:id -- delete a blog

## mean-rest-angular
