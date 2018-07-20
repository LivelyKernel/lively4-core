<style>
p {
  max-width: 800px;
  text-align: justify;
}
</style>

# Implementation
<strong>VivideJS</strong> is an adaptation of the [Vivide](http://www.hpi.uni-potsdam.de/hirschfeld/publications/media/TaeumelSteinertHirschfeld_2012_TheVivideProgrammingEnvironment_AcmDL.pdf) developed in Smalltalk, which is an object-oriented UI. It aims to provide insights into processed data in a task-oriented way. Therefore, the UI provides tools to manipulate data and the corresponding dataflow. The major difference between the two implementation is, that VivideJS is part of a live programming environment in the web. It can access data from all different kinds of online resources ranging from project management tools like [Trello](https://trello.com/), over data storage solutions like [Dropbox](https://www.dropbox.com/de/), to version control hosting service like [GitHub](https://github.com/). Most of these tools can only be accessed via asynchronous requests, thus VivideJS needs to provides the functionality to request and process resources asynchronously.

The existing implementation was limited to processing data lists without handling any hierarchy information, further more no asynchronous data processing was implemented. The proposed architecture and its corresponding implementation allow the user to explore hierarchies of asynchronous web-requests and data. 

- Used existing: View, Widget
- Introduced: Script, Layer, Object, TreeWidget


## Architecture

## Features
- Features: Children

## VivideLayer & VivideObjects

## Scripts as List vs Array/JsonObject

# Limitations
- only a few widgets
- no streaming supported (async/await implemented, but no real asynchronity)



# TODO
- Annahmen,
- Vorgehensweise,
- verwendete Literatur,
- eine Diskussion des Artefaktes (Funktionsweise und Implementierung)
- Einschränkungen/Grenzen des gewählten Ansatzes
