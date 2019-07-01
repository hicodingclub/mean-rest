# mean-rest
Middleware and tools for Restful API based MEAN stack (MongoDB, Express.js, AngularJS or Angular, and Node.js) end to end web development. 

It composes of two modules: **mean-rest-express** for the back end and **mean-rest-angular** for the front end.

Both modules take the single input from the Mongoose schema you defined, and generate Restful API for express on the fly (by mean-rest-express), and generate Angular boilerplate code with ready-to-use UIs (by mean-rest-angular).


```

                 |------  mean-rest-express --------> Express REST API
                 |
   Schema / Views  
                 |
                 |------  mean-rest-angular --------> Angular Modules

```

## 1. Quick Start

### 1.1 Schema and View Definition

- Define your Mongoose schema and views in "blog.js"

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema definition
const blogSchema = new Schema({
    title:  String,
    author: String,
    body:   String,
    date: { type: Date, default: Date.now }
});
// Define views for query(blogBrief, blogDetail), create (blogCreate), Update (blogEdit), and Search (blogSearch)
const blogBrief = "title author date";		//The fields showed in the list view of the document
const blogDetail = "title author body date";	//The fileds that show when reviewing the details of the document
const blogCreat = "title body";			//The fields that show in 'Create' view
const blogEdit = "title body";			//The editable fields show in 'Edit' view
const blogSearch = "title author body date";	//Future use
const blogIndex = "title";			//The field that is used as the index of the document viewable in front end

// 1. put schema definition together:
const blogSchemaDef = {
    schema: blogSchema,
    views: [blogBrief, blogDetail, blogCreat, blogEdit, blogSearch, blogIndex],
    name: 'Blog', //Optional. The name on front end UI
}
// 2. Configuration of all schema definition and generation:
const config = {
  dateFormat: "MM-DD-YYYY",
  timeFormat: "hh:mm:ss",
}
// 3. Authorization definition of the schemas
const authz = {
  "module-authz": {"LoginUser": 'R', "Anyone": ""},
  "blog": {"LoginUser": 'CRUD', "Anyone": "R"},
}

//Export the views so mean-rest-express and mean-rest-angular can use
module.exports = {
    schemas: {
        "blog": blogSchemaDef
    },
    config,
    authz,
};
```
### 1.2 Create Express Router for above schema and views in "app.js"

- Install mean-rest-express to your project:

```
$ npm install mean-rest-express
```

- Use mean-rest-express in your code:

```javascript
const blog = require('./blog');

const meanRestExpress = require('mean-rest-express');
const blogRouter = meanRestExpress.RestRouter(blog);

app.use('/', blogRouter);
```

### 1.3 Generated APIs:
Now you can access the Blog with following REST APIs:

  + GET /blog/   -- list of blogs with Brief View
  + GET /blog/:id  -- get details of a blog (Detail View)
  + PUT /blog/ - -create a new blog, with information in the Create View
  + POST /blog/:id -- update a blog, with information in the Edit View
  + DELETE /blog/:id -- delete a blog

### 1.4 Generated Angular Front End for above schema:
Use mra tool to generated front end code (to be added).

## 2. Schema Definition
- Schema definition has the following format:
```
    {
        schema: <Schema>,
	views: [<brief view>, <detail view>, <create view>, <edit view>, <search fields>, <index field>],
	name: <Viewable Name>,
	patch: [<pre-defined extra field 1>, <pre-defined extra field 2>, ...],
	ebmeddedViewOnly: <true | false>,
	api: <supported APIs in string format, eg: "LCRUD">,
	validators: <validator object>
	mraUI {
		detailType: 'post', //use the post view in detailed page
		listViewType: 'list', // list, table, or grid
	},
    }
```


### 2.1 schema
- A mongoose schema object, with some extentions

###### Extentions:

- editor: used in a string field to change the field to a rich editor in front end UI

```
const blogSchema = new Schema({
    ...
    body:   { type: String, editor: true, required: true, minlength: 20 },
    ...
});
```

- mraType: it has the following values:
	- 'picture': used in a string field to indicate the field will store the URL of a picture
	- 'file': used in a string field to indicate the field will store the URL of a file

```
const person = new Schema({
    ...
    photo:   { type: String, mraType: 'picture', required: true },
    ...
});
```

### 2.2 views

- A string array, with each string containing a list of fields showing under different views:
	- <brief view>: 	The fields showed in the list view of the document
	- <detail view>:	The fileds that show when reviewing the details of the document
	- <create view>:	The fields that show in 'Create' view
	- <edit view>:		The editable fields show in 'Edit' view
	- <search fields>:	Future use
	- <index field>:	The field that is used as the index of the document viewable in front end

###### Special Formats:

- Grouping: Usie "|" to seperate fields into different groups. Grouping makes several fields to show in a single line in front end UI.
```
...
const teacherDetail = "firstName lastName | email | phoneNumber  courses | introduction | photo";
...
const views = [teacherBrief, teacherDetail, teacherCreat, teacherEdit, teacherTextSearch, teacherIndex]

```

- Hide:	use "()" to hide the field from showing in UI
```
...
var Brief = "question answer (order)";
...
var views = [Brief, Detail, Creat, Edit, TextSearch, Index]
```

### 2.3 name

- Optional.
- The viewable name of the defined schema in fornt end UI.

### 2.4 patch

- Optional
- A list of extra predefined fields that will be added to the schema when creating the document.
- Currently the allowable pre-defined fields are:

```
const PredefinedPatchFields = {
  muser_id: { type: String, index: true},
  mmodule_name: { type: String, index: true},
};
```
### 2.5 owner

- optional
- enable the ownership of the schema. Owner type could be: user, and module.

```
  owner: {enable: true, type: 'module'},
```

### 2.6 ebmeddedViewOnly

- Optional. Default: false
- All views for this schema are embedded. Usually used for association of two schemas.

### 2.7 api

- Optional. Default: 'LCRUD'
- A list of supported APIs for this schema
	- L: list all documents
	- C: create a new document
	- R: read details of a document
	- U: update a document
	- D: delete a document

### 2.8 validators

- Optional
- validator object in the format of:
```
  {
    <'field 1'>: [
      {
        validator: <validator function 1 for field 1>,
	msg: <message if validation fails>,
      },
      {
        validator: <validator function 1 for field 1>
	msg: <message if validation fails>,
      },
      ...
    ],
    ... 
  }
```
- Example:

```
function validator1(str) {
	if (!str) return true;
	if (str.length < 5) return false;
}
function validator2(str) {
	if (!str) return true;
	if (str.length > 10) return false;
}
function validator3(number) {
	//integer
	if (number === parseInt(number, 10)) return true;
	return false;
}
const blog2Validators = {
	"name": [
		{validator: validator1, msg: "Name must not be less than 5 characters."},
		{validator: validator2, msg: "Name must not be greater than 10 characters."},
	],
	"age": [
		{validator: validator3, msg: "Age must be an integer."}
	]
};
```

### 2.9 mraUI

- optional
- this configuration controls the UI generation. It has the following attributes:
	- detailType: type of detailed view. 'normal', or 'post'.
		- 'normal': show detailed information line by line, with index fields as the title.
		- 'post': detailView shall be defined in "signaturePicture title author publishDate content" sequence. It will be shown as a post.
		- 'info': detailView shall be defined in "signaturePicture title content" sequence. It will be shown as titled information, with picture if provided..
		- 'slide': detailView shall be defined in "signaturePicture title subtitle description" sequence. It will be shown as picture in the background and other info on top of the picture.
		
	- listType: type of the list view. 'table', 'list', or 'grid'
		- table
		- list
		- grid
	- listToDetail: how to transit from list to detail view:
		- 'click'
		- 'link'
	- defaultListSort: how to sort the list. An object with the key as the sorting field, and the value is 'asc', or 'desc'.
	```
		defaultListSort: {last_name: 'asc'}
	```
	- homeListNumber: number of items to show in the 'home' list view
	- detailPipelines: add extra button in detailed view, which will trigger the given pipeline
	```
		detailPipelines: [["Enroll", "/pipeline/register-class"]],
	```
## 3. System Configuration
- Schema configuration has the configurations that applies to all schema. It has the following format:
```
const config = {
  dateFormat,
  timeFormat,
  patch: ['mmodule_name'], // extra fields to patch to all schemas
  owner: {enable: true, type: 'module'},
  fileServer: {
    uploadUrl: '/api/files/upload',
    downloadUrl: '/api/files/download'
  }
};
```
### 3.1 dateFormat and timeFormat

Defines what date and time format to show on UI. Examples are:
```
const dateFormat = 'MM/DD/YYYY';
const timeFormat = 'hh:mm:ss';
```

### 3.2 patch
See 2.4
### 3.2 owner
See 2.5
### 3.3 fileServer
File server urls that upload and download files used by the 'file' field in the schema (field with mraType defined as 'file').

## 4. Authorization Definition

```
const authz = {
  "module-authz": {"LoginUser": 'R', "Anyone": ""},
  "Class": {"LoginUser": '', "Anyone": "R"},
}
```

## 5. mean-rest-express
## 6. mean-rest-angular
## 7. mean-rest-angular-cli
## 8. Server auth module
## 9. Client auth module
## 10. File Server
## 11. Client file uploading



