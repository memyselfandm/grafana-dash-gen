// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var _ = require('underscore');
var util = require('util');

function Influx() {
    // if (arguments.length === 0) {
    //     throw new Error('Incorrect invocation of Influx. ' +
    //                     'Must provide at least one argument');
    // }

    this.props = {
      select: new Array(),
      resultFormat: "time_series",
      orderByTime: "ASC",
    };

    // if (typeof arguments[0] === 'string') {
    //     // Format string
    //     this.source = util.format.apply(null, arguments);
    // } else {
    //     // Another target
    //     this.source = arguments[0];
    //     this.func = arguments[1];
    // }

    return this;
}

//Core query building Functions
//SELECT
//TODO: make this work for multiple fields
//this could be done by storing chaining state inside an object and then if select is called again then pushing that object to actual state and starting anew
Influx.prototype.select = function select(field){
  if(!this.props.select) this.props.select = new Array();
  if(!this.selectState) this.selectState = new Array();

  if(this.selectState.length > 0) {
    //a new select is being called, commit what we have and start fresh
    this.props.select.push(this.selectState);
  }

  this.selectState = new Array();
  const selectObj = {
    "params": [field],
    "type": "field"
  };

  this.selectState.push(selectObj);

  return this;
}

// Select Functions
Influx.SELECTFUNCTIONS = {
  bottom: 0,
  count: 0,
  distinct: 0,
  first: 0,
  integral: 0,
  last: 0,
  max: 0,
  mean: 0,
  median: 0,
  min: 0,
  mode: 0,
  non_negative_derivative: 1,
  percentile: 1,
  sum: 0,
  top: 1,
}

_.each(Influx.SELECTFUNCTIONS, function each(n, method) {
    Influx.prototype[method] = function t() {
        if (arguments.length < n) {
            /*eslint-disable*/
            console.warn("Incorrect number of arguments passed to %s", method);
            console.trace();
            /*eslint-enable*/
        }

        const selectObj = {
          "params" : [].slice.call(arguments),
          "type" : method
        }

        this.selectState.push(selectObj);

        return this;
    };
});

//FROM
Influx.prototype.from = function from(field){
  //first, commit our select
  if(this.selectState.length > 0) {
    this.props.select.push(this.selectState);
    this.selectState = [];
  }

  this.props.measurement = field;

  return this;
}

//WHERE
Influx.prototype.where = function where(key, op, value){
  if(!this.props.tags) this.props.tags = new Array();

  this.props.tags.push({
    "key": key,
    "operator": op,
    "value": value
  });

  return this;
}

//GROUP BY
//Group functions
Influx.GROUPBYFUNCTIONS = {
  fill: 1,
  tag: 1,
  time: 1
}

_.each(Influx.GROUPBYFUNCTIONS, function each(n, method) {
    Influx.prototype[method] = function t() {
        if (arguments.length < n) {
            /*eslint-disable*/
            console.warn("Incorrect number of arguments passed to %s", method);
            console.trace();
            /*eslint-enable*/
        }

        if(!this.props.groupBy) this.props.groupBy = new Array();

        const groupObj = {
          "params" : [].slice.call(arguments),
          "type" : method
        };

        this.props.groupBy.push(groupObj);

        return this;
    };
});

Influx.prototype.generate = function(){
  return this.props;
}

module.exports = Influx;
