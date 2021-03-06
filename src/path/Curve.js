/*
 * Paper.js
 *
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 *
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Curve
 *
 * @class The Curve object represents the parts of a path that are connected by
 * two following {@link Segment} objects. The curves of a path can be accessed
 * through its {@link Path#curves} array.
 *
 * While a segment describe the anchor point and its incoming and outgoing
 * handles, a Curve object describes the curve passing between two such
 * segments. Curves and segments represent two different ways of looking at the
 * same thing, but focusing on different aspects. Curves for example offer many
 * convenient ways to work with parts of the path, finding lengths, positions or
 * tangents at given offsets.
 */
var Curve = this.Curve = Base.extend(/** @lends Curve# */{
	/**
	 * Creates a new curve object.
	 *
	 * @param {Segment} segment1
	 * @param {Segment} segment2
	 */
	initialize: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
		var count = arguments.length;
		if (count == 0) {
			this._segment1 = new Segment();
			this._segment2 = new Segment();
		} else if (count == 1) {
			// TODO: If beans are not activated, this won't copy from
			// an existing segment. OK?
			this._segment1 = new Segment(arg0.segment1);
			this._segment2 = new Segment(arg0.segment2);
		} else if (count == 2) {
			this._segment1 = new Segment(arg0);
			this._segment2 = new Segment(arg1);
		} else if (count == 4) {
			this._segment1 = new Segment(arg0, null, arg1);
			this._segment2 = new Segment(arg3, arg2, null);
		} else if (count == 8) {
			// An array as returned by getValues
			var p1 = Point.create(arg0, arg1),
				p2 = Point.create(arg6, arg7);
			this._segment1 = new Segment(p1, null,
					Point.create(arg2, arg3).subtract(p1));
			this._segment2 = new Segment(p2,
					Point.create(arg4, arg5).subtract(p2), null);
		}
	},

	_changed: function() {
		// Clear cached values.
		delete this._length;
	},

	/**
	 * The first anchor point of the curve.
	 *
	 * @type Point
	 * @bean
	 */
	getPoint1: function() {
		return this._segment1._point;
	},

	setPoint1: function(point) {
		point = Point.read(arguments);
		this._segment1._point.set(point.x, point.y);
	},

	/**
	 * The second anchor point of the curve.
	 *
	 * @type Point
	 * @bean
	 */
	getPoint2: function() {
		return this._segment2._point;
	},

	setPoint2: function(point) {
		point = Point.read(arguments);
		this._segment2._point.set(point.x, point.y);
	},

	/**
	 * The handle point that describes the tangent in the first anchor point.
	 *
	 * @type Point
	 * @bean
	 */
	getHandle1: function() {
		return this._segment1._handleOut;
	},

	setHandle1: function(point) {
		point = Point.read(arguments);
		this._segment1._handleOut.set(point.x, point.y);
	},

	/**
	 * The handle point that describes the tangent in the second anchor point.
	 *
	 * @type Point
	 * @bean
	 */
	getHandle2: function() {
		return this._segment2._handleIn;
	},

	setHandle2: function(point) {
		point = Point.read(arguments);
		this._segment2._handleIn.set(point.x, point.y);
	},

	/**
	 * The first segment of the curve.
	 *
	 * @type Segment
	 * @bean
	 */
	getSegment1: function() {
		return this._segment1;
	},

	/**
	 * The second segment of the curve.
	 *
	 * @type Segment
	 * @bean
	 */
	getSegment2: function() {
		return this._segment2;
	},

	/**
	 * The path that the curve belongs to.
	 *
	 * @type Path
	 * @bean
	 */
	getPath: function() {
		return this._path;
	},

	/**
	 * The index of the curve in the {@link Path#curves} array.
	 *
	 * @type Number
	 * @bean
	 */
	getIndex: function() {
		return this._segment1._index;
	},

	/**
	 * The next curve in the {@link Path#curves} array that the curve
	 * belongs to.
	 *
	 * @type Curve
	 * @bean
	 */
	getNext: function() {
		var curves = this._path && this._path._curves;
		return curves && (curves[this._segment1._index + 1]
				|| this._path._closed && curves[0]) || null;
	},

	/**
	 * The previous curve in the {@link Path#curves} array that the curve
	 * belongs to.
	 *
	 * @type Curve
	 * @bean
	 */
	getPrevious: function() {
		var curves = this._path && this._path._curves;
		return curves && (curves[this._segment1._index - 1]
				|| this._path._closed && curves[curves.length - 1]) || null;
	},

	/**
	 * Specifies whether the handles of the curve are selected.
	 *
	 * @type Boolean
	 * @bean
	 */
	isSelected: function() {
		return this.getHandle1().isSelected() && this.getHandle2().isSelected();
	},

	setSelected: function(selected) {
		this.getHandle1().setSelected(selected);
		this.getHandle2().setSelected(selected);
	},

	getValues: function() {
		return Curve.getValues(this._segment1, this._segment2);
	},

	getPoints: function() {
		// Convert to array of absolute points
		var coords = this.getValues(),
			points = [];
		for (var i = 0; i < 8; i += 2)
			points.push(Point.create(coords[i], coords[i + 1]));
		return points;
	},

	// DOCS: document Curve#getLength(from, to)
	/**
	 * The approximated length of the curve in points.
	 *
	 * @type Number
	 * @bean
	 */
	getLength: function(/* from, to */) {
		// Hide parameters from Bootstrap so it injects bean too
		var from = arguments[0],
			to = arguments[1];
			fullLength = arguments.length == 0 || from == 0 && to == 1;
		if (fullLength && this._length != null)
			return this._length;
		var length = Curve.getLength(this.getValues(), from, to);
		if (fullLength)
			this._length = length;
		return length;
	},

	getPart: function(from, to) {
		return new Curve(Curve.getPart(this.getValues(), from, to));
	},

	/**
	 * Checks if this curve is linear, meaning it does not define any curve
	 * handle.

	 * @return {Boolean} {@true the curve is linear}
	 */
	isLinear: function() {
		return this._segment1._handleOut.isZero()
				&& this._segment2._handleIn.isZero();
	},

	// PORT: Add support for start parameter to Sg
	// PORT: Rename #getParameter(length) -> #getParameterAt(offset)
	// DOCS: Document #getParameter(length, start)
	/**
	 * @param {Number} offset
	 * @param {Number} [start]
	 * @return {Number}
	 */
	getParameterAt: function(offset, start) {
		return Curve.getParameterAt(this.getValues(), offset,
				start !== undefined ? start : offset < 0 ? 1 : 0);
	},

	/**
	 * Returns the point on the curve at the specified position.
	 *
	 * @param {Number} parameter the position at which to find the point as
	 *        a value between {@code 0} and {@code 1}.
	 * @return {Point}
	 */
	getPoint: function(parameter) {
		return Curve.evaluate(this.getValues(), parameter, 0);
	},

	/**
	 * Returns the tangent point on the curve at the specified position.
	 *
	 * @param {Number} parameter the position at which to find the tangent
	 *        point as a value between {@code 0} and {@code 1}.
	 */
	getTangent: function(parameter) {
		return Curve.evaluate(this.getValues(), parameter, 1);
	},

	/**
	 * Returns the normal point on the curve at the specified position.
	 *
	 * @param {Number} parameter the position at which to find the normal
	 *        point as a value between {@code 0} and {@code 1}.
	 */
	getNormal: function(parameter) {
		return Curve.evaluate(this.getValues(), parameter, 2);
	},

	/**
	 * @param {Point} point
	 * @return {Number}
	 */
	getParameter: function(point) {
		point = Point.read(point);
		return Curve.getParameter(this.getValues(), point.x, point.y);
	},

	getCrossings: function(point, roots) {
		// Implement the crossing number algorithm:
		// http://en.wikipedia.org/wiki/Point_in_polygon
		// Solve the y-axis cubic polynominal for point.y and count all
		// solutions to the right of point.x as crossings.
		var vals = this.getValues(),
			num = Curve.solveCubic(vals, 1, point.y, roots),
			crossings = 0;
		for (var i = 0; i < num; i++) {
			var t = roots[i];
			if (t >= 0 && t < 1 && Curve.evaluate(vals, t, 0).x > point.x) {
				// If we're close to 0 and are not changing y-direction from the
				// previous curve, do not count this root, as we're merely
				// touching a tip. Passing 1 for Curve.evaluate()'s type means
				// we're calculating tangents, and then check their y-slope for
				// a change of direction:
				if (t < Numerical.TOLERANCE && Curve.evaluate(
							this.getPrevious().getValues(), 1, 1).y
						* Curve.evaluate(vals, t, 1).y >= 0)
					continue;
				crossings++;
			}
		}
		return crossings;
	},

	// TODO: getLocation
	// TODO: getIntersections
	// TODO: adjustThroughPoint

	/**
	 * Returns a reversed version of the curve, without modifying the curve
	 * itself.
	 *
	 * @return {Curve} a reversed version of the curve
	 */
	reverse: function() {
		return new Curve(this._segment2.reverse(), this._segment1.reverse());
	},

	// TODO: divide
	// TODO: split

	/**
	 * Returns a copy of the curve.
	 *
	 * @return {Curve}
	 */
	clone: function() {
		return new Curve(this._segment1, this._segment2);
	},

	/**
	 * @return {String} A string representation of the curve.
	 */
	toString: function() {
		var parts = [ 'point1: ' + this._segment1._point ];
		if (!this._segment1._handleOut.isZero())
			parts.push('handle1: ' + this._segment1._handleOut);
		if (!this._segment2._handleIn.isZero())
			parts.push('handle2: ' + this._segment2._handleIn);
		parts.push('point2: ' + this._segment2._point);
		return '{ ' + parts.join(', ') + ' }';
	},

	statics: {
		create: function(path, segment1, segment2) {
			var curve = new Curve(Curve.dont);
			curve._path = path;
			curve._segment1 = segment1;
			curve._segment2 = segment2;
			return curve;
		},

		getValues: function(segment1, segment2) {
			var p1 = segment1._point,
				h1 = segment1._handleOut,
				h2 = segment2._handleIn,
				p2 = segment2._point;
    		return [
    			p1._x, p1._y,
    			p1._x + h1._x, p1._y + h1._y,
    			p2._x + h2._x, p2._y + h2._y,
    			p2._x, p2._y
    		];
		},

		evaluate: function(v, t, type) {
			var p1x = v[0], p1y = v[1],
				c1x = v[2], c1y = v[3],
				c2x = v[4], c2y = v[5],
				p2x = v[6], p2y = v[7],
				x, y;

			// Handle special case at beginning / end of curve
			// PORT: Change in Sg too, so 0.000000000001 won't be
			// required anymore
			if (type == 0 && (t == 0 || t == 1)) {
				x = t == 0 ? p1x : p2x;
				y = t == 0 ? p1y : p2y;
			} else {
				// TODO: Find a better solution for this:
				// Prevent tangents and normals of length 0:
				var tMin = Numerical.TOLERANCE;
				if (t < tMin && c1x == p1x && c1y == p1y)
					t = tMin;
				else if (t > 1 - tMin && c2x == p2x && c2y == p2y)
					t = 1 - tMin;
				// Calculate the polynomial coefficients.
				var cx = 3 * (c1x - p1x),
					bx = 3 * (c2x - c1x) - cx,
					ax = p2x - p1x - cx - bx,

					cy = 3 * (c1y - p1y),
					by = 3 * (c2y - c1y) - cy,
					ay = p2y - p1y - cy - by;

				switch (type) {
				case 0: // point
					// Calculate the curve point at parameter value t
					x = ((ax * t + bx) * t + cx) * t + p1x;
					y = ((ay * t + by) * t + cy) * t + p1y;
					break;
				case 1: // tangent
				case 2: // normal
					// Simply use the derivation of the bezier function for both
					// the x and y coordinates:
					x = (3 * ax * t + 2 * bx) * t + cx;
					y = (3 * ay * t + 2 * by) * t + cy;
					break;
				}
			}
			// The normal is simply the rotated tangent:
			// TODO: Rotate normals the other way in Scriptographer too?
			// (Depending on orientation, I guess?)
			return type == 2 ? new Point(y, -x) : new Point(x, y);
		},

		subdivide: function(v, t) {
			var p1x = v[0], p1y = v[1],
				c1x = v[2], c1y = v[3],
				c2x = v[4], c2y = v[5],
				p2x = v[6], p2y = v[7];
			if (t === undefined)
				t = 0.5;
			// Triangle computation, with loops unrolled.
			var u = 1 - t,
				// Interpolate from 4 to 3 points
				p3x = u * p1x + t * c1x, p3y = u * p1y + t * c1y,
				p4x = u * c1x + t * c2x, p4y = u * c1y + t * c2y,
				p5x = u * c2x + t * p2x, p5y = u * c2y + t * p2y,
				// Interpolate from 3 to 2 points
				p6x = u * p3x + t * p4x, p6y = u * p3y + t * p4y,
				p7x = u * p4x + t * p5x, p7y = u * p4y + t * p5y,
				// Interpolate from 2 points to 1 point
				p8x = u * p6x + t * p7x, p8y = u * p6y + t * p7y;
			// We now have all the values we need to build the subcurves:
			return [
				[p1x, p1y, p3x, p3y, p6x, p6y, p8x, p8y], // left
				[p8x, p8y, p7x, p7y, p5x, p5y, p2x, p2y] // right
			];
		},

		// Converts from the point coordinates (p1, c1, c2, p2) for one axis to
		// the polynomial coefficients and solves the polynomial for val
		solveCubic: function (v, coord, val, roots) {
			var p1 = v[coord],
				c1 = v[coord + 2],
				c2 = v[coord + 4],
				p2 = v[coord + 6],
				c = 3 * (c1 - p1),
				b = 3 * (c2 - c1) - c,
				a = p2 - p1 - c - b;
			return Numerical.solveCubic(a, b, c, p1 - val, roots,
					Numerical.TOLERANCE);
		},

		getParameter: function(v, x, y) {
			var txs = [],
				tys = [],
				sx = Curve.solveCubic(v, 0, x, txs),
				sy = Curve.solveCubic(v, 1, y, tys),
				tx, ty;
			// sx, sy == -1 means infinite solutions:
			// Loop through all solutions for x and match with solutions for y,
			// to see if we either have a matching pair, or infinite solutions
			// for one or the other.
			for (var cx = 0;  sx == -1 || cx < sx;) {
				if (sx == -1 || (tx = txs[cx++]) >= 0 && tx <= 1) {
					for (var cy = 0; sy == -1 || cy < sy;) {
						if (sy == -1 || (ty = tys[cy++]) >= 0 && ty <= 1) {
							// Handle infinite solutions by assigning root of
							// the other polynomial
							if (sx == -1) tx = ty;
							else if (sy == -1) ty = tx;
							// Use average if we're within tolerance
							if (Math.abs(tx - ty) < Numerical.TOLERANCE)
								return (tx + ty) * 0.5;
						}
					}
					// Avoid endless loops here: If sx is infinite and there was
					// no fitting ty, there's no solution for this bezier
					if (sx == -1)
						break;
				}
			}
			return null;
		},

		// TODO: Find better name
		getPart: function(v, from, to) {
			if (from > 0)
				v = Curve.subdivide(v, from)[1]; // [1] right
			// Interpolate the  parameter at 'to' in the new curve and
			// cut there.
			if (to < 1)
				v = Curve.subdivide(v, (to - from) / (1 - from))[0]; // [0] left
			return v;
		},

		isFlatEnough: function(v) {
			// Thanks to Kaspar Fischer for the following:
			// http://www.inf.ethz.ch/personal/fischerk/pubs/bez.pdf
			var p1x = v[0], p1y = v[1],
				c1x = v[2], c1y = v[3],
				c2x = v[4], c2y = v[5],
				p2x = v[6], p2y = v[7],
				ux = 3 * c1x - 2 * p1x - p2x,
				uy = 3 * c1y - 2 * p1y - p2y,
				vx = 3 * c2x - 2 * p2x - p1x,
				vy = 3 * c2y - 2 * p2y - p1y;
			return Math.max(ux * ux, vx * vx) + Math.max(uy * uy, vy * vy) < 1;
		}
	}
}, new function() { // Scope for methods that require numerical integration

	function getLengthIntegrand(v) {
		// Calculate the coefficients of a Bezier derivative.
		var p1x = v[0], p1y = v[1],
			c1x = v[2], c1y = v[3],
			c2x = v[4], c2y = v[5],
			p2x = v[6], p2y = v[7],

			ax = 9 * (c1x - c2x) + 3 * (p2x - p1x),
			bx = 6 * (p1x + c2x) - 12 * c1x,
			cx = 3 * (c1x - p1x),

			ay = 9 * (c1y - c2y) + 3 * (p2y - p1y),
			by = 6 * (p1y + c2y) - 12 * c1y,
			cy = 3 * (c1y - p1y);

		return function(t) {
			// Calculate quadratic equations of derivatives for x and y
			var dx = (ax * t + bx) * t + cx,
				dy = (ay * t + by) * t + cy;
			return Math.sqrt(dx * dx + dy * dy);
		};
	}

	// Amount of integral evaluations for the interval 0 <= a < b <= 1
	function getIterations(a, b) {
		// Guess required precision based and size of range...
		// TODO: There should be much better educated guesses for
		// this. Also, what does this depend on? Required precision?
		return Math.max(2, Math.min(16, Math.ceil(Math.abs(b - a) * 32)));
	}

	return {
		statics: true,

		getLength: function(v, a, b) {
			if (a === undefined)
				a = 0;
			if (b === undefined)
				b = 1;
			// if (p1 == c1 && p2 == c2):
			if (v[0] == v[2] && v[1] == v[3] && v[6] == v[4] && v[7] == v[5]) {
				// Straight line
				var dx = v[6] - v[0], // p2x - p1x
					dy = v[7] - v[1]; // p2y - p1y
				return (b - a) * Math.sqrt(dx * dx + dy * dy);
			}
			var ds = getLengthIntegrand(v);
			return Numerical.integrate(ds, a, b, getIterations(a, b));
		},

		getParameterAt: function(v, offset, start) {
			if (offset == 0)
				return start;
			// See if we're going forward or backward, and handle cases
			// differently
			var forward = offset > 0,
				a = forward ? start : 0,
				b = forward ? 1 : start,
				offset = Math.abs(offset),
				// Use integrand to calculate both range length and part
				// lengths in f(t) below.
				ds = getLengthIntegrand(v),
				// Get length of total range
				rangeLength = Numerical.integrate(ds, a, b,
						getIterations(a, b));
			if (offset >= rangeLength)
				return forward ? b : a;
			// Use offset / rangeLength for an initial guess for t, to
			// bring us closer:
			var guess = offset / rangeLength,
				length = 0;
			// Iteratively calculate curve range lengths, and add them up,
			// using integration precision depending on the size of the
			// range. This is much faster and also more precise than not
			// modifing start and calculating total length each time.
			function f(t) {
				var count = getIterations(start, t);
				length += start < t
						? Numerical.integrate(ds, start, t, count)
						: -Numerical.integrate(ds, t, start, count);
				start = t;
				return length - offset;
			}
			return Numerical.findRoot(f, ds,
					forward ? a + guess : b - guess, // Initial guess for x
					a, b, 16, Numerical.TOLERANCE);
		}
	};
}, new function() { // Scope for nearest point on curve problem

	// Solving the Nearest Point-on-Curve Problem and A Bezier-Based Root-Finder
	// by Philip J. Schneider from "Graphics Gems", Academic Press, 1990
	// Optimised for Paper.js

	var maxDepth = 32,
		epsilon = Math.pow(2, -maxDepth - 1);

	var zCubic = [
		[1.0, 0.6, 0.3, 0.1],
		[0.4, 0.6, 0.6, 0.4],
		[0.1, 0.3, 0.6, 1.0]
	];

	var xAxis = new Line(new Point(0, 0), new Point(1, 0));

	 /**
	  * Given a point and a Bezier curve, generate a 5th-degree Bezier-format
	  * equation whose solution finds the point on the curve nearest the
	  * user-defined point.
	  */
	function toBezierForm(v, point) {
		var n = 3, // degree of B(t)
	 		degree = 5, // degree of B(t) . P
			c = [],
			d = [],
			cd = [],
			w = [];
		for(var i = 0; i <= n; i++) {
			// Determine the c's -- these are vectors created by subtracting
			// point point from each of the control points
			c[i] = v[i].subtract(point);
			// Determine the d's -- these are vectors created by subtracting
			// each control point from the next
			if (i < n)
				d[i] = v[i + 1].subtract(v[i]).multiply(n);
		}

		// Create the c,d table -- this is a table of dot products of the
		// c's and d's
		for (var row = 0; row < n; row++) {
			cd[row] = [];
			for (var column = 0; column <= n; column++)
				cd[row][column] = d[row].dot(c[column]);
		}

		// Now, apply the z's to the dot products, on the skew diagonal
		// Also, set up the x-values, making these "points"
		for (var i = 0; i <= degree; i++)
			w[i] = new Point(i / degree, 0);

		for (k = 0; k <= degree; k++) {
			var lb = Math.max(0, k - n + 1),
				ub = Math.min(k, n);
			for (var i = lb; i <= ub; i++) {
				var j = k - i;
				w[k].y += cd[j][i] * zCubic[j][i];
			}
		}

		return w;
	}

	/**
	 * Given a 5th-degree equation in Bernstein-Bezier form, find all of the
	 * roots in the interval [0, 1].  Return the number of roots found.
	 */
	function findRoots(w, depth) {
		switch (countCrossings(w)) {
		case 0:
			// No solutions here
			return [];
		case 1:
			// Unique solution
			// Stop recursion when the tree is deep enough
			// if deep enough, return 1 solution at midpoint
			if (depth >= maxDepth)
				return [0.5 * (w[0].x + w[5].x)];
			// Compute intersection of chord from first control point to last
			// with x-axis.
			if (isFlatEnough(w)) {
				var line = new Line(w[0], w[5], true);
				// Compare the line's squared length with EPSILON. If we're
				// below, #intersect() will return null because of division
				// by near-zero.
				return [ line.vector.getLength(true) <= Numerical.EPSILON
						? line.point.x
						: xAxis.intersect(line).x ];
			}
		}

		// Otherwise, solve recursively after
		// subdividing control polygon
		var p = [[]],
			left = [],
			right = [];
		for (var j = 0; j <= 5; j++)
		 	p[0][j] = new Point(w[j]);

		// Triangle computation
		for (var i = 1; i <= 5; i++) {
			p[i] = [];
			for (var j = 0 ; j <= 5 - i; j++)
				p[i][j] = p[i - 1][j].add(p[i - 1][j + 1]).multiply(0.5);
		}
		for (var j = 0; j <= 5; j++) {
			left[j]  = p[j][0];
			right[j] = p[5 - j][j];
		}

		return findRoots(left, depth + 1).concat(findRoots(right, depth + 1));
	}

	/**
	 * Count the number of times a Bezier control polygon  crosses the x-axis.
	 * This number is >= the number of roots.
	 */
	function countCrossings(v) {
		var crossings = 0,
			prevSign = null;
		for (var i = 0, l = v.length; i < l; i++)  {
			var sign = v[i].y < 0 ? -1 : 1;
			if (prevSign != null && sign != prevSign)
				crossings++;
			prevSign = sign;
		}
		return crossings;
	}

	/**
	 * Check if the control polygon of a Bezier curve is flat enough for
	 * recursive subdivision to bottom out.
	 */
	function isFlatEnough(v) {
		// Find the  perpendicular distance from each interior control point to
		// line connecting v[0] and v[degree]

		// Derive the implicit equation for line connecting first
		// and last control points
		var n = v.length - 1,
			a = v[0].y - v[n].y,
			b = v[n].x - v[0].x,
			c = v[0].x * v[n].y - v[n].x * v[0].y,
			maxAbove = 0,
			maxBelow = 0;
		// Find the largest distance
		for (var i = 1; i < n; i++) {
			// Compute distance from each of the points to that line
			var val = a * v[i].x + b * v[i].y + c,
				dist = val * val;
			if (val < 0 && dist > maxBelow) {
				maxBelow = dist;
			} else if (dist > maxAbove) {
				maxAbove = dist;
			}
		}
		// Compute intercepts of bounding box
		return Math.abs((maxAbove + maxBelow) / (2 * a * (a * a + b * b)))
				< epsilon;
	}

	return {
		getNearestLocation: function(point) {
			// NOTE: If we allow #matrix on Path, we need to inverse-transform
			// point here first.
			// point = this._matrix.inverseTransform(point);
			var w = toBezierForm(this.getPoints(), point);
			// Also look at beginning and end of curve (t = 0 / 1)
			var roots = findRoots(w, 0).concat([0, 1]);
			var minDist = Infinity,
				minT,
				minPoint;
			// There are always roots, since we add [0, 1] above.
			for (var i = 0; i < roots.length; i++) {
				var pt = this.getPoint(roots[i]),
					dist = point.getDistance(pt, true);
				// We're comparing squared distances
				if (dist < minDist) {
					minDist = dist;
					minT = roots[i];
					minPoint = pt;
				}
			}
			return new CurveLocation(this, minT, minPoint, Math.sqrt(minDist));
		},

		getNearestPoint: function(point) {
			return this.getNearestLocation(point).getPoint();
		}
	};
});
