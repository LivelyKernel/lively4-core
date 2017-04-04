module('users.timfelgentreff.jsinterpreter.Rewriting').requires('users.timfelgentreff.jsinterpreter.Parser').toRun(function() {

Object.extend(users.timfelgentreff.jsinterpreter, {
    oldEval: eval
});

Object.extend(users.timfelgentreff.jsinterpreter.Rewriting, {
    table: []
});

users.timfelgentreff.jsinterpreter.Visitor.subclass('users.timfelgentreff.jsinterpreter.Rewriting.Transformation',
'helping', {
    visitNodes: function(nodes) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            var res = this.visit(nodes[i]);
            if (res) result.push(res);
        }
        return result;
    }
},
'visiting', {
    visitSequence: function(node) {
        return new users.timfelgentreff.jsinterpreter.Sequence(node.pos, this.visitNodes(node.children));
    },
    visitNumber: function(node) {
        return new users.timfelgentreff.jsinterpreter.Number(node.pos, node.value);
    },
    visitString: function(node) {
        return new users.timfelgentreff.jsinterpreter.String(node.pos, node.value);
    },
    visitCond: function(node) {
        return new users.timfelgentreff.jsinterpreter.Cond(node.pos,
                                   this.visit(node.condExpr),
                                   this.visit(node.trueExpr),
                                   this.visit(node.falseExpr));
    },
    visitIf: function(node) {
        return new users.timfelgentreff.jsinterpreter.If(node.pos,
                                 this.visit(node.condExpr),
                                 this.visit(node.trueExpr),
                                 this.visit(node.falseExpr));
    },
    visitWhile: function(node) {
        return new users.timfelgentreff.jsinterpreter.While(node.pos,
                                    this.visit(node.condExpr),
                                    this.visit(node.body));
    },
    visitDoWhile: function(node) {
        return new users.timfelgentreff.jsinterpreter.DoWhile(node.pos,
                                      this.visit(node.body),
                                      this.visit(node.condExpr));
    },
    visitFor: function(node) {
        return new users.timfelgentreff.jsinterpreter.For(node.pos,
                                  this.visit(node.init),
                                  this.visit(node.condExpr),
                                  this.visit(node.body),
                                  this.visit(node.upd));
    },
    visitForIn: function(node) {
        return new users.timfelgentreff.jsinterpreter.ForIn(node.pos,
                                    this.visit(node.name),
                                    this.visit(node.obj),
                                    this.visit(node.body));
    },
    visitSet: function(node) {
        return new users.timfelgentreff.jsinterpreter.Set(node.pos,
                                  this.visit(node.left),
                                  this.visit(node.right));
    },
    visitModifyingSet: function(node) {
        return new users.timfelgentreff.jsinterpreter.ModifyingSet(node.pos,
                                           this.visit(node.left),
                                           node.name,
                                           this.visit(node.right));
    },
    visitBinaryOp: function(node) {
        return new users.timfelgentreff.jsinterpreter.BinaryOp(node.pos,
                                       node.name,
                                       this.visit(node.left),
                                       this.visit(node.right));
    },
    visitUnaryOp: function(node) {
        return new users.timfelgentreff.jsinterpreter.UnaryOp(node.pos,
                                      node.name,
                                      this.visit(node.expr));
    },
    visitPreOp: function(node) {
        return new users.timfelgentreff.jsinterpreter.PreOp(node.pos,
                                    node.name,
                                    this.visit(node.expr));
    },
    visitPostOp: function(node) {
        return new users.timfelgentreff.jsinterpreter.PostOp(node.pos,
                                     node.name,
                                     this.visit(node.expr));
    },
    visitThis: function(node) {
        return new users.timfelgentreff.jsinterpreter.This(node.pos);
    },
    visitVariable: function(node) {
        return new users.timfelgentreff.jsinterpreter.Variable(node.pos, node.name);
    },
    visitGetSlot: function(node) {
        return new users.timfelgentreff.jsinterpreter.GetSlot(node.pos,
                                      this.visit(node.slotName),
                                      this.visit(node.obj));
    },
    visitBreak: function(node) {
        return new users.timfelgentreff.jsinterpreter.Break(node.pos);
    },
    visitDebugger: function(node) {
        return new users.timfelgentreff.jsinterpreter.Debugger(node.pos);
    },
    visitContinue: function(node) {
        return new users.timfelgentreff.jsinterpreter.Continue(node.pos);
    },
    visitArrayLiteral: function(node) {
        return new users.timfelgentreff.jsinterpreter.ArrayLiteral(node.pos, this.visitNodes(node.elements));
    },
    visitReturn: function(node) {
        return new users.timfelgentreff.jsinterpreter.Return(node.pos,this.visit(node.expr));
    },
    visitWith: function(node) {
        throw new Error('with statement not supported');
    },
    visitSend: function(node) {
        return new users.timfelgentreff.jsinterpreter.Send(node.pos,
                                   this.visit(node.property),
                                   this.visit(node.recv),
                                   this.visitNodes(node.args));
    },
    visitCall: function(node) {
        return new users.timfelgentreff.jsinterpreter.Call(node.pos,
                                   this.visit(node.fn),
                                   this.visitNodes(node.args));
    },
    visitNew: function(node) {
        return new users.timfelgentreff.jsinterpreter.New(node.pos, this.visit(node.clsExpr));
    },
    visitVarDeclaration: function(node) {
        return new users.timfelgentreff.jsinterpreter.VarDeclaration(node.pos, node.name, this.visit(node.val));
    },
    visitThrow: function(node) {
        return new users.timfelgentreff.jsinterpreter.Throw(node.pos, this.visit(node.expr));
    },
    visitTryCatchFinally: function(node) {
        return new users.timfelgentreff.jsinterpreter.TryCatchFinally(node.pos,
                                              this.visit(node.trySeq),
                                              node.err,
                                              this.visit(node.catchSeq),
                                              this.visit(node.finallySeq));
    },
    visitFunction: function(node) {
        return new users.timfelgentreff.jsinterpreter.Function(node.pos,
                                       this.visit(node.body),
                                       this.visitNodes(node.args));
    },
    visitObjectLiteral: function(node) {
        return new users.timfelgentreff.jsinterpreter.ObjectLiteral(node.pos, this.visitNodes(node.properties));
    },
    visitObjProperty: function(node) {
        return new users.timfelgentreff.jsinterpreter.ObjProperty(node.pos, node.name, this.visit(node.property));
    },
    visitSwitch: function(node) {
        return new users.timfelgentreff.jsinterpreter.Switch(node.pos,
                                     this.visit(node.expr),
                                     this.visitNodes(node.cases));
    },
    visitCase: function(node) {
        return new users.timfelgentreff.jsinterpreter.Case(node.pos,
                                   this.visit(node.condExpr),
                                   this.visit(node.thenExpr));
    },
    visitDefault: function(node) {
        return new users.timfelgentreff.jsinterpreter.Case(node.pos, this.visit(node.defaultExpr));
    },
    visitRegex: function(node) {
        return new users.timfelgentreff.jsinterpreter.Regex(node.pos, node.exprString, node.flags);
    },
    visitObjPropertyGet: function(node) {
        return new users.timfelgentreff.jsinterpreter.ObjPropertyGet(node.pos, node.name, this.visit(node.body));
    },
    visitObjPropertySet: function(node) {
        return new users.timfelgentreff.jsinterpreter.ObjPropertySet(node.pos,
                                             node.name,
                                             this.visit(node.body),
                                             node.arg);
    }
});

users.timfelgentreff.jsinterpreter.Rewriting.Transformation.subclass('users.timfelgentreff.jsinterpreter.Rewriting.RemoveDebugger',
'visiting', {
    visitDebugger: function(node) {
        return undefined;
    }
});

users.timfelgentreff.jsinterpreter.Rewriting.Transformation.subclass('users.timfelgentreff.jsinterpreter.Rewriting.Rewriter',
'initializing', {
    initialize: function($super) {
        $super();
        this.scopes = [];
    }
},
'scoping', {
    enterScope: function() {
        this.scopes.push([]);
    },
    registerVar: function(name) {
        if (this.scopes.length == 0) return;
        this.scopes.last().push(name);
    },
    referenceVar: function(name) {
        for (var i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].include(name)) return i;
        }
        return undefined;
    },
    exitScope: function() {
        this.scopes.pop();
    },
},
'helping', {
    computationFrame: function() {
        return new users.timfelgentreff.jsinterpreter.Variable([0,0], "_");
    },
    localFrame: function(i) {
        return new users.timfelgentreff.jsinterpreter.Variable([0,0], "_" + i);
    },
    frame: function(i) {
        if (i < 0) return new users.timfelgentreff.jsinterpreter.Variable([0,0], "Global");
        return new users.timfelgentreff.jsinterpreter.Variable([0,0], "__" + i);
    },
    storeComputationResult: function(node) {
        if (this.scopes.length == 0) return node; // dont store if there is no frame
        var name = new users.timfelgentreff.jsinterpreter.String(node.pos, node.position());
        var target = new users.timfelgentreff.jsinterpreter.GetSlot(node.pos, name, this.computationFrame());
        return new users.timfelgentreff.jsinterpreter.Set(node.pos, target, node);
    },
    registerArguments: function(func) {
        var args = [];
        for (var i = 0; i < func.args.length; i++) {
            var arg = func.args[i];
            this.registerVar(arg.name);
            args.push(new users.timfelgentreff.jsinterpreter.Variable(arg.pos, arg.name));
        }
        return args;
    },
    registerLocals: function(func) {
        var that = this;
        func.body.withAllChildNodesDo(function(node) {
            if (node.isFunction) return false;
            if (node.isVarDeclaration) that.registerVar(node.name);
            return true;
        });
    }
},
'rewriting', {
    wrapVar: function(pos, name) {
        var scope = this.referenceVar(name);
        if (scope === undefined) return new users.timfelgentreff.jsinterpreter.Variable(pos, name);
        return new users.timfelgentreff.jsinterpreter.GetSlot(pos,
                                      new users.timfelgentreff.jsinterpreter.String(pos, name),
                                      this.localFrame(scope));
    },
    rewriteVarDeclaration: function(pos, name, expr) {
        return new users.timfelgentreff.jsinterpreter.Set(pos, this.wrapVar(pos, name), expr);
    },
    emptyObj: function() {
        return new users.timfelgentreff.jsinterpreter.ObjectLiteral([0,0], []);
    },
    argsInitObj: function(args) {
        var properties = [];
        for (var i = 0; i < args.length; i++) {
            var arg = args[i].name;
            var argVal = new users.timfelgentreff.jsinterpreter.Variable([0,0], arg);
            properties.push(new users.timfelgentreff.jsinterpreter.ObjProperty([0,0], arg, argVal));
        }
        return new users.timfelgentreff.jsinterpreter.ObjectLiteral([0,0], properties);
    },
    addPreamble: function(astIdx, body, args) {
        var p = body.pos;
        var level = this.scopes.length;
        var initComputationFrame = new users.timfelgentreff.jsinterpreter.VarDeclaration(p, "_", this.emptyObj());
        var initLocalFrame = new users.timfelgentreff.jsinterpreter.VarDeclaration(p, "_"+level, this.argsInitObj(args));
        var frame = new users.timfelgentreff.jsinterpreter.ArrayLiteral(p, [this.computationFrame(),
                                                    this.localFrame(level),
                                                    new users.timfelgentreff.jsinterpreter.Number(p, astIdx),
                                                    this.frame(level - 1)]);
        var initFrame = new users.timfelgentreff.jsinterpreter.VarDeclaration(p, "__" + level, frame);
        return new users.timfelgentreff.jsinterpreter.Sequence(p, [initComputationFrame, initLocalFrame, initFrame, body]);
    },
    catchExceptions: function(astIdx, body) {
        var p = body.pos;
        var level = this.scopes.length;
        var parent = level == 0 ? "Global" : "__" + (level - 1);
        var throwStmt = new users.timfelgentreff.jsinterpreter.Throw(p, new users.timfelgentreff.jsinterpreter.Variable(p, "ex"));
        var shiftStmt = new users.timfelgentreff.jsinterpreter.Send(p,
            new users.timfelgentreff.jsinterpreter.String(p,"shiftFrame"),
            new users.timfelgentreff.jsinterpreter.Variable(p,"ex"),
            [new users.timfelgentreff.jsinterpreter.This(p), new users.timfelgentreff.jsinterpreter.Variable(p, "__" + level)]);
        var isUnwind = new users.timfelgentreff.jsinterpreter.GetSlot(p,
            new users.timfelgentreff.jsinterpreter.String(p, "isUnwindException"),
            new users.timfelgentreff.jsinterpreter.Variable(p, "e"));
        var classExpr = new users.timfelgentreff.jsinterpreter.GetSlot(p,
            new users.timfelgentreff.jsinterpreter.String(p,"UnwindExecption"),
            new users.timfelgentreff.jsinterpreter.GetSlot(p,
                new users.timfelgentreff.jsinterpreter.String(p,"Rewriting"),
                new users.timfelgentreff.jsinterpreter.GetSlot(p,
                    new users.timfelgentreff.jsinterpreter.String(p,"ast"),
                    new users.timfelgentreff.jsinterpreter.Variable(p,"lively"))));
        var newUnwind = new users.timfelgentreff.jsinterpreter.New(p,
            new users.timfelgentreff.jsinterpreter.Call(p, classExpr, [new users.timfelgentreff.jsinterpreter.Variable(p,"e")]));
        var cond = new users.timfelgentreff.jsinterpreter.Cond(p, isUnwind,
                                          new users.timfelgentreff.jsinterpreter.Variable(p, "e"),
                                          newUnwind);
        var catchSeq = new users.timfelgentreff.jsinterpreter.Sequence(p, [
            new users.timfelgentreff.jsinterpreter.VarDeclaration(p,"ex",cond), shiftStmt, throwStmt])
        var noop = new users.timfelgentreff.jsinterpreter.Variable(body.pos, "undefined");
        var error = new users.timfelgentreff.jsinterpreter.Variable(body.pos, "e");
        return new users.timfelgentreff.jsinterpreter.TryCatchFinally(body.pos, body, error, catchSeq, noop);
    },
    wrapFunctionBody: function(astIdx, body, args) {
        return this.catchExceptions(astIdx, this.addPreamble(astIdx, body, args));
    },
    wrapClosure: function(idx, node) {
        var fn = new users.timfelgentreff.jsinterpreter.Variable(node.pos, "__createClosure");
        var scope = this.frame(this.scopes.length - 1);
        var astIdx = new users.timfelgentreff.jsinterpreter.Number([0,0], idx);
        return new users.timfelgentreff.jsinterpreter.Call(node.pos, fn, [astIdx, scope, node]);
    }
},
'visiting', {
    visitVarDeclaration: function(node) {
        this.registerVar(node.name.value);
        return this.storeComputationResult(
            this.rewriteVarDeclaration(node.pos, node.name, this.visit(node.val)));
    },
    visitVariable: function(node) {
        return this.wrapVar(node.pos, node.name);
    },
    visitDebugger: function(node) {
        var ret = new users.timfelgentreff.jsinterpreter.Return(node.pos, new users.timfelgentreff.jsinterpreter.String(node.pos, "Debuggger"));
        var returnDebugger = new users.timfelgentreff.jsinterpreter.Function(node.pos,
            new users.timfelgentreff.jsinterpreter.Sequence(node.pos, [ret]), []);
        var ast = this.storeComputationResult(returnDebugger);
        var toString = new users.timfelgentreff.jsinterpreter.ObjProperty(node.pos, "toString", ast);
        return new users.timfelgentreff.jsinterpreter.Throw(node.pos, new users.timfelgentreff.jsinterpreter.ObjectLiteral(node.pos, [toString]));
    },
    visitSet: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitCall: function($super, node) {
        return this.storeComputationResult($super(node));
        //return this.storeComputationResult(new users.timfelgentreff.jsinterpreter.Call(node.pos,
        //   this.storeComputationResult(this.visit(node.fn)),
        //   this.visitNodes(node.args)));
    },
    visitSend: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitModifyingSet: function($super, node) {
        return this.storeComputationResult($super(node));
    },

    visitPreOp: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitPostOp: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitNew: function(node) {
        var clsExpr = this.visit(node.clsExpr);
        if (clsExpr.isSet) clsExpr = clsExpr.right;
        return this.storeComputationResult(new users.timfelgentreff.jsinterpreter.New(node.pos, clsExpr));
    },
    visitFunction: function($super, node) {
        this.enterScope();
        var args = this.registerArguments(node);
        this.registerLocals(node);
        var rewritten = new users.timfelgentreff.jsinterpreter.Function(node.pos, this.visit(node.body), args);
        this.exitScope();
        users.timfelgentreff.jsinterpreter.Rewriting.table.push(node);
        var idx = users.timfelgentreff.jsinterpreter.Rewriting.table.length - 1;
        rewritten.body = this.wrapFunctionBody(idx, rewritten.body, rewritten.args);
        return this.storeComputationResult(this.wrapClosure(idx, rewritten));
    }
});

Object.subclass('users.timfelgentreff.jsinterpreter.Rewriting.UnwindExecption',
'settings', {
    isUnwindException: true
},
'initializing', {
    initialize: function(error) {
        this.error = error;
    }
},
'printing', {
    toString: function() {
        return this.error.toString();
    }
},
'frames', {
    shiftFrame: function(thiz, frame) {
        var computationFrame = frame[0];
        var localFrame = frame[1];
        localFrame["this"] = thiz;
        var astIndex = frame[2];
        var scope = frame[3];
        var stackFrame = [computationFrame, localFrame, astIndex, Global, scope];
        if (!this.top) {
            this.top = this.last = stackFrame;
            return;
        }
        this.last[3] = stackFrame;
        this.last = stackFrame;
    }
});

Object.extend(Global, {
    __createClosure: function(idx, scope, f) {
        f._cachedAst = users.timfelgentreff.jsinterpreter.Rewriting.table[idx];
        f._cachedScope = scope;
        return f;
    },
    eval2: function(src) {
        var ast = users.timfelgentreff.jsinterpreter.Parser.parse(src, 'topLevel');
        var wrapped = new users.timfelgentreff.jsinterpreter.Function([0,0], ast, []);
        wrapped.source = src;
        var rewriter = new users.timfelgentreff.jsinterpreter.Rewriting.Rewriter();
        var rewrittenAst = rewriter.visit(wrapped);
        return users.timfelgentreff.jsinterpreter.oldEval(rewrittenAst.asJS())();
    }
});

Object.extend(JSLoader, {
    loadJs2: function (url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
        var exactUrl = url;
        if ((exactUrl.indexOf('!svn') <= 0) && !okToUseCache) {
            exactUrl = this.makeUncached(exactUrl, cacheQuery);
        }
        $.ajax(exactUrl, {
            success: users.timfelgentreff.jsinterpreter.Rewriting.loadJS.bind(users.timfelgentreff.jsinterpreter.Rewriting, onLoadCb)
        });
    }
});

Object.extend(users.timfelgentreff.jsinterpreter.Rewriting, {
    loadJS: function(cb, src) {
        if (!src) { src = cb; cb = null; }
        eval(src);
        if (cb) cb();
    }
});

}) // end of module
