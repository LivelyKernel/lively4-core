# Stories

- adapting tools while using them (see #Lincke2014ETC)



# Lincke2014ETC

- Evolving Tools in a Collaborative Self-supporting Development Environment
  - "Adapting and developing software tools, to fit them to the task at hand while being used, is the domain of end-user development (EUD). Unlike EUD, the programming tools of a general-purpose development environment cannot usually be adapted in a live and interactive way. However, there are exceptions. The combined development and run-time environments of languages, such as Lisp and Smalltalk, allow modifying applications, but also adapting the development environments themselves at run-time. This self-supporting development approach shortens feedback loops and makes the development style interactive and explorative. Lively Kernel is a Smalltalklike self-supporting development environment in the Web-browser, which allows Web-applications to be developed in such a lively way. Since the environment is shared, the feedback cycles among collaborating users are also shortened. Therefore, a Lively Kernel-based wiki allows the development, sharing, and reuse of each other's creations in an environment which evolves while being used."
  - "Because of computational reflection and meta-circularity, developing in a self-supporting environment inherently has the danger of breaking one's own tools, which is more severe in a shared environment since changes can and often do affect more than a single user. Therefore, developers should have the means to change their system at run-time, to try out changes, and share new features or tool adaptations with others in a controlled way."
  - "To address this, we developed two approaches: first, we propose to develop tools as run-time-modifiable parts that can be cloned to safely change them. Adapted tools can then be shared via a parts bin, so that they can be collaboratively developed. Second, we propose to modularize changes to the base system via layers that can be scoped, depending on the execution context, to make the development of the base system safer at run-time by reducing the risk of tools breaking themselves. Furthermore, layers can be used to share such changes in a wiki-like collaboration setting."
  - "We implemented our approach in Lively Webwerkstatt, a collaborative, self-supporting development environment based on Lively Kernel. Its programming tools are developed as malleable parts that are shared via a parts bin. Deep cloning makes evolving tools safe and also allows alternative ideas to be tried out side by side in the running system. Development layers are implemented using ContextJS, our context-oriented JavaScript language extension, which supports domain-specific scoping strategies, that allow restraining behavioral adaptations not only to the dynamic extent  of an execution, but also structurally to object composition hierarchies."
  - "We present example artifacts and analyze the repository data of Webwerkstatt, in order to discuss and evaluate our approach. Webwerkstatt has been actively used for more than three years now---not only by a small group of core developers, but also by external users, including our students, for whom it has served as a shared development environment. During this time, its users successfully worked on their projects, adapted tools, and also helped to evolve Lively Webwerkstatt itself."
 
  

