///<reference path="handledisconnected.ts"/>
///<reference path="geom.ts"/>
///<reference path="descent.ts"/>
///<reference path="powergraph.ts"/>
///<reference path="linklengths.ts"/>
///<reference path="shortestpaths.ts"/>
/**
 * @module cola
 */
var cola;
(function (cola) {
    /**
     * The layout process fires three events:
     *  - start: layout iterations started
     *  - tick: fired once per iteration, listen to this to animate
     *  - end: layout converged, you might like to zoom-to-fit or something at notification of this event
     */
    (function (EventType) {
        EventType[EventType["start"] = 0] = "start";
        EventType[EventType["tick"] = 1] = "tick";
        EventType[EventType["end"] = 2] = "end";
    })(cola.EventType || (cola.EventType = {}));
    var EventType = cola.EventType;
    ;
    function isGroup(g) {
        return typeof g.leaves !== 'undefined' || typeof g.groups !== 'undefined';
    }
    /**
     * Main interface to cola layout.
     * @class Layout
     */
    var Layout = (function () {
        function Layout() {
            var _this = this;
            this._canvasSize = [1, 1];
            this._linkDistance = 20;
            this._defaultNodeSize = 10;
            this._linkLengthCalculator = null;
            this._linkType = null;
            this._avoidOverlaps = false;
            this._handleDisconnected = true;
            this._running = false;
            this._nodes = [];
            this._groups = [];
            this._rootGroup = null;
            this._links = [];
            this._constraints = [];
            this._distanceMatrix = null;
            this._descent = null;
            this._directedLinkConstraints = null;
            this._threshold = 0.01;
            this._visibilityGraph = null;
            this._groupCompactness = 1e-6;
            // sub-class and override this property to replace with a more sophisticated eventing mechanism
            this.event = null;
            this.linkAccessor = {
                getSourceIndex: Layout.getSourceIndex,
                getTargetIndex: Layout.getTargetIndex,
                setLength: Layout.setLinkLength,
                getType: function (l) { return typeof _this._linkType === "function" ? _this._linkType(l) : 0; }
            };
        }
        // subscribe a listener to an event
        // sub-class and override this method to replace with a more sophisticated eventing mechanism
        Layout.prototype.on = function (e, listener) {
            // override me!
            if (!this.event)
                this.event = {};
            if (typeof e === 'string') {
                this.event[EventType[e]] = listener;
            }
            else {
                this.event[e] = listener;
            }
            return this;
        };
        // a function that is notified of events like "tick"
        // sub-class and override this method to replace with a more sophisticated eventing mechanism
        Layout.prototype.trigger = function (e) {
            if (this.event && typeof this.event[e.type] !== 'undefined') {
                this.event[e.type](e);
            }
        };
        // a function that kicks off the iteration tick loop
        // it calls tick() repeatedly until tick returns true (is converged)
        // subclass and override it with something fancier (e.g. dispatch tick on a timer)
        Layout.prototype.kick = function () {
            while (!this.tick())
                ;
        };
        /**
         * iterate the layout.  Returns true when layout converged.
         */
        Layout.prototype.tick = function () {
            if (this._alpha < this._threshold) {
                this._running = false;
                this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
                return true;
            }
            var n = this._nodes.length, m = this._links.length;
            var o, i;
            this._descent.locks.clear();
            for (i = 0; i < n; ++i) {
                o = this._nodes[i];
                if (o.fixed) {
                    if (typeof o.px === 'undefined' || typeof o.py === 'undefined') {
                        o.px = o.x;
                        o.py = o.y;
                    }
                    var p = [o.px, o.py];
                    this._descent.locks.add(i, p);
                }
            }
            var s1 = this._descent.rungeKutta();
            //var s1 = descent.reduceStress();
            if (s1 === 0) {
                this._alpha = 0;
            }
            else if (typeof this._lastStress !== 'undefined') {
                this._alpha = s1; //Math.abs(Math.abs(this._lastStress / s1) - 1);
            }
            this._lastStress = s1;
            this.updateNodePositions();
            this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
            return false;
        };
        // copy positions out of descent instance into each of the nodes' center coords
        Layout.prototype.updateNodePositions = function () {
            var x = this._descent.x[0], y = this._descent.x[1];
            var o, i = this._nodes.length;
            while (i--) {
                o = this._nodes[i];
                o.x = x[i];
                o.y = y[i];
            }
        };
        Layout.prototype.nodes = function (v) {
            if (!v) {
                if (this._nodes.length === 0 && this._links.length > 0) {
                    // if we have links but no nodes, create the nodes array now with empty objects for the links to point at.
                    // in this case the links are expected to be numeric indices for nodes in the range 0..n-1 where n is the number of nodes
                    var n = 0;
                    this._links.forEach(function (l) {
                        n = Math.max(n, l.source, l.target);
                    });
                    this._nodes = new Array(++n);
                    for (var i = 0; i < n; ++i) {
                        this._nodes[i] = {};
                    }
                }
                return this._nodes;
            }
            this._nodes = v;
            return this;
        };
        Layout.prototype.groups = function (x) {
            var _this = this;
            if (!x)
                return this._groups;
            this._groups = x;
            this._rootGroup = {};
            this._groups.forEach(function (g) {
                if (typeof g.padding === "undefined")
                    g.padding = 1;
                if (typeof g.leaves !== "undefined")
                    g.leaves.forEach(function (v, i) { (g.leaves[i] = _this._nodes[v]).parent = g; });
                if (typeof g.groups !== "undefined")
                    g.groups.forEach(function (gi, i) { (g.groups[i] = _this._groups[gi]).parent = g; });
            });
            this._rootGroup.leaves = this._nodes.filter(function (v) { return typeof v.parent === 'undefined'; });
            this._rootGroup.groups = this._groups.filter(function (g) { return typeof g.parent === 'undefined'; });
            return this;
        };
        Layout.prototype.powerGraphGroups = function (f) {
            var g = cola.powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
            this.groups(g.groups);
            f(g);
            return this;
        };
        Layout.prototype.avoidOverlaps = function (v) {
            if (!arguments.length)
                return this._avoidOverlaps;
            this._avoidOverlaps = v;
            return this;
        };
        Layout.prototype.handleDisconnected = function (v) {
            if (!arguments.length)
                return this._handleDisconnected;
            this._handleDisconnected = v;
            return this;
        };
        /**
         * causes constraints to be generated such that directed graphs are laid out either from left-to-right or top-to-bottom.
         * a separation constraint is generated in the selected axis for each edge that is not involved in a cycle (part of a strongly connected component)
         * @param axis {string} 'x' for left-to-right, 'y' for top-to-bottom
         * @param minSeparation {number|link=>number} either a number specifying a minimum spacing required across all links or a function to return the minimum spacing for each link
         */
        Layout.prototype.flowLayout = function (axis, minSeparation) {
            if (!arguments.length)
                axis = 'y';
            this._directedLinkConstraints = {
                axis: axis,
                getMinSeparation: typeof minSeparation === 'number' ? function () { return minSeparation; } : minSeparation
            };
            return this;
        };
        Layout.prototype.links = function (x) {
            if (!arguments.length)
                return this._links;
            this._links = x;
            return this;
        };
        Layout.prototype.constraints = function (c) {
            if (!arguments.length)
                return this._constraints;
            this._constraints = c;
            return this;
        };
        Layout.prototype.distanceMatrix = function (d) {
            if (!arguments.length)
                return this._distanceMatrix;
            this._distanceMatrix = d;
            return this;
        };
        Layout.prototype.size = function (x) {
            if (!x)
                return this._canvasSize;
            this._canvasSize = x;
            return this;
        };
        Layout.prototype.defaultNodeSize = function (x) {
            if (!x)
                return this._defaultNodeSize;
            this._defaultNodeSize = x;
            return this;
        };
        Layout.prototype.groupCompactness = function (x) {
            if (!x)
                return this._groupCompactness;
            this._groupCompactness = x;
            return this;
        };
        Layout.prototype.linkDistance = function (x) {
            if (!x) {
                return this._linkDistance;
            }
            this._linkDistance = typeof x === "function" ? x : +x;
            this._linkLengthCalculator = null;
            return this;
        };
        Layout.prototype.linkType = function (f) {
            this._linkType = f;
            return this;
        };
        Layout.prototype.convergenceThreshold = function (x) {
            if (!x)
                return this._threshold;
            this._threshold = typeof x === "function" ? x : +x;
            return this;
        };
        Layout.prototype.alpha = function (x) {
            if (!arguments.length)
                return this._alpha;
            else {
                x = +x;
                if (this._alpha) {
                    if (x > 0)
                        this._alpha = x; // we might keep it hot
                    else
                        this._alpha = 0; // or, next tick will dispatch "end"
                }
                else if (x > 0) {
                    if (!this._running) {
                        this._running = true;
                        this.trigger({ type: EventType.start, alpha: this._alpha = x });
                        this.kick();
                    }
                }
                return this;
            }
        };
        Layout.prototype.getLinkLength = function (link) {
            return typeof this._linkDistance === "function" ? +(this._linkDistance(link)) : this._linkDistance;
        };
        Layout.setLinkLength = function (link, length) {
            link.length = length;
        };
        Layout.prototype.getLinkType = function (link) {
            return typeof this._linkType === "function" ? this._linkType(link) : 0;
        };
        /**
         * compute an ideal length for each link based on the graph structure around that link.
         * you can use this (for example) to create extra space around hub-nodes in dense graphs.
         * In particular this calculation is based on the "symmetric difference" in the neighbour sets of the source and target:
         * i.e. if neighbours of source is a and neighbours of target are b then calculation is: sqrt(|a union b| - |a intersection b|)
         * Actual computation based on inspection of link structure occurs in start(), so links themselves
         * don't have to have been assigned before invoking this function.
         * @param {number} [idealLength] the base length for an edge when its source and start have no other common neighbours (e.g. 40)
         * @param {number} [w] a multiplier for the effect of the length adjustment (e.g. 0.7)
         */
        Layout.prototype.symmetricDiffLinkLengths = function (idealLength, w) {
            var _this = this;
            if (w === void 0) { w = 1; }
            this.linkDistance(function (l) { return idealLength * l.length; });
            this._linkLengthCalculator = function () { return cola.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w); };
            return this;
        };
        /**
         * compute an ideal length for each link based on the graph structure around that link.
         * you can use this (for example) to create extra space around hub-nodes in dense graphs.
         * In particular this calculation is based on the "symmetric difference" in the neighbour sets of the source and target:
         * i.e. if neighbours of source is a and neighbours of target are b then calculation is: |a intersection b|/|a union b|
         * Actual computation based on inspection of link structure occurs in start(), so links themselves
         * don't have to have been assigned before invoking this function.
         * @param {number} [idealLength] the base length for an edge when its source and start have no other common neighbours (e.g. 40)
         * @param {number} [w] a multiplier for the effect of the length adjustment (e.g. 0.7)
         */
        Layout.prototype.jaccardLinkLengths = function (idealLength, w) {
            var _this = this;
            if (w === void 0) { w = 1; }
            this.linkDistance(function (l) { return idealLength * l.length; });
            this._linkLengthCalculator = function () { return cola.jaccardLinkLengths(_this._links, _this.linkAccessor, w); };
            return this;
        };
        /**
         * start the layout process
         * @method start
         * @param {number} [initialUnconstrainedIterations=0] unconstrained initial layout iterations
         * @param {number} [initialUserConstraintIterations=0] initial layout iterations with user-specified constraints
         * @param {number} [initialAllConstraintsIterations=0] initial layout iterations with all constraints including non-overlap
         * @param {number} [gridSnapIterations=0] iterations of "grid snap", which pulls nodes towards grid cell centers - grid of size node[0].width - only really makes sense if all nodes have the same width and height
         * @param [keepRunning=true] keep iterating asynchronously via the tick method
         */
        Layout.prototype.start = function (initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning) {
            var _this = this;
            if (initialUnconstrainedIterations === void 0) { initialUnconstrainedIterations = 0; }
            if (initialUserConstraintIterations === void 0) { initialUserConstraintIterations = 0; }
            if (initialAllConstraintsIterations === void 0) { initialAllConstraintsIterations = 0; }
            if (gridSnapIterations === void 0) { gridSnapIterations = 0; }
            if (keepRunning === void 0) { keepRunning = true; }
            var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
            if (this._linkLengthCalculator)
                this._linkLengthCalculator();
            var x = new Array(N), y = new Array(N);
            var G = null;
            var ao = this._avoidOverlaps;
            this._nodes.forEach(function (v, i) {
                v.index = i;
                if (typeof v.x === 'undefined') {
                    v.x = w / 2, v.y = h / 2;
                }
                x[i] = v.x, y[i] = v.y;
            });
            //should we do this to clearly label groups?
            //this._groups.forEach((g, i) => g.groupIndex = i);
            var distances;
            if (this._distanceMatrix) {
                // use the user specified distanceMatrix
                distances = this._distanceMatrix;
            }
            else {
                // construct an n X n distance matrix based on shortest paths through graph (with respect to edge.length).
                distances = (new cola.shortestpaths.Calculator(N, this._links, Layout.getSourceIndex, Layout.getTargetIndex, function (l) { return _this.getLinkLength(l); })).DistanceMatrix();
                // G is a square matrix with G[i][j] = 1 iff there exists an edge between node i and node j
                // otherwise 2. (
                G = cola.Descent.createSquareMatrix(N, function () { return 2; });
                this._links.forEach(function (l) {
                    if (typeof l.source == "number")
                        l.source = _this._nodes[l.source];
                    if (typeof l.target == "number")
                        l.target = _this._nodes[l.target];
                });
                this._links.forEach(function (e) {
                    var u = Layout.getSourceIndex(e), v = Layout.getTargetIndex(e);
                    G[u][v] = G[v][u] = e.weight || 1;
                });
            }
            var D = cola.Descent.createSquareMatrix(N, function (i, j) {
                return distances[i][j];
            });
            if (this._rootGroup && typeof this._rootGroup.groups !== 'undefined') {
                var i = n;
                var addAttraction = function (i, j, strength, idealDistance) {
                    G[i][j] = G[j][i] = strength;
                    D[i][j] = D[j][i] = idealDistance;
                };
                this._groups.forEach(function (g) {
                    addAttraction(i, i + 1, _this._groupCompactness, 0.1);
                    // todo: add terms here attracting children of the group to the group dummy nodes
                    //if (typeof g.leaves !== 'undefined')
                    //    g.leaves.forEach(l => {
                    //        addAttraction(l.index, i, 1e-4, 0.1);
                    //        addAttraction(l.index, i + 1, 1e-4, 0.1);
                    //    });
                    //if (typeof g.groups !== 'undefined')
                    //    g.groups.forEach(g => {
                    //        var gid = n + g.groupIndex * 2;
                    //        addAttraction(gid, i, 0.1, 0.1);
                    //        addAttraction(gid + 1, i, 0.1, 0.1);
                    //        addAttraction(gid, i + 1, 0.1, 0.1);
                    //        addAttraction(gid + 1, i + 1, 0.1, 0.1);
                    //    });
                    x[i] = 0, y[i++] = 0;
                    x[i] = 0, y[i++] = 0;
                });
            }
            else
                this._rootGroup = { leaves: this._nodes, groups: [] };
            var curConstraints = this._constraints || [];
            if (this._directedLinkConstraints) {
                this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
                curConstraints = curConstraints.concat(cola.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, (this.linkAccessor)));
            }
            this.avoidOverlaps(false);
            this._descent = new cola.Descent([x, y], D);
            this._descent.locks.clear();
            for (var i = 0; i < n; ++i) {
                var o = this._nodes[i];
                if (o.fixed) {
                    o.px = o.x;
                    o.py = o.y;
                    var p = [o.x, o.y];
                    this._descent.locks.add(i, p);
                }
            }
            this._descent.threshold = this._threshold;
            // apply initialIterations without user constraints or nonoverlap constraints
            this._descent.run(initialUnconstrainedIterations);
            // apply initialIterations with user constraints but no nonoverlap constraints
            if (curConstraints.length > 0)
                this._descent.project = new cola.vpsc.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
            this._descent.run(initialUserConstraintIterations);
            this.separateOverlappingComponents(w, h);
            // subsequent iterations will apply all constraints
            this.avoidOverlaps(ao);
            if (ao) {
                this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
                this._descent.project = new cola.vpsc.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
                this._nodes.forEach(function (v, i) { x[i] = v.x, y[i] = v.y; });
            }
            // allow not immediately connected nodes to relax apart (p-stress)
            this._descent.G = G;
            this._descent.run(initialAllConstraintsIterations);
            if (gridSnapIterations) {
                this._descent.snapStrength = 1000;
                this._descent.snapGridSize = this._nodes[0].width;
                this._descent.numGridSnapNodes = n;
                this._descent.scaleSnapByMaxH = n != N; // if we have groups then need to scale hessian so grid forces still apply
                var G0 = cola.Descent.createSquareMatrix(N, function (i, j) {
                    if (i >= n || j >= n)
                        return G[i][j];
                    return 0;
                });
                this._descent.G = G0;
                this._descent.run(gridSnapIterations);
            }
            this.updateNodePositions();
            this.separateOverlappingComponents(w, h);
            return keepRunning ? this.resume() : this;
        };
        // recalculate nodes position for disconnected graphs
        Layout.prototype.separateOverlappingComponents = function (width, height) {
            var _this = this;
            // recalculate nodes position for disconnected graphs
            if (!this._distanceMatrix && this._handleDisconnected) {
                var x = this._descent.x[0], y = this._descent.x[1];
                this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
                var graphs = cola.separateGraphs(this._nodes, this._links);
                cola.applyPacking(graphs, width, height, this._defaultNodeSize);
                this._nodes.forEach(function (v, i) {
                    _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
                    if (v.bounds) {
                        v.bounds.setXCentre(v.x);
                        v.bounds.setYCentre(v.y);
                    }
                });
            }
        };
        Layout.prototype.resume = function () {
            return this.alpha(0.1);
        };
        Layout.prototype.stop = function () {
            return this.alpha(0);
        };
        /// find a visibility graph over the set of nodes.  assumes all nodes have a
        /// bounds property (a rectangle) and that no pair of bounds overlaps.
        Layout.prototype.prepareEdgeRouting = function (nodeMargin) {
            if (nodeMargin === void 0) { nodeMargin = 0; }
            this._visibilityGraph = new cola.geom.TangentVisibilityGraph(this._nodes.map(function (v) {
                return v.bounds.inflate(-nodeMargin).vertices();
            }));
        };
        /// find a route avoiding node bounds for the given edge.
        /// assumes the visibility graph has been created (by prepareEdgeRouting method)
        /// and also assumes that nodes have an index property giving their position in the
        /// node array.  This index property is created by the start() method.
        Layout.prototype.routeEdge = function (edge, draw) {
            var lineData = [];
            //if (d.source.id === 10 && d.target.id === 11) {
            //    debugger;
            //}
            var vg2 = new cola.geom.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
            vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
            if (typeof draw !== 'undefined') {
                draw(vg2);
            }
            var sourceInd = function (e) { return e.source.id; }, targetInd = function (e) { return e.target.id; }, length = function (e) { return e.length(); }, spCalc = new cola.shortestpaths.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
            if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
                var route = cola.vpsc.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, 5);
                lineData = [route.sourceIntersection, route.arrowStart];
            }
            else {
                var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
                for (var i = n; i >= 0; --i)
                    lineData.push(vg2.V[shortestPath[i]].p);
                lineData.push(cola.vpsc.makeEdgeTo(q, edge.target.innerBounds, 5));
            }
            //lineData.forEach((v, i) => {
            //    if (i > 0) {
            //        var u = lineData[i - 1];
            //        this._nodes.forEach(function (node) {
            //            if (node.id === getSourceIndex(d) || node.id === getTargetIndex(d)) return;
            //            var ints = node.innerBounds.lineIntersections(u.x, u.y, v.x, v.y);
            //            if (ints.length > 0) {
            //                debugger;
            //            }
            //        })
            //    }
            //})
            return lineData;
        };
        //The link source and target may be just a node index, or they may be references to nodes themselves.
        Layout.getSourceIndex = function (e) {
            return typeof e.source === 'number' ? e.source : e.source.index;
        };
        //The link source and target may be just a node index, or they may be references to nodes themselves.
        Layout.getTargetIndex = function (e) {
            return typeof e.target === 'number' ? e.target : e.target.index;
        };
        // Get a string ID for a given link.
        Layout.linkId = function (e) {
            return Layout.getSourceIndex(e) + "-" + Layout.getTargetIndex(e);
        };
        // The fixed property has three bits:
        // Bit 1 can be set externally (e.g., d.fixed = true) and show persist.
        // Bit 2 stores the dragging state, from mousedown to mouseup.
        // Bit 3 stores the hover state, from mouseover to mouseout.
        Layout.dragStart = function (d) {
            if (isGroup(d)) {
                Layout.storeOffset(d, Layout.dragOrigin(d));
            }
            else {
                Layout.stopNode(d);
                d.fixed |= 2; // set bit 2
            }
        };
        // we clobber any existing desired positions for nodes
        // in case another tick event occurs before the drag
        Layout.stopNode = function (v) {
            v.px = v.x;
            v.py = v.y;
        };
        // we store offsets for each node relative to the centre of the ancestor group 
        // being dragged in a pair of properties on the node
        Layout.storeOffset = function (d, origin) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    v.fixed |= 2;
                    Layout.stopNode(v);
                    v._dragGroupOffsetX = v.x - origin.x;
                    v._dragGroupOffsetY = v.y - origin.y;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(function (g) { return Layout.storeOffset(g, origin); });
            }
        };
        // the drag origin is taken as the centre of the node or group
        Layout.dragOrigin = function (d) {
            if (isGroup(d)) {
                return {
                    x: d.bounds.cx(),
                    y: d.bounds.cy()
                };
            }
            else {
                return d;
            }
        };
        // for groups, the drag translation is propagated down to all of the children of
        // the group.
        Layout.drag = function (d, position) {
            if (isGroup(d)) {
                if (typeof d.leaves !== 'undefined') {
                    d.leaves.forEach(function (v) {
                        d.bounds.setXCentre(position.x);
                        d.bounds.setYCentre(position.y);
                        v.px = v._dragGroupOffsetX + position.x;
                        v.py = v._dragGroupOffsetY + position.y;
                    });
                }
                if (typeof d.groups !== 'undefined') {
                    d.groups.forEach(function (g) { return Layout.drag(g, position); });
                }
            }
            else {
                d.px = position.x;
                d.py = position.y;
            }
        };
        // we unset only bits 2 and 3 so that the user can fix nodes with another a different
        // bit such that the lock persists between drags 
        Layout.dragEnd = function (d) {
            if (isGroup(d)) {
                if (typeof d.leaves !== 'undefined') {
                    d.leaves.forEach(function (v) {
                        Layout.dragEnd(v);
                        delete v._dragGroupOffsetX;
                        delete v._dragGroupOffsetY;
                    });
                }
                if (typeof d.groups !== 'undefined') {
                    d.groups.forEach(Layout.dragEnd);
                }
            }
            else {
                d.fixed &= ~6; // unset bits 2 and 3
            }
        };
        // in d3 hover temporarily locks nodes, currently not used in cola
        Layout.mouseOver = function (d) {
            d.fixed |= 4; // set bit 3
            d.px = d.x, d.py = d.y; // set velocity to zero
        };
        // in d3 hover temporarily locks nodes, currently not used in cola
        Layout.mouseOut = function (d) {
            d.fixed &= ~4; // unset bit 3
        };
        return Layout;
    })();
    cola.Layout = Layout;
})(cola || (cola = {}));
//# sourceMappingURL=layout.js.map