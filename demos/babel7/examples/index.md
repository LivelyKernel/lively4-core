# Examples and Test for our Babel7 Migration

Why are we not using Tests here? Because this would add another layer of indirection and won't allow us to the if it works in the actual system, e.g. these here are integration tests of Babel7 in Lively4. 

Testing our Babel7 migration relies on a lot of context and a lot of configuration files. The the individual parts work, has been shown by their Unit Tests etc, but we use these files here as feedback if the configuration and our usage of those works. We see if the complex system works by automatically probing inner parts. 