const assert = require('assert')
const sinon = require('sinon')
const stringify = require('json-stable-stringify')
const {God, Phenotype, Genotype, Nucleus} = require("../cell")
const spy = require("./spy.js")
const compare = function(actual, expected) {
  assert.equal(stringify(actual), stringify(expected));
}
describe("DOM prototype overrides", function() {
  var cleanup = require('jsdom-global')()
  God.plan(window);
  it("$snapshot", function() {
    cleanup();
    cleanup = require('jsdom-global')()

    document.body.innerHTML = "";
    window.c = {
      $cell: true,
      _model: [],
      id: "el",
      onclick: function(e) { console.log("clicked"); },
      _fun: function(message) { return "Fun " + message; }
    }
    compare(document.body.outerHTML, "<body></body>");
    God.create(window);
    var fun = document.body.querySelector("#el")._fun;
    compare(fun.snapshot.toString(), "function (message) { return \"Fun \" + message; }");

    var onclick = document.body.querySelector("#el").Genotype.onclick;
    compare(onclick.snapshot.toString(), "function (e) { console.log(\"clicked\"); }");

    var snapshot = document.body.querySelector("#el").$snapshot();
    compare(snapshot._fun.toString(), "function (message) { return \"Fun \" + message; }");
    compare(snapshot.onclick.toString(), "function (e) { console.log(\"clicked\"); }");
  })

});
describe("Nucleus", function() {
  var cleanup = require('jsdom-global')()
  God.plan(window);
  it("has nothing at the beginning", function() {
    cleanup();
    cleanup = require('jsdom-global')()

    document.body.innerHTML = "";
    God.create(window);
    compare(document.body.outerHTML, "<body></body>");
  })
  it("God.create creates correct markup", function() {
    cleanup();
    cleanup = require('jsdom-global')()
    document.body.innerHTML = "";
    window.c = {
      $cell: true,
      _model: [],
      id: "grandparent",
      $components: [{
        id: "parent", 
        $components: [{
          id: "child"
        }]
      }, {
        $type: "div",
        id: "aunt"
      }]
    }
    compare(document.body.outerHTML, "<body></body>");
    God.create(window);
    compare(document.body.outerHTML, "<body><div id=\"grandparent\"><div id=\"parent\"><div id=\"child\"></div></div><div id=\"aunt\"></div></div></body>")
  })
  it("God.create triggers God.detect, the detect correctly detects", function() {
    cleanup();
    cleanup = require('jsdom-global')()
    document.body.innerHTML = "";
    window.c = {
      $cell: true,
      _model: [],
      id: "grandparent",
      $components: [{
        id: "parent", 
        $components: [{
          id: "child"
        }]
      }, {
        $type: "div",
        id: "aunt"
      }]
    }
    spy.God.detect.reset();
    const bodySpy = sinon.spy(document.body, "$build")
    God.create(window);
    compare(bodySpy.callCount, 1);
    compare(spy.God.detect.callCount, 1);
  })
  describe("context inheritance", function() {
    it("walks up the DOM tree to find the attribute if it doesn't exist on the current node", function() {
      cleanup();
      cleanup = require('jsdom-global')()
      document.body.innerHTML = "";
      window.c = {
        $cell: true,
        _model: [1,2,3],
        id: "grandparent",
        $components: [{
          id: "parent", 
          $components: [{
            id: "child"
          }]
        }, {
          $type: "div",
          id: "aunt"
        }]
      }
      God.create(window);
      var $child = document.body.querySelector("#child")
      compare($child._model, [1,2,3]);
    })
    it("finds the attribute on the current element first", function() {
      cleanup();
      cleanup = require('jsdom-global')()
      document.body.innerHTML = "";
      window.c = {
        $cell: true,
        _model: [1,2,3],
        id: "grandparent",
        $components: [{
          id: "parent", 
          $components: [{
            id: "child",
            _model: ["a"]
          }]
        }, {
          $type: "div",
          id: "aunt"
        }]
      }
      God.create(window);
      var $child = document.body.querySelector("#child")
      compare($child._model, ["a"]);
    })
    it("descendants can share an ancestor's variable", function() {
      cleanup();
      cleanup = require('jsdom-global')()
      document.body.innerHTML = "";
      window.c = {
        $cell: true,
        _model: [1,2,3],
        id: "grandparent",
        $components: [{
          id: "parent", 
          $components: [{
            id: "child"
          }]
        }, {
          $type: "div",
          id: "aunt"
        }]
      }
      God.create(window);
      var $child = document.body.querySelector("#child")
      var $aunt = document.body.querySelector("#aunt")

      // update _model from child
      $child._model.push("from child");
      compare($child._model, [1,2,3,"from child"]);

      // access _model from aunt (same as above)
      compare($aunt._model, [1,2,3,"from child"])
    })
  })
})
