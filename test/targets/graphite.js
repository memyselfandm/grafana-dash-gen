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

/*global console*/

'use strict';

var util = require('util');
var test = require('tape');
var Graphite = require('../../grafana/targets/graphite');

test('Graphite throws exception on invalid invocation', function t(assert) {
    assert.throws(function shouldThrow() {
        new Graphite();
    }, /Error/);
    assert.end();
});

test('Graphite can initialize as a single string source', function t(assert) {
    var arg = 'path.to.metric';
    var target = new Graphite(arg);
    assert.equal(target.source, arg);
    assert.end();
});

/*eslint-disable*/
test('Graphite can initialize as a single interpolated string source', function t(assert) {
/*eslint-enable*/
    var arg = 'path.to.%s.metric';
    var sub = 'foo';
    var argFinal = 'path.to.foo.metric';
    var target = new Graphite(arg, sub);
    assert.equal(target.source, argFinal);
    assert.end();
});

test('Graphite can initialize as a source and function', function t(assert) {
    var arg = 'path.to.metric';
    new Graphite(arg).
        averageSeries().
        movingAverage('$smoothing').
        alias('Total P95');
    assert.end();
});

test('Graphite can initialize and chain methods', function t(assert) {
    var arg = 'path.to.metric';
    var target = new Graphite(arg).
        averageSeries().
        movingAverage('$smoothing').
        alias('Total P95');

    Object.keys(Graphite.PRIMITIVES).forEach(function eachPrimitive(primitive) {
        assert.ok((typeof target[primitive]) === 'function');
    });
    assert.end();
});

test('Graphite warns on incorrect primitive invocation', function t(assert) {
    assert.plan(2);
    /*eslint-disable*/
    console.warn = function warn(str) {
        assert.ok(str);
    };
    console.trace = function trace(str) {
        assert.notOk(str);
    };
    new Graphite('foo').alpha();
    /*eslint-enable*/

    assert.end();
});

test('Graphite color methods are generated correctly', function t(assert) {
    var arg = 'path.to.metric';
    var target = new Graphite(arg);

    Graphite.COLORS.forEach(function eachColor(color) {
        assert.ok((typeof target[color]) === 'function');
        var str = target[color]().toString();
        var expected = util.format('color(path.to.metric, "%s")', color);
        assert.equal(str, expected);
    });
    assert.end();
});

test('Graphite helper-method - color', function t(assert) {
    var arg = 'path.to.metric';
    var expected = 'color(path.to.metric, "COLOR")';
    var target = new Graphite(arg).color('COLOR').toString();
    assert.equal(target, expected);
    assert.end();
});

test('Graphite helper-method - cpu', function t(assert) {
    var arg = 'path.to.metric';
    var expected = ['removeBelowValue(',
                    'scale(',
                    'derivative(',
                    'path.to.metric), ',
                    '0.016666666667), 0)'].join('');
    var target = new Graphite(arg).cpu().toString();
    assert.equal(target, expected);
    assert.end();
});

test('Graphite helper-method - reallyFaded', function t(assert) {
    var arg = 'path.to.metric';
    var expected = 'alpha(lineWidth(path.to.metric, 5), 0.5)';
    var target = new Graphite(arg).reallyFaded().toString();
    assert.equal(target, expected);
    assert.end();
});

test('Graphite helper-method - faded', function t(assert) {
    var arg = 'path.to.metric';
    var expected = 'lineWidth(alpha(path.to.metric, 0.5), 5)';
    var target = new Graphite(arg).faded().toString();
    assert.equal(target, expected);
    assert.end();
});

test('Graphite helper-method - lastWeek', function t(assert) {
    var arg = 'path.to.metric';
    var expected = 'timeShift(path.to.metric, "7d")';
    var target = new Graphite(arg).lastWeek().toString();
    assert.equal(target, expected);
    assert.end();
});

test('Graphite helper-method - summarize15min', function t(assert) {
    var arg = 'path.to.metric';
    var expected = 'summarize(path.to.metric, "15min")';
    var target = new Graphite(arg).summarize15min().toString();
    assert.equal(target, expected);
    assert.equal(target.hide, undefined);
    assert.end();
});

test('Graphite can call hide()', function t(assert) {
    var target = new Graphite('path.to.metric').hide();

    assert.equal(target.toString(), 'path.to.metric');
    assert.equal(target.hide, true);
    assert.end();
});
