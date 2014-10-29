/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());/**
 * History.js Native Adapter
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

// Closure
(function(window,undefined){
	"use strict";

	// Localise Globals
	var History = window.History = window.History||{};

	// Check Existence
	if ( typeof History.Adapter !== 'undefined' ) {
		throw new Error('History.js Adapter has already been loaded...');
	}

	// Add the Adapter
	History.Adapter = {
		/**
		 * History.Adapter.handlers[uid][eventName] = Array
		 */
		handlers: {},

		/**
		 * History.Adapter._uid
		 * The current element unique identifier
		 */
		_uid: 1,

		/**
		 * History.Adapter.uid(element)
		 * @param {Element} element
		 * @return {String} uid
		 */
		uid: function(element){
			return element._uid || (element._uid = History.Adapter._uid++);
		},

		/**
		 * History.Adapter.bind(el,event,callback)
		 * @param {Element} element
		 * @param {String} eventName - custom and standard events
		 * @param {Function} callback
		 * @return
		 */
		bind: function(element,eventName,callback){
			// Prepare
			var uid = History.Adapter.uid(element);

			// Apply Listener
			History.Adapter.handlers[uid] = History.Adapter.handlers[uid] || {};
			History.Adapter.handlers[uid][eventName] = History.Adapter.handlers[uid][eventName] || [];
			History.Adapter.handlers[uid][eventName].push(callback);

			// Bind Global Listener
			element['on'+eventName] = (function(element,eventName){
				return function(event){
					History.Adapter.trigger(element,eventName,event);
				};
			})(element,eventName);
		},

		/**
		 * History.Adapter.trigger(el,event)
		 * @param {Element} element
		 * @param {String} eventName - custom and standard events
		 * @param {Object} event - a object of event data
		 * @return
		 */
		trigger: function(element,eventName,event){
			// Prepare
			event = event || {};
			var uid = History.Adapter.uid(element),
				i,n;

			// Apply Listener
			History.Adapter.handlers[uid] = History.Adapter.handlers[uid] || {};
			History.Adapter.handlers[uid][eventName] = History.Adapter.handlers[uid][eventName] || [];

			// Fire Listeners
			for ( i=0,n=History.Adapter.handlers[uid][eventName].length; i<n; ++i ) {
				History.Adapter.handlers[uid][eventName][i].apply(this,[event]);
			}
		},

		/**
		 * History.Adapter.extractEventData(key,event,extra)
		 * @param {String} key - key for the event data to extract
		 * @param {String} event - custom and standard events
		 * @return {mixed}
		 */
		extractEventData: function(key,event){
			var result = (event && event[key]) || undefined;
			return result;
		},

		/**
		 * History.Adapter.onDomLoad(callback)
		 * @param {Function} callback
		 * @return
		 */
		onDomLoad: function(callback) {
			var timeout = window.setTimeout(function(){
				callback();
			},2000);
			window.onload = function(){
				clearTimeout(timeout);
				callback();
			};
		}
	};

	// Try to Initialise History
	if ( typeof History.init !== 'undefined' ) {
		History.init();
	}

})(window);
/**
 * History.js HTML4 Support
 * Depends on the HTML5 Support
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function(window,undefined){
	"use strict";

	// ========================================================================
	// Initialise

	// Localise Globals
	var
		document = window.document, // Make sure we are using the correct document
		setTimeout = window.setTimeout||setTimeout,
		clearTimeout = window.clearTimeout||clearTimeout,
		setInterval = window.setInterval||setInterval,
		History = window.History = window.History||{}; // Public History Object

	// Check Existence
	if ( typeof History.initHtml4 !== 'undefined' ) {
		throw new Error('History.js HTML4 Support has already been loaded...');
	}


	// ========================================================================
	// Initialise HTML4 Support

	// Initialise HTML4 Support
	History.initHtml4 = function(){
		// Initialise
		if ( typeof History.initHtml4.initialized !== 'undefined' ) {
			// Already Loaded
			return false;
		}
		else {
			History.initHtml4.initialized = true;
		}


		// ====================================================================
		// Properties

		/**
		 * History.enabled
		 * Is History enabled?
		 */
		History.enabled = true;


		// ====================================================================
		// Hash Storage

		/**
		 * History.savedHashes
		 * Store the hashes in an array
		 */
		History.savedHashes = [];

		/**
		 * History.isLastHash(newHash)
		 * Checks if the hash is the last hash
		 * @param {string} newHash
		 * @return {boolean} true
		 */
		History.isLastHash = function(newHash){
			// Prepare
			var oldHash = History.getHashByIndex(),
				isLast;

			// Check
			isLast = newHash === oldHash;

			// Return isLast
			return isLast;
		};

		/**
		 * History.isHashEqual(newHash, oldHash)
		 * Checks to see if two hashes are functionally equal
		 * @param {string} newHash
		 * @param {string} oldHash
		 * @return {boolean} true
		 */
		History.isHashEqual = function(newHash, oldHash){
			newHash = encodeURIComponent(newHash).replace(/%25/g, "%");
			oldHash = encodeURIComponent(oldHash).replace(/%25/g, "%");
			return newHash === oldHash;
		};

		/**
		 * History.saveHash(newHash)
		 * Push a Hash
		 * @param {string} newHash
		 * @return {boolean} true
		 */
		History.saveHash = function(newHash){
			// Check Hash
			if ( History.isLastHash(newHash) ) {
				return false;
			}

			// Push the Hash
			History.savedHashes.push(newHash);

			// Return true
			return true;
		};

		/**
		 * History.getHashByIndex()
		 * Gets a hash by the index
		 * @param {integer} index
		 * @return {string}
		 */
		History.getHashByIndex = function(index){
			// Prepare
			var hash = null;

			// Handle
			if ( typeof index === 'undefined' ) {
				// Get the last inserted
				hash = History.savedHashes[History.savedHashes.length-1];
			}
			else if ( index < 0 ) {
				// Get from the end
				hash = History.savedHashes[History.savedHashes.length+index];
			}
			else {
				// Get from the beginning
				hash = History.savedHashes[index];
			}

			// Return hash
			return hash;
		};


		// ====================================================================
		// Discarded States

		/**
		 * History.discardedHashes
		 * A hashed array of discarded hashes
		 */
		History.discardedHashes = {};

		/**
		 * History.discardedStates
		 * A hashed array of discarded states
		 */
		History.discardedStates = {};

		/**
		 * History.discardState(State)
		 * Discards the state by ignoring it through History
		 * @param {object} State
		 * @return {true}
		 */
		History.discardState = function(discardedState,forwardState,backState){
			//History.debug('History.discardState', arguments);
			// Prepare
			var discardedStateHash = History.getHashByState(discardedState),
				discardObject;

			// Create Discard Object
			discardObject = {
				'discardedState': discardedState,
				'backState': backState,
				'forwardState': forwardState
			};

			// Add to DiscardedStates
			History.discardedStates[discardedStateHash] = discardObject;

			// Return true
			return true;
		};

		/**
		 * History.discardHash(hash)
		 * Discards the hash by ignoring it through History
		 * @param {string} hash
		 * @return {true}
		 */
		History.discardHash = function(discardedHash,forwardState,backState){
			//History.debug('History.discardState', arguments);
			// Create Discard Object
			var discardObject = {
				'discardedHash': discardedHash,
				'backState': backState,
				'forwardState': forwardState
			};

			// Add to discardedHash
			History.discardedHashes[discardedHash] = discardObject;

			// Return true
			return true;
		};

		/**
		 * History.discardedState(State)
		 * Checks to see if the state is discarded
		 * @param {object} State
		 * @return {bool}
		 */
		History.discardedState = function(State){
			// Prepare
			var StateHash = History.getHashByState(State),
				discarded;

			// Check
			discarded = History.discardedStates[StateHash]||false;

			// Return true
			return discarded;
		};

		/**
		 * History.discardedHash(hash)
		 * Checks to see if the state is discarded
		 * @param {string} State
		 * @return {bool}
		 */
		History.discardedHash = function(hash){
			// Check
			var discarded = History.discardedHashes[hash]||false;

			// Return true
			return discarded;
		};

		/**
		 * History.recycleState(State)
		 * Allows a discarded state to be used again
		 * @param {object} data
		 * @param {string} title
		 * @param {string} url
		 * @return {true}
		 */
		History.recycleState = function(State){
			//History.debug('History.recycleState', arguments);
			// Prepare
			var StateHash = History.getHashByState(State);

			// Remove from DiscardedStates
			if ( History.discardedState(State) ) {
				delete History.discardedStates[StateHash];
			}

			// Return true
			return true;
		};


		// ====================================================================
		// HTML4 HashChange Support

		if ( History.emulated.hashChange ) {
			/*
			 * We must emulate the HTML4 HashChange Support by manually checking for hash changes
			 */

			/**
			 * History.hashChangeInit()
			 * Init the HashChange Emulation
			 */
			History.hashChangeInit = function(){
				// Define our Checker Function
				History.checkerFunction = null;

				// Define some variables that will help in our checker function
				var lastDocumentHash = '',
					iframeId, iframe,
					lastIframeHash, checkerRunning,
					startedWithHash = Boolean(History.getHash());

				// Handle depending on the browser
				if ( History.isInternetExplorer() ) {
					// IE6 and IE7
					// We need to use an iframe to emulate the back and forward buttons

					// Create iFrame
					iframeId = 'historyjs-iframe';
					iframe = document.createElement('iframe');

					// Adjust iFarme
					// IE 6 requires iframe to have a src on HTTPS pages, otherwise it will throw a
					// "This page contains both secure and nonsecure items" warning.
					iframe.setAttribute('id', iframeId);
					iframe.setAttribute('src', '#');
					iframe.style.display = 'none';

					// Append iFrame
					document.body.appendChild(iframe);

					// Create initial history entry
					iframe.contentWindow.document.open();
					iframe.contentWindow.document.close();

					// Define some variables that will help in our checker function
					lastIframeHash = '';
					checkerRunning = false;

					// Define the checker function
					History.checkerFunction = function(){
						// Check Running
						if ( checkerRunning ) {
							return false;
						}

						// Update Running
						checkerRunning = true;

						// Fetch
						var
							documentHash = History.getHash(),
							iframeHash = History.getHash(iframe.contentWindow.document);

						// The Document Hash has changed (application caused)
						if ( documentHash !== lastDocumentHash ) {
							// Equalise
							lastDocumentHash = documentHash;

							// Create a history entry in the iframe
							if ( iframeHash !== documentHash ) {
								//History.debug('hashchange.checker: iframe hash change', 'documentHash (new):', documentHash, 'iframeHash (old):', iframeHash);

								// Equalise
								lastIframeHash = iframeHash = documentHash;

								// Create History Entry
								iframe.contentWindow.document.open();
								iframe.contentWindow.document.close();

								// Update the iframe's hash
								iframe.contentWindow.document.location.hash = History.escapeHash(documentHash);
							}

							// Trigger Hashchange Event
							History.Adapter.trigger(window,'hashchange');
						}

						// The iFrame Hash has changed (back button caused)
						else if ( iframeHash !== lastIframeHash ) {
							//History.debug('hashchange.checker: iframe hash out of sync', 'iframeHash (new):', iframeHash, 'documentHash (old):', documentHash);

							// Equalise
							lastIframeHash = iframeHash;
							
							// If there is no iframe hash that means we're at the original
							// iframe state.
							// And if there was a hash on the original request, the original
							// iframe state was replaced instantly, so skip this state and take
							// the user back to where they came from.
							if (startedWithHash && iframeHash === '') {
								History.back();
							}
							else {
								// Update the Hash
								History.setHash(iframeHash,false);
							}
						}

						// Reset Running
						checkerRunning = false;

						// Return true
						return true;
					};
				}
				else {
					// We are not IE
					// Firefox 1 or 2, Opera

					// Define the checker function
					History.checkerFunction = function(){
						// Prepare
						var documentHash = History.getHash()||'';

						// The Document Hash has changed (application caused)
						if ( documentHash !== lastDocumentHash ) {
							// Equalise
							lastDocumentHash = documentHash;

							// Trigger Hashchange Event
							History.Adapter.trigger(window,'hashchange');
						}

						// Return true
						return true;
					};
				}

				// Apply the checker function
				History.intervalList.push(setInterval(History.checkerFunction, History.options.hashChangeInterval));

				// Done
				return true;
			}; // History.hashChangeInit

			// Bind hashChangeInit
			History.Adapter.onDomLoad(History.hashChangeInit);

		} // History.emulated.hashChange


		// ====================================================================
		// HTML5 State Support

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/*
			 * We must emulate the HTML5 State Management by using HTML4 HashChange
			 */

			/**
			 * History.onHashChange(event)
			 * Trigger HTML5's window.onpopstate via HTML4 HashChange Support
			 */
			History.onHashChange = function(event){
				//History.debug('History.onHashChange', arguments);

				// Prepare
				var currentUrl = ((event && event.newURL) || History.getLocationHref()),
					currentHash = History.getHashByUrl(currentUrl),
					currentState = null,
					currentStateHash = null,
					currentStateHashExits = null,
					discardObject;

				// Check if we are the same state
				if ( History.isLastHash(currentHash) ) {
					// There has been no change (just the page's hash has finally propagated)
					//History.debug('History.onHashChange: no change');
					History.busy(false);
					return false;
				}

				// Reset the double check
				History.doubleCheckComplete();

				// Store our location for use in detecting back/forward direction
				History.saveHash(currentHash);

				// Expand Hash
				if ( currentHash && History.isTraditionalAnchor(currentHash) ) {
					//History.debug('History.onHashChange: traditional anchor', currentHash);
					// Traditional Anchor Hash
					History.Adapter.trigger(window,'anchorchange');
					History.busy(false);
					return false;
				}

				// Create State
				currentState = History.extractState(History.getFullUrl(currentHash||History.getLocationHref()),true);

				// Check if we are the same state
				if ( History.isLastSavedState(currentState) ) {
					//History.debug('History.onHashChange: no change');
					// There has been no change (just the page's hash has finally propagated)
					History.busy(false);
					return false;
				}

				// Create the state Hash
				currentStateHash = History.getHashByState(currentState);

				// Check if we are DiscardedState
				discardObject = History.discardedState(currentState);
				if ( discardObject ) {
					// Ignore this state as it has been discarded and go back to the state before it
					if ( History.getHashByIndex(-2) === History.getHashByState(discardObject.forwardState) ) {
						// We are going backwards
						//History.debug('History.onHashChange: go backwards');
						History.back(false);
					} else {
						// We are going forwards
						//History.debug('History.onHashChange: go forwards');
						History.forward(false);
					}
					return false;
				}

				// Push the new HTML5 State
				//History.debug('History.onHashChange: success hashchange');
				History.pushState(currentState.data,currentState.title,encodeURI(currentState.url),false);

				// End onHashChange closure
				return true;
			};
			History.Adapter.bind(window,'hashchange',History.onHashChange);

			/**
			 * History.pushState(data,title,url)
			 * Add a new State to the history object, become it, and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.pushState = function(data,title,url,queue){
				//History.debug('History.pushState: called', arguments);

				// We assume that the URL passed in is URI-encoded, but this makes
				// sure that it's fully URI encoded; any '%'s that are encoded are
				// converted back into '%'s
				url = encodeURI(url).replace(/%25/g, "%");

				// Check the State
				if ( History.getHashByUrl(url) ) {
					throw new Error('History.js does not support states with fragment-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.pushState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.pushState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy
				History.busy(true);

				// Fetch the State Object
				var newState = History.createStateObject(data,title,url),
					newStateHash = History.getHashByState(newState),
					oldState = History.getState(false),
					oldStateHash = History.getHashByState(oldState),
					html4Hash = History.getHash(),
					wasExpected = History.expectedStateId == newState.id;

				// Store the newState
				History.storeState(newState);
				History.expectedStateId = newState.id;

				// Recycle the State
				History.recycleState(newState);

				// Force update of the title
				History.setTitle(newState);

				// Check if we are the same State
				if ( newStateHash === oldStateHash ) {
					//History.debug('History.pushState: no change', newStateHash);
					History.busy(false);
					return false;
				}

				// Update HTML5 State
				History.saveState(newState);

				// Fire HTML5 Event
				if(!wasExpected)
					History.Adapter.trigger(window,'statechange');

				// Update HTML4 Hash
				if ( !History.isHashEqual(newStateHash, html4Hash) && !History.isHashEqual(newStateHash, History.getShortUrl(History.getLocationHref())) ) {
					History.setHash(newStateHash,false);
				}
				
				History.busy(false);

				// End pushState closure
				return true;
			};

			/**
			 * History.replaceState(data,title,url)
			 * Replace the State and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.replaceState = function(data,title,url,queue){
				//History.debug('History.replaceState: called', arguments);

				// We assume that the URL passed in is URI-encoded, but this makes
				// sure that it's fully URI encoded; any '%'s that are encoded are
				// converted back into '%'s
				url = encodeURI(url).replace(/%25/g, "%");

				// Check the State
				if ( History.getHashByUrl(url) ) {
					throw new Error('History.js does not support states with fragment-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.replaceState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.replaceState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy
				History.busy(true);

				// Fetch the State Objects
				var newState        = History.createStateObject(data,title,url),
					newStateHash = History.getHashByState(newState),
					oldState        = History.getState(false),
					oldStateHash = History.getHashByState(oldState),
					previousState   = History.getStateByIndex(-2);

				// Discard Old State
				History.discardState(oldState,newState,previousState);

				// If the url hasn't changed, just store and save the state
				// and fire a statechange event to be consistent with the
				// html 5 api
				if ( newStateHash === oldStateHash ) {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;
	
					// Recycle the State
					History.recycleState(newState);
	
					// Force update of the title
					History.setTitle(newState);
					
					// Update HTML5 State
					History.saveState(newState);

					// Fire HTML5 Event
					//History.debug('History.pushState: trigger popstate');
					History.Adapter.trigger(window,'statechange');
					History.busy(false);
				}
				else {
					// Alias to PushState
					History.pushState(newState.data,newState.title,newState.url,false);
				}

				// End replaceState closure
				return true;
			};

		} // History.emulated.pushState



		// ====================================================================
		// Initialise

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/**
			 * Ensure initial state is handled correctly
			 */
			if ( History.getHash() && !History.emulated.hashChange ) {
				History.Adapter.onDomLoad(function(){
					History.Adapter.trigger(window,'hashchange');
				});
			}

		} // History.emulated.pushState

	}; // History.initHtml4

	// Try to Initialise History
	if ( typeof History.init !== 'undefined' ) {
		History.init();
	}

})(window);
/**
 * History.js Core
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function(window,undefined){
	"use strict";

	// ========================================================================
	// Initialise

	// Localise Globals
	var
		console = window.console||undefined, // Prevent a JSLint complain
		document = window.document, // Make sure we are using the correct document
		navigator = window.navigator, // Make sure we are using the correct navigator
		sessionStorage = false, // sessionStorage
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		setInterval = window.setInterval,
		clearInterval = window.clearInterval,
		JSON = window.JSON,
		alert = window.alert,
		History = window.History = window.History||{}, // Public History Object
		history = window.history; // Old History Object

	try {
		sessionStorage = window.sessionStorage; // This will throw an exception in some browsers when cookies/localStorage are explicitly disabled (i.e. Chrome)
		sessionStorage.setItem('TEST', '1');
		sessionStorage.removeItem('TEST');
	} catch(e) {
		sessionStorage = false;
	}

	// MooTools Compatibility
	JSON.stringify = JSON.stringify||JSON.encode;
	JSON.parse = JSON.parse||JSON.decode;

	// Check Existence
	if ( typeof History.init !== 'undefined' ) {
		throw new Error('History.js Core has already been loaded...');
	}

	// Initialise History
	History.init = function(options){
		// Check Load Status of Adapter
		if ( typeof History.Adapter === 'undefined' ) {
			return false;
		}

		// Check Load Status of Core
		if ( typeof History.initCore !== 'undefined' ) {
			History.initCore();
		}

		// Check Load Status of HTML4 Support
		if ( typeof History.initHtml4 !== 'undefined' ) {
			History.initHtml4();
		}

		// Return true
		return true;
	};


	// ========================================================================
	// Initialise Core

	// Initialise Core
	History.initCore = function(options){
		// Initialise
		if ( typeof History.initCore.initialized !== 'undefined' ) {
			// Already Loaded
			return false;
		}
		else {
			History.initCore.initialized = true;
		}


		// ====================================================================
		// Options

		/**
		 * History.options
		 * Configurable options
		 */
		History.options = History.options||{};

		/**
		 * History.options.hashChangeInterval
		 * How long should the interval be before hashchange checks
		 */
		History.options.hashChangeInterval = History.options.hashChangeInterval || 100;

		/**
		 * History.options.safariPollInterval
		 * How long should the interval be before safari poll checks
		 */
		History.options.safariPollInterval = History.options.safariPollInterval || 500;

		/**
		 * History.options.doubleCheckInterval
		 * How long should the interval be before we perform a double check
		 */
		History.options.doubleCheckInterval = History.options.doubleCheckInterval || 500;

		/**
		 * History.options.disableSuid
		 * Force History not to append suid
		 */
		History.options.disableSuid = History.options.disableSuid || false;

		/**
		 * History.options.storeInterval
		 * How long should we wait between store calls
		 */
		History.options.storeInterval = History.options.storeInterval || 1000;

		/**
		 * History.options.busyDelay
		 * How long should we wait between busy events
		 */
		History.options.busyDelay = History.options.busyDelay || 250;

		/**
		 * History.options.debug
		 * If true will enable debug messages to be logged
		 */
		History.options.debug = History.options.debug || false;

		/**
		 * History.options.initialTitle
		 * What is the title of the initial state
		 */
		History.options.initialTitle = History.options.initialTitle || document.title;

		/**
		 * History.options.html4Mode
		 * If true, will force HTMl4 mode (hashtags)
		 */
		History.options.html4Mode = History.options.html4Mode || false;

		/**
		 * History.options.delayInit
		 * Want to override default options and call init manually.
		 */
		History.options.delayInit = History.options.delayInit || false;


		// ====================================================================
		// Interval record

		/**
		 * History.intervalList
		 * List of intervals set, to be cleared when document is unloaded.
		 */
		History.intervalList = [];

		/**
		 * History.clearAllIntervals
		 * Clears all setInterval instances.
		 */
		History.clearAllIntervals = function(){
			var i, il = History.intervalList;
			if (typeof il !== "undefined" && il !== null) {
				for (i = 0; i < il.length; i++) {
					clearInterval(il[i]);
				}
				History.intervalList = null;
			}
		};


		// ====================================================================
		// Debug

		/**
		 * History.debug(message,...)
		 * Logs the passed arguments if debug enabled
		 */
		History.debug = function(){
			if ( (History.options.debug||false) ) {
				History.log.apply(History,arguments);
			}
		};

		/**
		 * History.log(message,...)
		 * Logs the passed arguments
		 */
		History.log = function(){
			// Prepare
			var
				consoleExists = !(typeof console === 'undefined' || typeof console.log === 'undefined' || typeof console.log.apply === 'undefined'),
				textarea = document.getElementById('log'),
				message,
				i,n,
				args,arg
				;

			// Write to Console
			if ( consoleExists ) {
				args = Array.prototype.slice.call(arguments);
				message = args.shift();
				if ( typeof console.debug !== 'undefined' ) {
					console.debug.apply(console,[message,args]);
				}
				else {
					console.log.apply(console,[message,args]);
				}
			}
			else {
				message = ("\n"+arguments[0]+"\n");
			}

			// Write to log
			for ( i=1,n=arguments.length; i<n; ++i ) {
				arg = arguments[i];
				if ( typeof arg === 'object' && typeof JSON !== 'undefined' ) {
					try {
						arg = JSON.stringify(arg);
					}
					catch ( Exception ) {
						// Recursive Object
					}
				}
				message += "\n"+arg+"\n";
			}

			// Textarea
			if ( textarea ) {
				textarea.value += message+"\n-----\n";
				textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight;
			}
			// No Textarea, No Console
			else if ( !consoleExists ) {
				alert(message);
			}

			// Return true
			return true;
		};


		// ====================================================================
		// Emulated Status

		/**
		 * History.getInternetExplorerMajorVersion()
		 * Get's the major version of Internet Explorer
		 * @return {integer}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 * @author James Padolsey <https://gist.github.com/527683>
		 */
		History.getInternetExplorerMajorVersion = function(){
			var result = History.getInternetExplorerMajorVersion.cached =
					(typeof History.getInternetExplorerMajorVersion.cached !== 'undefined')
				?	History.getInternetExplorerMajorVersion.cached
				:	(function(){
						var v = 3,
								div = document.createElement('div'),
								all = div.getElementsByTagName('i');
						while ( (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->') && all[0] ) {}
						return (v > 4) ? v : false;
					})()
				;
			return result;
		};

		/**
		 * History.isInternetExplorer()
		 * Are we using Internet Explorer?
		 * @return {boolean}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 */
		History.isInternetExplorer = function(){
			var result =
				History.isInternetExplorer.cached =
				(typeof History.isInternetExplorer.cached !== 'undefined')
					?	History.isInternetExplorer.cached
					:	Boolean(History.getInternetExplorerMajorVersion())
				;
			return result;
		};

		/**
		 * History.emulated
		 * Which features require emulating?
		 */

		if (History.options.html4Mode) {
			History.emulated = {
				pushState : true,
				hashChange: true
			};
		}

		else {

			History.emulated = {
				pushState: !Boolean(
					window.history && window.history.pushState && window.history.replaceState
					&& !(
						(/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i).test(navigator.userAgent) /* disable for versions of iOS before version 4.3 (8F190) */
						|| (/AppleWebKit\/5([0-2]|3[0-2])/i).test(navigator.userAgent) /* disable for the mercury iOS browser, or at least older versions of the webkit engine */
					)
				),
				hashChange: Boolean(
					!(('onhashchange' in window) || ('onhashchange' in document))
					||
					(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8)
				)
			};
		}

		/**
		 * History.enabled
		 * Is History enabled?
		 */
		History.enabled = !History.emulated.pushState;

		/**
		 * History.bugs
		 * Which bugs are present
		 */
		History.bugs = {
			/**
			 * Safari 5 and Safari iOS 4 fail to return to the correct state once a hash is replaced by a `replaceState` call
			 * https://bugs.webkit.org/show_bug.cgi?id=56249
			 */
			setHash: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * Safari 5 and Safari iOS 4 sometimes fail to apply the state change under busy conditions
			 * https://bugs.webkit.org/show_bug.cgi?id=42940
			 */
			safariPoll: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * MSIE 6 and 7 sometimes do not apply a hash even it was told to (requiring a second call to the apply function)
			 */
			ieDoubleCheck: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8),

			/**
			 * MSIE 6 requires the entire hash to be encoded for the hashes to trigger the onHashChange event
			 */
			hashEscape: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 7)
		};

		/**
		 * History.isEmptyObject(obj)
		 * Checks to see if the Object is Empty
		 * @param {Object} obj
		 * @return {boolean}
		 */
		History.isEmptyObject = function(obj) {
			for ( var name in obj ) {
				if ( obj.hasOwnProperty(name) ) {
					return false;
				}
			}
			return true;
		};

		/**
		 * History.cloneObject(obj)
		 * Clones a object and eliminate all references to the original contexts
		 * @param {Object} obj
		 * @return {Object}
		 */
		History.cloneObject = function(obj) {
			var hash,newObj;
			if ( obj ) {
				hash = JSON.stringify(obj);
				newObj = JSON.parse(hash);
			}
			else {
				newObj = {};
			}
			return newObj;
		};


		// ====================================================================
		// URL Helpers

		/**
		 * History.getRootUrl()
		 * Turns "http://mysite.com/dir/page.html?asd" into "http://mysite.com"
		 * @return {String} rootUrl
		 */
		History.getRootUrl = function(){
			// Create
			var rootUrl = document.location.protocol+'//'+(document.location.hostname||document.location.host);
			if ( document.location.port||false ) {
				rootUrl += ':'+document.location.port;
			}
			rootUrl += '/';

			// Return
			return rootUrl;
		};

		/**
		 * History.getBaseHref()
		 * Fetches the `href` attribute of the `<base href="...">` element if it exists
		 * @return {String} baseHref
		 */
		History.getBaseHref = function(){
			// Create
			var
				baseElements = document.getElementsByTagName('base'),
				baseElement = null,
				baseHref = '';

			// Test for Base Element
			if ( baseElements.length === 1 ) {
				// Prepare for Base Element
				baseElement = baseElements[0];
				baseHref = baseElement.href.replace(/[^\/]+$/,'');
			}

			// Adjust trailing slash
			baseHref = baseHref.replace(/\/+$/,'');
			if ( baseHref ) baseHref += '/';

			// Return
			return baseHref;
		};

		/**
		 * History.getBaseUrl()
		 * Fetches the baseHref or basePageUrl or rootUrl (whichever one exists first)
		 * @return {String} baseUrl
		 */
		History.getBaseUrl = function(){
			// Create
			var baseUrl = History.getBaseHref()||History.getBasePageUrl()||History.getRootUrl();

			// Return
			return baseUrl;
		};

		/**
		 * History.getPageUrl()
		 * Fetches the URL of the current page
		 * @return {String} pageUrl
		 */
		History.getPageUrl = function(){
			// Fetch
			var
				State = History.getState(false,false),
				stateUrl = (State||{}).url||History.getLocationHref(),
				pageUrl;

			// Create
			pageUrl = stateUrl.replace(/\/+$/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/\./).test(part) ? part : part+'/';
			});

			// Return
			return pageUrl;
		};

		/**
		 * History.getBasePageUrl()
		 * Fetches the Url of the directory of the current page
		 * @return {String} basePageUrl
		 */
		History.getBasePageUrl = function(){
			// Create
			var basePageUrl = (History.getLocationHref()).replace(/[#\?].*/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/[^\/]$/).test(part) ? '' : part;
			}).replace(/\/+$/,'')+'/';

			// Return
			return basePageUrl;
		};

		/**
		 * History.getFullUrl(url)
		 * Ensures that we have an absolute URL and not a relative URL
		 * @param {string} url
		 * @param {Boolean} allowBaseHref
		 * @return {string} fullUrl
		 */
		History.getFullUrl = function(url,allowBaseHref){
			// Prepare
			var fullUrl = url, firstChar = url.substring(0,1);
			allowBaseHref = (typeof allowBaseHref === 'undefined') ? true : allowBaseHref;

			// Check
			if ( /[a-z]+\:\/\//.test(url) ) {
				// Full URL
			}
			else if ( firstChar === '/' ) {
				// Root URL
				fullUrl = History.getRootUrl()+url.replace(/^\/+/,'');
			}
			else if ( firstChar === '#' ) {
				// Anchor URL
				fullUrl = History.getPageUrl().replace(/#.*/,'')+url;
			}
			else if ( firstChar === '?' ) {
				// Query URL
				fullUrl = History.getPageUrl().replace(/[\?#].*/,'')+url;
			}
			else {
				// Relative URL
				if ( allowBaseHref ) {
					fullUrl = History.getBaseUrl()+url.replace(/^(\.\/)+/,'');
				} else {
					fullUrl = History.getBasePageUrl()+url.replace(/^(\.\/)+/,'');
				}
				// We have an if condition above as we do not want hashes
				// which are relative to the baseHref in our URLs
				// as if the baseHref changes, then all our bookmarks
				// would now point to different locations
				// whereas the basePageUrl will always stay the same
			}

			// Return
			return fullUrl.replace(/\#$/,'');
		};

		/**
		 * History.getShortUrl(url)
		 * Ensures that we have a relative URL and not a absolute URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getShortUrl = function(url){
			// Prepare
			var shortUrl = url, baseUrl = History.getBaseUrl(), rootUrl = History.getRootUrl();

			// Trim baseUrl
			if ( History.emulated.pushState ) {
				// We are in a if statement as when pushState is not emulated
				// The actual url these short urls are relative to can change
				// So within the same session, we the url may end up somewhere different
				shortUrl = shortUrl.replace(baseUrl,'');
			}

			// Trim rootUrl
			shortUrl = shortUrl.replace(rootUrl,'/');

			// Ensure we can still detect it as a state
			if ( History.isTraditionalAnchor(shortUrl) ) {
				shortUrl = './'+shortUrl;
			}

			// Clean It
			shortUrl = shortUrl.replace(/^(\.\/)+/g,'./').replace(/\#$/,'');

			// Return
			return shortUrl;
		};

		/**
		 * History.getLocationHref(document)
		 * Returns a normalized version of document.location.href
		 * accounting for browser inconsistencies, etc.
		 *
		 * This URL will be URI-encoded and will include the hash
		 *
		 * @param {object} document
		 * @return {string} url
		 */
		History.getLocationHref = function(doc) {
			doc = doc || document;

			// most of the time, this will be true
			if (doc.URL === doc.location.href)
				return doc.location.href;

			// some versions of webkit URI-decode document.location.href
			// but they leave document.URL in an encoded state
			if (doc.location.href === decodeURIComponent(doc.URL))
				return doc.URL;

			// FF 3.6 only updates document.URL when a page is reloaded
			// document.location.href is updated correctly
			if (doc.location.hash && decodeURIComponent(doc.location.href.replace(/^[^#]+/, "")) === doc.location.hash)
				return doc.location.href;

			if (doc.URL.indexOf('#') == -1 && doc.location.href.indexOf('#') != -1)
				return doc.location.href;
			
			return doc.URL || doc.location.href;
		};


		// ====================================================================
		// State Storage

		/**
		 * History.store
		 * The store for all session specific data
		 */
		History.store = {};

		/**
		 * History.idToState
		 * 1-1: State ID to State Object
		 */
		History.idToState = History.idToState||{};

		/**
		 * History.stateToId
		 * 1-1: State String to State ID
		 */
		History.stateToId = History.stateToId||{};

		/**
		 * History.urlToId
		 * 1-1: State URL to State ID
		 */
		History.urlToId = History.urlToId||{};

		/**
		 * History.storedStates
		 * Store the states in an array
		 */
		History.storedStates = History.storedStates||[];

		/**
		 * History.savedStates
		 * Saved the states in an array
		 */
		History.savedStates = History.savedStates||[];

		/**
		 * History.noramlizeStore()
		 * Noramlize the store by adding necessary values
		 */
		History.normalizeStore = function(){
			History.store.idToState = History.store.idToState||{};
			History.store.urlToId = History.store.urlToId||{};
			History.store.stateToId = History.store.stateToId||{};
		};

		/**
		 * History.getState()
		 * Get an object containing the data, title and url of the current state
		 * @param {Boolean} friendly
		 * @param {Boolean} create
		 * @return {Object} State
		 */
		History.getState = function(friendly,create){
			// Prepare
			if ( typeof friendly === 'undefined' ) { friendly = true; }
			if ( typeof create === 'undefined' ) { create = true; }

			// Fetch
			var State = History.getLastSavedState();

			// Create
			if ( !State && create ) {
				State = History.createStateObject();
			}

			// Adjust
			if ( friendly ) {
				State = History.cloneObject(State);
				State.url = State.cleanUrl||State.url;
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByState(State)
		 * Gets a ID for a State
		 * @param {State} newState
		 * @return {String} id
		 */
		History.getIdByState = function(newState){

			// Fetch ID
			var id = History.extractId(newState.url),
				str;

			if ( !id ) {
				// Find ID via State String
				str = History.getStateString(newState);
				if ( typeof History.stateToId[str] !== 'undefined' ) {
					id = History.stateToId[str];
				}
				else if ( typeof History.store.stateToId[str] !== 'undefined' ) {
					id = History.store.stateToId[str];
				}
				else {
					// Generate a new ID
					while ( true ) {
						id = (new Date()).getTime() + String(Math.random()).replace(/\D/g,'');
						if ( typeof History.idToState[id] === 'undefined' && typeof History.store.idToState[id] === 'undefined' ) {
							break;
						}
					}

					// Apply the new State to the ID
					History.stateToId[str] = id;
					History.idToState[id] = newState;
				}
			}

			// Return ID
			return id;
		};

		/**
		 * History.normalizeState(State)
		 * Expands a State Object
		 * @param {object} State
		 * @return {object}
		 */
		History.normalizeState = function(oldState){
			// Variables
			var newState, dataNotEmpty;

			// Prepare
			if ( !oldState || (typeof oldState !== 'object') ) {
				oldState = {};
			}

			// Check
			if ( typeof oldState.normalized !== 'undefined' ) {
				return oldState;
			}

			// Adjust
			if ( !oldState.data || (typeof oldState.data !== 'object') ) {
				oldState.data = {};
			}

			// ----------------------------------------------------------------

			// Create
			newState = {};
			newState.normalized = true;
			newState.title = oldState.title||'';
			newState.url = History.getFullUrl(oldState.url?oldState.url:(History.getLocationHref()));
			newState.hash = History.getShortUrl(newState.url);
			newState.data = History.cloneObject(oldState.data);

			// Fetch ID
			newState.id = History.getIdByState(newState);

			// ----------------------------------------------------------------

			// Clean the URL
			newState.cleanUrl = newState.url.replace(/\??\&_suid.*/,'');
			newState.url = newState.cleanUrl;

			// Check to see if we have more than just a url
			dataNotEmpty = !History.isEmptyObject(newState.data);

			// Apply
			if ( (newState.title || dataNotEmpty) && History.options.disableSuid !== true ) {
				// Add ID to Hash
				newState.hash = History.getShortUrl(newState.url).replace(/\??\&_suid.*/,'');
				if ( !/\?/.test(newState.hash) ) {
					newState.hash += '?';
				}
				newState.hash += '&_suid='+newState.id;
			}

			// Create the Hashed URL
			newState.hashedUrl = History.getFullUrl(newState.hash);

			// ----------------------------------------------------------------

			// Update the URL if we have a duplicate
			if ( (History.emulated.pushState || History.bugs.safariPoll) && History.hasUrlDuplicate(newState) ) {
				newState.url = newState.hashedUrl;
			}

			// ----------------------------------------------------------------

			// Return
			return newState;
		};

		/**
		 * History.createStateObject(data,title,url)
		 * Creates a object based on the data, title and url state params
		 * @param {object} data
		 * @param {string} title
		 * @param {string} url
		 * @return {object}
		 */
		History.createStateObject = function(data,title,url){
			// Hashify
			var State = {
				'data': data,
				'title': title,
				'url': url
			};

			// Expand the State
			State = History.normalizeState(State);

			// Return object
			return State;
		};

		/**
		 * History.getStateById(id)
		 * Get a state by it's UID
		 * @param {String} id
		 */
		History.getStateById = function(id){
			// Prepare
			id = String(id);

			// Retrieve
			var State = History.idToState[id] || History.store.idToState[id] || undefined;

			// Return State
			return State;
		};

		/**
		 * Get a State's String
		 * @param {State} passedState
		 */
		History.getStateString = function(passedState){
			// Prepare
			var State, cleanedState, str;

			// Fetch
			State = History.normalizeState(passedState);

			// Clean
			cleanedState = {
				data: State.data,
				title: passedState.title,
				url: passedState.url
			};

			// Fetch
			str = JSON.stringify(cleanedState);

			// Return
			return str;
		};

		/**
		 * Get a State's ID
		 * @param {State} passedState
		 * @return {String} id
		 */
		History.getStateId = function(passedState){
			// Prepare
			var State, id;

			// Fetch
			State = History.normalizeState(passedState);

			// Fetch
			id = State.id;

			// Return
			return id;
		};

		/**
		 * History.getHashByState(State)
		 * Creates a Hash for the State Object
		 * @param {State} passedState
		 * @return {String} hash
		 */
		History.getHashByState = function(passedState){
			// Prepare
			var State, hash;

			// Fetch
			State = History.normalizeState(passedState);

			// Hash
			hash = State.hash;

			// Return
			return hash;
		};

		/**
		 * History.extractId(url_or_hash)
		 * Get a State ID by it's URL or Hash
		 * @param {string} url_or_hash
		 * @return {string} id
		 */
		History.extractId = function ( url_or_hash ) {
			// Prepare
			var id,parts,url, tmp;

			// Extract
			
			// If the URL has a #, use the id from before the #
			if (url_or_hash.indexOf('#') != -1)
			{
				tmp = url_or_hash.split("#")[0];
			}
			else
			{
				tmp = url_or_hash;
			}
			
			parts = /(.*)\&_suid=([0-9]+)$/.exec(tmp);
			url = parts ? (parts[1]||url_or_hash) : url_or_hash;
			id = parts ? String(parts[2]||'') : '';

			// Return
			return id||false;
		};

		/**
		 * History.isTraditionalAnchor
		 * Checks to see if the url is a traditional anchor or not
		 * @param {String} url_or_hash
		 * @return {Boolean}
		 */
		History.isTraditionalAnchor = function(url_or_hash){
			// Check
			var isTraditional = !(/[\/\?\.]/.test(url_or_hash));

			// Return
			return isTraditional;
		};

		/**
		 * History.extractState
		 * Get a State by it's URL or Hash
		 * @param {String} url_or_hash
		 * @return {State|null}
		 */
		History.extractState = function(url_or_hash,create){
			// Prepare
			var State = null, id, url;
			create = create||false;

			// Fetch SUID
			id = History.extractId(url_or_hash);
			if ( id ) {
				State = History.getStateById(id);
			}

			// Fetch SUID returned no State
			if ( !State ) {
				// Fetch URL
				url = History.getFullUrl(url_or_hash);

				// Check URL
				id = History.getIdByUrl(url)||false;
				if ( id ) {
					State = History.getStateById(id);
				}

				// Create State
				if ( !State && create && !History.isTraditionalAnchor(url_or_hash) ) {
					State = History.createStateObject(null,null,url);
				}
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByUrl()
		 * Get a State ID by a State URL
		 */
		History.getIdByUrl = function(url){
			// Fetch
			var id = History.urlToId[url] || History.store.urlToId[url] || undefined;

			// Return
			return id;
		};

		/**
		 * History.getLastSavedState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastSavedState = function(){
			return History.savedStates[History.savedStates.length-1]||undefined;
		};

		/**
		 * History.getLastStoredState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastStoredState = function(){
			return History.storedStates[History.storedStates.length-1]||undefined;
		};

		/**
		 * History.hasUrlDuplicate
		 * Checks if a Url will have a url conflict
		 * @param {Object} newState
		 * @return {Boolean} hasDuplicate
		 */
		History.hasUrlDuplicate = function(newState) {
			// Prepare
			var hasDuplicate = false,
				oldState;

			// Fetch
			oldState = History.extractState(newState.url);

			// Check
			hasDuplicate = oldState && oldState.id !== newState.id;

			// Return
			return hasDuplicate;
		};

		/**
		 * History.storeState
		 * Store a State
		 * @param {Object} newState
		 * @return {Object} newState
		 */
		History.storeState = function(newState){
			// Store the State
			History.urlToId[newState.url] = newState.id;

			// Push the State
			History.storedStates.push(History.cloneObject(newState));

			// Return newState
			return newState;
		};

		/**
		 * History.isLastSavedState(newState)
		 * Tests to see if the state is the last state
		 * @param {Object} newState
		 * @return {boolean} isLast
		 */
		History.isLastSavedState = function(newState){
			// Prepare
			var isLast = false,
				newId, oldState, oldId;

			// Check
			if ( History.savedStates.length ) {
				newId = newState.id;
				oldState = History.getLastSavedState();
				oldId = oldState.id;

				// Check
				isLast = (newId === oldId);
			}

			// Return
			return isLast;
		};

		/**
		 * History.saveState
		 * Push a State
		 * @param {Object} newState
		 * @return {boolean} changed
		 */
		History.saveState = function(newState){
			// Check Hash
			if ( History.isLastSavedState(newState) ) {
				return false;
			}

			// Push the State
			History.savedStates.push(History.cloneObject(newState));

			// Return true
			return true;
		};

		/**
		 * History.getStateByIndex()
		 * Gets a state by the index
		 * @param {integer} index
		 * @return {Object}
		 */
		History.getStateByIndex = function(index){
			// Prepare
			var State = null;

			// Handle
			if ( typeof index === 'undefined' ) {
				// Get the last inserted
				State = History.savedStates[History.savedStates.length-1];
			}
			else if ( index < 0 ) {
				// Get from the end
				State = History.savedStates[History.savedStates.length+index];
			}
			else {
				// Get from the beginning
				State = History.savedStates[index];
			}

			// Return State
			return State;
		};
		
		/**
		 * History.getCurrentIndex()
		 * Gets the current index
		 * @return (integer)
		*/
		History.getCurrentIndex = function(){
			// Prepare
			var index = null;
			
			// No states saved
			if(History.savedStates.length < 1) {
				index = 0;
			}
			else {
				index = History.savedStates.length-1;
			}
			return index;
		};

		// ====================================================================
		// Hash Helpers

		/**
		 * History.getHash()
		 * @param {Location=} location
		 * Gets the current document hash
		 * Note: unlike location.hash, this is guaranteed to return the escaped hash in all browsers
		 * @return {string}
		 */
		History.getHash = function(doc){
			var url = History.getLocationHref(doc),
				hash;
			hash = History.getHashByUrl(url);
			return hash;
		};

		/**
		 * History.unescapeHash()
		 * normalize and Unescape a Hash
		 * @param {String} hash
		 * @return {string}
		 */
		History.unescapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Unescape hash
			result = decodeURIComponent(result);

			// Return result
			return result;
		};

		/**
		 * History.normalizeHash()
		 * normalize a hash across browsers
		 * @return {string}
		 */
		History.normalizeHash = function(hash){
			// Prepare
			var result = hash.replace(/[^#]*#/,'').replace(/#.*/, '');

			// Return result
			return result;
		};

		/**
		 * History.setHash(hash)
		 * Sets the document hash
		 * @param {string} hash
		 * @return {History}
		 */
		History.setHash = function(hash,queue){
			// Prepare
			var State, pageUrl;

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.setHash: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.setHash,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Log
			//History.debug('History.setHash: called',hash);

			// Make Busy + Continue
			History.busy(true);

			// Check if hash is a state
			State = History.extractState(hash,true);
			if ( State && !History.emulated.pushState ) {
				// Hash is a state so skip the setHash
				//History.debug('History.setHash: Hash is a state so skipping the hash set with a direct pushState call',arguments);

				// PushState
				History.pushState(State.data,State.title,State.url,false);
			}
			else if ( History.getHash() !== hash ) {
				// Hash is a proper hash, so apply it

				// Handle browser bugs
				if ( History.bugs.setHash ) {
					// Fix Safari Bug https://bugs.webkit.org/show_bug.cgi?id=56249

					// Fetch the base page
					pageUrl = History.getPageUrl();

					// Safari hash apply
					History.pushState(null,null,pageUrl+'#'+hash,false);
				}
				else {
					// Normal hash apply
					document.location.hash = hash;
				}
			}

			// Chain
			return History;
		};

		/**
		 * History.escape()
		 * normalize and Escape a Hash
		 * @return {string}
		 */
		History.escapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Escape hash
			result = window.encodeURIComponent(result);

			// IE6 Escape Bug
			if ( !History.bugs.hashEscape ) {
				// Restore common parts
				result = result
					.replace(/\%21/g,'!')
					.replace(/\%26/g,'&')
					.replace(/\%3D/g,'=')
					.replace(/\%3F/g,'?');
			}

			// Return result
			return result;
		};

		/**
		 * History.getHashByUrl(url)
		 * Extracts the Hash from a URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getHashByUrl = function(url){
			// Extract the hash
			var hash = String(url)
				.replace(/([^#]*)#?([^#]*)#?(.*)/, '$2')
				;

			// Unescape hash
			hash = History.unescapeHash(hash);

			// Return hash
			return hash;
		};

		/**
		 * History.setTitle(title)
		 * Applies the title to the document
		 * @param {State} newState
		 * @return {Boolean}
		 */
		History.setTitle = function(newState){
			// Prepare
			var title = newState.title,
				firstState;

			// Initial
			if ( !title ) {
				firstState = History.getStateByIndex(0);
				if ( firstState && firstState.url === newState.url ) {
					title = firstState.title||History.options.initialTitle;
				}
			}

			// Apply
			try {
				document.getElementsByTagName('title')[0].innerHTML = title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
			}
			catch ( Exception ) { }
			document.title = title;

			// Chain
			return History;
		};


		// ====================================================================
		// Queueing

		/**
		 * History.queues
		 * The list of queues to use
		 * First In, First Out
		 */
		History.queues = [];

		/**
		 * History.busy(value)
		 * @param {boolean} value [optional]
		 * @return {boolean} busy
		 */
		History.busy = function(value){
			// Apply
			if ( typeof value !== 'undefined' ) {
				//History.debug('History.busy: changing ['+(History.busy.flag||false)+'] to ['+(value||false)+']', History.queues.length);
				History.busy.flag = value;
			}
			// Default
			else if ( typeof History.busy.flag === 'undefined' ) {
				History.busy.flag = false;
			}

			// Queue
			if ( !History.busy.flag ) {
				// Execute the next item in the queue
				clearTimeout(History.busy.timeout);
				var fireNext = function(){
					var i, queue, item;
					if ( History.busy.flag ) return;
					for ( i=History.queues.length-1; i >= 0; --i ) {
						queue = History.queues[i];
						if ( queue.length === 0 ) continue;
						item = queue.shift();
						History.fireQueueItem(item);
						History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
					}
				};
				History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
			}

			// Return
			return History.busy.flag;
		};

		/**
		 * History.busy.flag
		 */
		History.busy.flag = false;

		/**
		 * History.fireQueueItem(item)
		 * Fire a Queue Item
		 * @param {Object} item
		 * @return {Mixed} result
		 */
		History.fireQueueItem = function(item){
			return item.callback.apply(item.scope||History,item.args||[]);
		};

		/**
		 * History.pushQueue(callback,args)
		 * Add an item to the queue
		 * @param {Object} item [scope,callback,args,queue]
		 */
		History.pushQueue = function(item){
			// Prepare the queue
			History.queues[item.queue||0] = History.queues[item.queue||0]||[];

			// Add to the queue
			History.queues[item.queue||0].push(item);

			// Chain
			return History;
		};

		/**
		 * History.queue (item,queue), (func,queue), (func), (item)
		 * Either firs the item now if not busy, or adds it to the queue
		 */
		History.queue = function(item,queue){
			// Prepare
			if ( typeof item === 'function' ) {
				item = {
					callback: item
				};
			}
			if ( typeof queue !== 'undefined' ) {
				item.queue = queue;
			}

			// Handle
			if ( History.busy() ) {
				History.pushQueue(item);
			} else {
				History.fireQueueItem(item);
			}

			// Chain
			return History;
		};

		/**
		 * History.clearQueue()
		 * Clears the Queue
		 */
		History.clearQueue = function(){
			History.busy.flag = false;
			History.queues = [];
			return History;
		};


		// ====================================================================
		// IE Bug Fix

		/**
		 * History.stateChanged
		 * States whether or not the state has changed since the last double check was initialised
		 */
		History.stateChanged = false;

		/**
		 * History.doubleChecker
		 * Contains the timeout used for the double checks
		 */
		History.doubleChecker = false;

		/**
		 * History.doubleCheckComplete()
		 * Complete a double check
		 * @return {History}
		 */
		History.doubleCheckComplete = function(){
			// Update
			History.stateChanged = true;

			// Clear
			History.doubleCheckClear();

			// Chain
			return History;
		};

		/**
		 * History.doubleCheckClear()
		 * Clear a double check
		 * @return {History}
		 */
		History.doubleCheckClear = function(){
			// Clear
			if ( History.doubleChecker ) {
				clearTimeout(History.doubleChecker);
				History.doubleChecker = false;
			}

			// Chain
			return History;
		};

		/**
		 * History.doubleCheck()
		 * Create a double check
		 * @return {History}
		 */
		History.doubleCheck = function(tryAgain){
			// Reset
			History.stateChanged = false;
			History.doubleCheckClear();

			// Fix IE6,IE7 bug where calling history.back or history.forward does not actually change the hash (whereas doing it manually does)
			// Fix Safari 5 bug where sometimes the state does not change: https://bugs.webkit.org/show_bug.cgi?id=42940
			if ( History.bugs.ieDoubleCheck ) {
				// Apply Check
				History.doubleChecker = setTimeout(
					function(){
						History.doubleCheckClear();
						if ( !History.stateChanged ) {
							//History.debug('History.doubleCheck: State has not yet changed, trying again', arguments);
							// Re-Attempt
							tryAgain();
						}
						return true;
					},
					History.options.doubleCheckInterval
				);
			}

			// Chain
			return History;
		};


		// ====================================================================
		// Safari Bug Fix

		/**
		 * History.safariStatePoll()
		 * Poll the current state
		 * @return {History}
		 */
		History.safariStatePoll = function(){
			// Poll the URL

			// Get the Last State which has the new URL
			var
				urlState = History.extractState(History.getLocationHref()),
				newState;

			// Check for a difference
			if ( !History.isLastSavedState(urlState) ) {
				newState = urlState;
			}
			else {
				return;
			}

			// Check if we have a state with that url
			// If not create it
			if ( !newState ) {
				//History.debug('History.safariStatePoll: new');
				newState = History.createStateObject();
			}

			// Apply the New State
			//History.debug('History.safariStatePoll: trigger');
			History.Adapter.trigger(window,'popstate');

			// Chain
			return History;
		};


		// ====================================================================
		// State Aliases

		/**
		 * History.back(queue)
		 * Send the browser history back one item
		 * @param {Integer} queue [optional]
		 */
		History.back = function(queue){
			//History.debug('History.back: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.back: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.back,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.back(false);
			});

			// Go back
			history.go(-1);

			// End back closure
			return true;
		};

		/**
		 * History.forward(queue)
		 * Send the browser history forward one item
		 * @param {Integer} queue [optional]
		 */
		History.forward = function(queue){
			//History.debug('History.forward: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.forward: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.forward,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.forward(false);
			});

			// Go forward
			history.go(1);

			// End forward closure
			return true;
		};

		/**
		 * History.go(index,queue)
		 * Send the browser history back or forward index times
		 * @param {Integer} queue [optional]
		 */
		History.go = function(index,queue){
			//History.debug('History.go: called', arguments);

			// Prepare
			var i;

			// Handle
			if ( index > 0 ) {
				// Forward
				for ( i=1; i<=index; ++i ) {
					History.forward(queue);
				}
			}
			else if ( index < 0 ) {
				// Backward
				for ( i=-1; i>=index; --i ) {
					History.back(queue);
				}
			}
			else {
				throw new Error('History.go: History.go requires a positive or negative integer passed.');
			}

			// Chain
			return History;
		};


		// ====================================================================
		// HTML5 State Support

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/*
			 * Provide Skeleton for HTML4 Browsers
			 */

			// Prepare
			var emptyFunction = function(){};
			History.pushState = History.pushState||emptyFunction;
			History.replaceState = History.replaceState||emptyFunction;
		} // History.emulated.pushState

		// Native pushState Implementation
		else {
			/*
			 * Use native HTML5 History API Implementation
			 */

			/**
			 * History.onPopState(event,extra)
			 * Refresh the Current State
			 */
			History.onPopState = function(event,extra){
				// Prepare
				var stateId = false, newState = false, currentHash, currentState;

				// Reset the double check
				History.doubleCheckComplete();

				// Check for a Hash, and handle apporiatly
				currentHash = History.getHash();
				if ( currentHash ) {
					// Expand Hash
					currentState = History.extractState(currentHash||History.getLocationHref(),true);
					if ( currentState ) {
						// We were able to parse it, it must be a State!
						// Let's forward to replaceState
						//History.debug('History.onPopState: state anchor', currentHash, currentState);
						History.replaceState(currentState.data, currentState.title, currentState.url, false);
					}
					else {
						// Traditional Anchor
						//History.debug('History.onPopState: traditional anchor', currentHash);
						History.Adapter.trigger(window,'anchorchange');
						History.busy(false);
					}

					// We don't care for hashes
					History.expectedStateId = false;
					return false;
				}

				// Ensure
				stateId = History.Adapter.extractEventData('state',event,extra) || false;

				// Fetch State
				if ( stateId ) {
					// Vanilla: Back/forward button was used
					newState = History.getStateById(stateId);
				}
				else if ( History.expectedStateId ) {
					// Vanilla: A new state was pushed, and popstate was called manually
					newState = History.getStateById(History.expectedStateId);
				}
				else {
					// Initial State
					newState = History.extractState(History.getLocationHref());
				}

				// The State did not exist in our store
				if ( !newState ) {
					// Regenerate the State
					newState = History.createStateObject(null,null,History.getLocationHref());
				}

				// Clean
				History.expectedStateId = false;

				// Check if we are the same state
				if ( History.isLastSavedState(newState) ) {
					// There has been no change (just the page's hash has finally propagated)
					//History.debug('History.onPopState: no change', newState, History.savedStates);
					History.busy(false);
					return false;
				}

				// Store the State
				History.storeState(newState);
				History.saveState(newState);

				// Force update of the title
				History.setTitle(newState);

				// Fire Our Event
				History.Adapter.trigger(window,'statechange');
				History.busy(false);

				// Return true
				return true;
			};
			History.Adapter.bind(window,'popstate',History.onPopState);

			/**
			 * History.pushState(data,title,url)
			 * Add a new State to the history object, become it, and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.pushState = function(data,title,url,queue){
				//History.debug('History.pushState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.pushState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.pushState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.pushState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End pushState closure
				return true;
			};

			/**
			 * History.replaceState(data,title,url)
			 * Replace the State and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.replaceState = function(data,title,url,queue){
				//History.debug('History.replaceState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.replaceState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.replaceState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.replaceState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End replaceState closure
				return true;
			};

		} // !History.emulated.pushState


		// ====================================================================
		// Initialise

		/**
		 * Load the Store
		 */
		if ( sessionStorage ) {
			// Fetch
			try {
				History.store = JSON.parse(sessionStorage.getItem('History.store'))||{};
			}
			catch ( err ) {
				History.store = {};
			}

			// Normalize
			History.normalizeStore();
		}
		else {
			// Default Load
			History.store = {};
			History.normalizeStore();
		}

		/**
		 * Clear Intervals on exit to prevent memory leaks
		 */
		History.Adapter.bind(window,"unload",History.clearAllIntervals);

		/**
		 * Create the initial State
		 */
		History.saveState(History.storeState(History.extractState(History.getLocationHref(),true)));

		/**
		 * Bind for Saving Store
		 */
		if ( sessionStorage ) {
			// When the page is closed
			History.onUnload = function(){
				// Prepare
				var	currentStore, item, currentStoreString;

				// Fetch
				try {
					currentStore = JSON.parse(sessionStorage.getItem('History.store'))||{};
				}
				catch ( err ) {
					currentStore = {};
				}

				// Ensure
				currentStore.idToState = currentStore.idToState || {};
				currentStore.urlToId = currentStore.urlToId || {};
				currentStore.stateToId = currentStore.stateToId || {};

				// Sync
				for ( item in History.idToState ) {
					if ( !History.idToState.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.idToState[item] = History.idToState[item];
				}
				for ( item in History.urlToId ) {
					if ( !History.urlToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.urlToId[item] = History.urlToId[item];
				}
				for ( item in History.stateToId ) {
					if ( !History.stateToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.stateToId[item] = History.stateToId[item];
				}

				// Update
				History.store = currentStore;
				History.normalizeStore();

				// In Safari, going into Private Browsing mode causes the
				// Session Storage object to still exist but if you try and use
				// or set any property/function of it it throws the exception
				// "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to
				// add something to storage that exceeded the quota." infinitely
				// every second.
				currentStoreString = JSON.stringify(currentStore);
				try {
					// Store
					sessionStorage.setItem('History.store', currentStoreString);
				}
				catch (e) {
					if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
						if (sessionStorage.length) {
							// Workaround for a bug seen on iPads. Sometimes the quota exceeded error comes up and simply
							// removing/resetting the storage can work.
							sessionStorage.removeItem('History.store');
							sessionStorage.setItem('History.store', currentStoreString);
						} else {
							// Otherwise, we're probably private browsing in Safari, so we'll ignore the exception.
						}
					} else {
						throw e;
					}
				}
			};

			// For Internet Explorer
			History.intervalList.push(setInterval(History.onUnload,History.options.storeInterval));

			// For Other Browsers
			History.Adapter.bind(window,'beforeunload',History.onUnload);
			History.Adapter.bind(window,'unload',History.onUnload);

			// Both are enabled for consistency
		}

		// Non-Native pushState Implementation
		if ( !History.emulated.pushState ) {
			// Be aware, the following is only for native pushState implementations
			// If you are wanting to include something for all browsers
			// Then include it above this if block

			/**
			 * Setup Safari Fix
			 */
			if ( History.bugs.safariPoll ) {
				History.intervalList.push(setInterval(History.safariStatePoll, History.options.safariPollInterval));
			}

			/**
			 * Ensure Cross Browser Compatibility
			 */
			if ( navigator.vendor === 'Apple Computer, Inc.' || (navigator.appCodeName||'') === 'Mozilla' ) {
				/**
				 * Fix Safari HashChange Issue
				 */

				// Setup Alias
				History.Adapter.bind(window,'hashchange',function(){
					History.Adapter.trigger(window,'popstate');
				});

				// Initialise Alias
				if ( History.getHash() ) {
					History.Adapter.onDomLoad(function(){
						History.Adapter.trigger(window,'hashchange');
					});
				}
			}

		} // !History.emulated.pushState


	}; // History.initCore

	// Try to Initialise History
	if (!History.options || !History.options.delayInit) {
		History.init();
	}

})(window);

(function(global) {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requirejs = require = requireModule = function(name) {
  requirejs._eak_seen = registry;

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };
})();

define("rsvp/all", 
  ["./promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];

    __exports__["default"] = function all(array, label) {
      return Promise.all(array, label);
    };
  });
define("rsvp/all_settled", 
  ["./promise","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];
    var isArray = __dependency2__.isArray;
    var isNonThenable = __dependency2__.isNonThenable;

    /**
      `RSVP.allSettled` is similar to `RSVP.all`, but instead of implementing
      a fail-fast method, it waits until all the promises have returned and
      shows you all the results. This is useful if you want to handle multiple
      promises' failure states together as a set.

      Returns a promise that is fulfilled when all the given promises have been
      settled. The return promise is fulfilled with an array of the states of
      the promises passed into the `promises` array argument.

      Each state object will either indicate fulfillment or rejection, and
      provide the corresponding value or reason. The states will take one of
      the following formats:

      ```javascript
      { state: 'fulfilled', value: value }
        or
      { state: 'rejected', reason: reason }
      ```

      Example:

      ```javascript
      var promise1 = RSVP.Promise.resolve(1);
      var promise2 = RSVP.Promise.reject(new Error('2'));
      var promise3 = RSVP.Promise.reject(new Error('3'));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.allSettled(promises).then(function(array){
        // array == [
        //   { state: 'fulfilled', value: 1 },
        //   { state: 'rejected', reason: Error },
        //   { state: 'rejected', reason: Error }
        // ]
        // Note that for the second item, reason.message will be "2", and for the
        // third item, reason.message will be "3".
      }, function(error) {
        // Not run. (This block would only be called if allSettled had failed,
        // for instance if passed an incorrect argument type.)
      });
      ```

      @method @allSettled
      @for RSVP
      @param {Array} promises;
      @param {String} label - optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled with an array of the settled
      states of the constituent promises.
    */

    __exports__["default"] = function allSettled(entries, label) {
      return new Promise(function(resolve, reject) {
        if (!isArray(entries)) {
          throw new TypeError('You must pass an array to allSettled.');
        }

        var remaining = entries.length;
        var entry;

        if (remaining === 0) {
          resolve([]);
          return;
        }

        var results = new Array(remaining);

        function fulfilledResolver(index) {
          return function(value) {
            resolveAll(index, fulfilled(value));
          };
        }

        function rejectedResolver(index) {
          return function(reason) {
            resolveAll(index, rejected(reason));
          };
        }

        function resolveAll(index, value) {
          results[index] = value;
          if (--remaining === 0) {
            resolve(results);
          }
        }

        for (var index = 0; index < entries.length; index++) {
          entry = entries[index];

          if (isNonThenable(entry)) {
            resolveAll(index, fulfilled(entry));
          } else {
            Promise.cast(entry).then(fulfilledResolver(index), rejectedResolver(index));
          }
        }
      }, label);
    };

    function fulfilled(value) {
      return { state: 'fulfilled', value: value };
    }

    function rejected(reason) {
      return { state: 'rejected', reason: reason };
    }
  });
define("rsvp/asap", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = function asap(callback, arg) {
      var length = queue.push([callback, arg]);
      if (length === 1) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
      }
    };

    var browserGlobal = (typeof window !== 'undefined') ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;

    // node
    function useNextTick() {
      return function() {
        process.nextTick(flush);
      };
    }

    function useMutationObserver() {
      var iterations = 0;
      var observer = new BrowserMutationObserver(flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    function useSetTimeout() {
      return function() {
        setTimeout(flush, 1);
      };
    }

    var queue = [];
    function flush() {
      for (var i = 0; i < queue.length; i++) {
        var tuple = queue[i];
        var callback = tuple[0], arg = tuple[1];
        callback(arg);
      }
      queue = [];
    }

    var scheduleFlush;

    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
      scheduleFlush = useMutationObserver();
    } else {
      scheduleFlush = useSetTimeout();
    }
  });
define("rsvp/config", 
  ["./events","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var EventTarget = __dependency1__["default"];

    var config = {
      instrument: false
    };

    EventTarget.mixin(config);

    function configure(name, value) {
      if (name === 'onerror') {
        // handle for legacy users that expect the actual
        // error to be passed to their function added via
        // `RSVP.configure('onerror', someFunctionHere);`
        config.on('error', value);
        return;
      }

      if (arguments.length === 2) {
        config[name] = value;
      } else {
        return config[name];
      }
    }

    __exports__.config = config;
    __exports__.configure = configure;
  });
define("rsvp/defer", 
  ["./promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];

    /**
      `RSVP.defer` returns an object similar to jQuery's `$.Deferred` objects.
      `RSVP.defer` should be used when porting over code reliant on `$.Deferred`'s
      interface. New code should use the `RSVP.Promise` constructor instead.

      The object returned from `RSVP.defer` is a plain object with three properties:

      * promise - an `RSVP.Promise`.
      * reject - a function that causes the `promise` property on this object to
        become rejected
      * resolve - a function that causes the `promise` property on this object to
        become fulfilled.

      Example:

       ```javascript
       var deferred = RSVP.defer();

       deferred.resolve("Success!");

       defered.promise.then(function(value){
         // value here is "Success!"
       });
       ```

      @method defer
      @for RSVP
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Object}
     */

    __exports__["default"] = function defer(label) {
      var deferred = { };

      deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      }, label);

      return deferred;
    };
  });
define("rsvp/events", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var indexOf = function(callbacks, callback) {
      for (var i=0, l=callbacks.length; i<l; i++) {
        if (callbacks[i] === callback) { return i; }
      }

      return -1;
    };

    var callbacksFor = function(object) {
      var callbacks = object._promiseCallbacks;

      if (!callbacks) {
        callbacks = object._promiseCallbacks = {};
      }

      return callbacks;
    };

    /**
      //@module RSVP
      //@class EventTarget
    */
    __exports__["default"] = {

      /**
        `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
        Example:

        ```javascript
        var object = {};

        RSVP.EventTarget.mixin(object);

        object.on("finished", function(event) {
          // handle event
        });

        object.trigger("finished", { detail: value });
        ```

        `EventTarget.mixin` also works with prototypes:

        ```javascript
        var Person = function() {};
        RSVP.EventTarget.mixin(Person.prototype);

        var yehuda = new Person();
        var tom = new Person();

        yehuda.on("poke", function(event) {
          console.log("Yehuda says OW");
        });

        tom.on("poke", function(event) {
          console.log("Tom says OW");
        });

        yehuda.trigger("poke");
        tom.trigger("poke");
        ```

        @method mixin
        @param {Object} object object to extend with EventTarget methods
        @private
      */
      mixin: function(object) {
        object.on = this.on;
        object.off = this.off;
        object.trigger = this.trigger;
        object._promiseCallbacks = undefined;
        return object;
      },

      /**
        Registers a callback to be executed when `eventName` is triggered

        ```javascript
        object.on('event', function(eventInfo){
          // handle the event
        });

        object.trigger('event');
        ```

        @method on
        @param {String} eventName name of the event to listen for
        @param {Function} callback function to be called when the event is triggered.
        @private
      */
      on: function(eventName, callback) {
        var allCallbacks = callbacksFor(this), callbacks;

        callbacks = allCallbacks[eventName];

        if (!callbacks) {
          callbacks = allCallbacks[eventName] = [];
        }

        if (indexOf(callbacks, callback) === -1) {
          callbacks.push(callback);
        }
      },

      /**
        You can use `off` to stop firing a particular callback for an event:

        ```javascript
        function doStuff() { // do stuff! }
        object.on('stuff', doStuff);

        object.trigger('stuff'); // doStuff will be called

        // Unregister ONLY the doStuff callback
        object.off('stuff', doStuff);
        object.trigger('stuff'); // doStuff will NOT be called
        ```

        If you don't pass a `callback` argument to `off`, ALL callbacks for the
        event will not be executed when the event fires. For example:

        ```javascript
        var callback1 = function(){};
        var callback2 = function(){};

        object.on('stuff', callback1);
        object.on('stuff', callback2);

        object.trigger('stuff'); // callback1 and callback2 will be executed.

        object.off('stuff');
        object.trigger('stuff'); // callback1 and callback2 will not be executed!
        ```

        @method off
        @param {String} eventName event to stop listening to
        @param {Function} callback optional argument. If given, only the function
        given will be removed from the event's callback queue. If no `callback`
        argument is given, all callbacks will be removed from the event's callback
        queue.
        @private

      */
      off: function(eventName, callback) {
        var allCallbacks = callbacksFor(this), callbacks, index;

        if (!callback) {
          allCallbacks[eventName] = [];
          return;
        }

        callbacks = allCallbacks[eventName];

        index = indexOf(callbacks, callback);

        if (index !== -1) { callbacks.splice(index, 1); }
      },

      /**
        Use `trigger` to fire custom events. For example:

        ```javascript
        object.on('foo', function(){
          console.log('foo event happened!');
        });
        object.trigger('foo');
        // 'foo event happened!' logged to the console
        ```

        You can also pass a value as a second argument to `trigger` that will be
        passed as an argument to all event listeners for the event:

        ```javascript
        object.on('foo', function(value){
          console.log(value.name);
        });

        object.trigger('foo', { name: 'bar' });
        // 'bar' logged to the console
        ```

        @method trigger
        @param {String} eventName name of the event to be triggered
        @param {Any} options optional value to be passed to any event handlers for
        the given `eventName`
        @private
      */
      trigger: function(eventName, options) {
        var allCallbacks = callbacksFor(this),
            callbacks, callbackTuple, callback, binding;

        if (callbacks = allCallbacks[eventName]) {
          // Don't cache the callbacks.length since it may grow
          for (var i=0; i<callbacks.length; i++) {
            callback = callbacks[i];

            callback(options);
          }
        }
      }
    };
  });
define("rsvp/filter", 
  ["./all","./map","./utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var all = __dependency1__["default"];
    var map = __dependency2__["default"];
    var isFunction = __dependency3__.isFunction;
    var isArray = __dependency3__.isArray;

    /**
     `RSVP.filter` is similar to JavaScript's native `filter` method, except that it
      waits for all promises to become fulfilled before running the `filterFn` on
      each item in given to `promises`. `RSVP.filterFn` returns a promise that will
      become fulfilled with the result of running `filterFn` on the values the
      promises become fulfilled with.

      For example:

      ```javascript

      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);

      var filterFn = function(item){
        return item > 1;
      };

      RSVP.filter(promises, filterFn).then(function(result){
        // result is [ 2, 3 ]
      });
      ```

      If any of the `promises` given to `RSVP.filter` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      var filterFn = function(item){
        return item > 1;
      };

      RSVP.filter(promises, filterFn).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "2"
      });
      ```

      `RSVP.filter` will also wait for any promises returned from `filterFn`.
      For instance, you may want to fetch a list of users then return a subset
      of those users based on some asynchronous operation:

      ```javascript

      var alice = { name: 'alice' };
      var bob   = { name: 'bob' };
      var users = [ alice, bob ];

      var promises = users.map(function(user){
        return RSVP.resolve(user);
      });

      var filterFn = function(user){
        // Here, Alice has permissions to create a blog post, but Bob does not.
        return getPrivilegesForUser(user).then(function(privs){
          return privs.can_create_blog_post === true;
        });
      };
      RSVP.filter(promises, filterFn).then(function(users){
        // true, because the server told us only Alice can create a blog post.
        users.length === 1;
        // false, because Alice is the only user present in `users`
        users[0] === bob;
      });
      ```

      @method filter
      @for RSVP
      @param {Array} promises
      @param {Function} filterFn - function to be called on each resolved value to
      filter the final results.
      @param {String} label optional string describing the promise. Useful for
      tooling.
      @return {Promise}
    */
    function filter(promises, filterFn, label) {
      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to filter.');
      }

      if (!isFunction(filterFn)){
        throw new TypeError("You must pass a function to filter's second argument.");
      }

      return all(promises, label).then(function(values){
        return map(promises, filterFn, label).then(function(filterResults){
           var i,
               valuesLen = values.length,
               filtered = [];

           for (i = 0; i < valuesLen; i++){
             if(filterResults[i]) filtered.push(values[i]);
           }
           return filtered;
        });
      });
    }

    __exports__["default"] = filter;
  });
define("rsvp/hash", 
  ["./promise","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];
    var isNonThenable = __dependency2__.isNonThenable;
    var keysOf = __dependency2__.keysOf;

    /**
      `RSVP.hash` is similar to `RSVP.all`, but takes an object instead of an array
      for its `promises` argument.

      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The returned promise
      is fulfilled with a hash that has the same key names as the `promises` object
      argument. If any of the values in the object are not promises, they will
      simply be copied over to the fulfilled object.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.resolve(1),
        yourPromise: RSVP.resolve(2),
        theirPromise: RSVP.resolve(3),
        notAPromise: 4
      };

      RSVP.hash(promises).then(function(hash){
        // hash here is an object that looks like:
        // {
        //   myPromise: 1,
        //   yourPromise: 2,
        //   theirPromise: 3,
        //   notAPromise: 4
        // }
      });
      ````

      If any of the `promises` given to `RSVP.hash` are rejected, the first promise
      that is rejected will be given as as the first argument, or as the reason to
      the rejection handler. For example:

      ```javascript
      var promises = {
        myPromise: RSVP.resolve(1),
        rejectedPromise: RSVP.reject(new Error("rejectedPromise")),
        anotherRejectedPromise: RSVP.reject(new Error("anotherRejectedPromise")),
      };

      RSVP.hash(promises).then(function(hash){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "rejectedPromise"
      });
      ```

      An important note: `RSVP.hash` is intended for plain JavaScript objects that
      are just a set of keys and values. `RSVP.hash` will NOT preserve prototype
      chains.

      Example:

      ```javascript
      function MyConstructor(){
        this.example = RSVP.resolve("Example");
      }

      MyConstructor.prototype = {
        protoProperty: RSVP.resolve("Proto Property")
      };

      var myObject = new MyConstructor();

      RSVP.hash(myObject).then(function(hash){
        // protoProperty will not be present, instead you will just have an
        // object that looks like:
        // {
        //   example: "Example"
        // }
        //
        // hash.hasOwnProperty('protoProperty'); // false
        // 'undefined' === typeof hash.protoProperty
      });
      ```

      @method hash
      @for RSVP
      @param {Object} promises
      @param {String} label - optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when all properties of `promises`
      have been fulfilled, or rejected if any of them become rejected.
    */
    __exports__["default"] = function hash(object, label) {
      return new Promise(function(resolve, reject){
        var results = {};
        var keys = keysOf(object);
        var remaining = keys.length;
        var entry, property;

        if (remaining === 0) {
          resolve(results);
          return;
        }

       function fulfilledTo(property) {
          return function(value) {
            results[property] = value;
            if (--remaining === 0) {
              resolve(results);
            }
          };
        }

        function onRejection(reason) {
          remaining = 0;
          reject(reason);
        }

        for (var i = 0; i < keys.length; i++) {
          property = keys[i];
          entry = object[property];

          if (isNonThenable(entry)) {
            results[property] = entry;
            if (--remaining === 0) {
              resolve(results);
            }
          } else {
            Promise.cast(entry).then(fulfilledTo(property), onRejection);
          }
        }
      });
    };
  });
define("rsvp/instrument", 
  ["./config","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var now = __dependency2__.now;

    __exports__["default"] = function instrument(eventName, promise, child) {
      // instrumentation should not disrupt normal usage.
      try {
        config.trigger(eventName, {
          guid: promise._guidKey + promise._id,
          eventName: eventName,
          detail: promise._detail,
          childGuid: child && promise._guidKey + child._id,
          label: promise._label,
          timeStamp: now(),
          stack: new Error(promise._label).stack
        });
      } catch(error) {
        setTimeout(function(){
          throw error;
        }, 0);
      }
    };
  });
define("rsvp/map", 
  ["./promise","./all","./utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];
    var all = __dependency2__["default"];
    var isArray = __dependency3__.isArray;
    var isFunction = __dependency3__.isFunction;

    /**

     `RSVP.map` is similar to JavaScript's native `map` method, except that it
      waits for all promises to become fulfilled before running the `mapFn` on
      each item in given to `promises`. `RSVP.map` returns a promise that will
      become fulfilled with the result of running `mapFn` on the values the promises
      become fulfilled with.

      For example:

      ```javascript

      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      var mapFn = function(item){
        return item + 1;
      };

      RSVP.map(promises, mapFn).then(function(result){
        // result is [ 2, 3, 4 ]
      });
      ```

      If any of the `promises` given to `RSVP.map` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      var mapFn = function(item){
        return item + 1;
      };

      RSVP.map(promises, mapFn).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "2"
      });
      ```

      `RSVP.map` will also wait if a promise is returned from `mapFn`. For example,
      say you want to get all comments from a set of blog posts, but you need
      the blog posts first becuase they contain a url to those comments.

      ```javscript

      var mapFn = function(blogPost){
        // getComments does some ajax and returns an RSVP.Promise that is fulfilled
        // with some comments data
        return getComments(blogPost.comments_url);
      };

      // getBlogPosts does some ajax and returns an RSVP.Promise that is fulfilled
      // with some blog post data
      RSVP.map(getBlogPosts(), mapFn).then(function(comments){
        // comments is the result of asking the server for the comments
        // of all blog posts returned from getBlogPosts()
      });
      ```

      @method map
      @for RSVP
      @param {Array} promises
      @param {Function} mapFn function to be called on each fulfilled promise.
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled with the result of calling
      `mapFn` on each fulfilled promise or value when they become fulfilled.
       The promise will be rejected if any of the given `promises` become rejected.
    */
    __exports__["default"] = function map(promises, mapFn, label) {

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to map.');
      }

      if (!isFunction(mapFn)){
        throw new TypeError("You must pass a function to map's second argument.");
      }

      return all(promises, label).then(function(results){
        var resultLen = results.length,
            mappedResults = [],
            i;

        for (i = 0; i < resultLen; i++){
          mappedResults.push(mapFn(results[i]));
        }

        return all(mappedResults, label);
      });
    };
  });
define("rsvp/node", 
  ["./promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];

    var slice = Array.prototype.slice;

    function makeNodeCallbackFor(resolve, reject) {
      return function (error, value) {
        if (error) {
          reject(error);
        } else if (arguments.length > 2) {
          resolve(slice.call(arguments, 1));
        } else {
          resolve(value);
        }
      };
    }

    /**
      `RSVP.denodeify` takes a "node-style" function and returns a function that
      will return an `RSVP.Promise`. You can use `denodeify` in Node.js or the
      browser when you'd prefer to use promises over using callbacks. For example,
      `denodeify` transforms the following:

      ```javascript
      var fs = require('fs');

      fs.readFile('myfile.txt', function(err, data){
        if (err) return handleError(err);
        handleData(data);
      });
      ```

      into:

      ```javascript
      var fs = require('fs');

      var readFile = RSVP.denodeify(fs.readFile);

      readFile('myfile.txt').then(handleData, handleError);
      ```

      Using `denodeify` makes it easier to compose asynchronous operations instead
      of using callbacks. For example, instead of:

      ```javascript
      var fs = require('fs');
      var log = require('some-async-logger');

      fs.readFile('myfile.txt', function(err, data){
        if (err) return handleError(err);
        fs.writeFile('myfile2.txt', data, function(err){
          if (err) throw err;
          log('success', function(err) {
            if (err) throw err;
          });
        });
      });
      ```

      You can chain the operations together using `then` from the returned promise:

      ```javascript
      var fs = require('fs');
      var denodeify = RSVP.denodeify;
      var readFile = denodeify(fs.readFile);
      var writeFile = denodeify(fs.writeFile);
      var log = denodeify(require('some-async-logger'));

      readFile('myfile.txt').then(function(data){
        return writeFile('myfile2.txt', data);
      }).then(function(){
        return log('SUCCESS');
      }).then(function(){
        // success handler
      }, function(reason){
        // rejection handler
      });
      ```

      @method denodeify
      @for RSVP
      @param {Function} nodeFunc a "node-style" function that takes a callback as
      its last argument. The callback expects an error to be passed as its first
      argument (if an error occurred, otherwise null), and the value from the
      operation as its second argument ("function(err, value){ }").
      @param {Any} binding optional argument for binding the "this" value when
      calling the `nodeFunc` function.
      @return {Function} a function that wraps `nodeFunc` to return an
      `RSVP.Promise`
    */
    __exports__["default"] = function denodeify(nodeFunc, binding) {
      return function()  {
        var nodeArgs = slice.call(arguments), resolve, reject;
        var thisArg = this || binding;

        return new Promise(function(resolve, reject) {
          Promise.all(nodeArgs).then(function(nodeArgs) {
            try {
              nodeArgs.push(makeNodeCallbackFor(resolve, reject));
              nodeFunc.apply(thisArg, nodeArgs);
            } catch(e) {
              reject(e);
            }
          });
        });
      };
    };
  });
define("rsvp/promise", 
  ["./config","./events","./instrument","./utils","./promise/cast","./promise/all","./promise/race","./promise/resolve","./promise/reject","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var EventTarget = __dependency2__["default"];
    var instrument = __dependency3__["default"];
    var objectOrFunction = __dependency4__.objectOrFunction;
    var isFunction = __dependency4__.isFunction;
    var now = __dependency4__.now;
    var cast = __dependency5__["default"];
    var all = __dependency6__["default"];
    var race = __dependency7__["default"];
    var Resolve = __dependency8__["default"];
    var Reject = __dependency9__["default"];

    var guidKey = 'rsvp_' + now() + '-';
    var counter = 0;

    function noop() {}

    __exports__["default"] = Promise;


    /**

      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error("getJSON: `" + url + "` failed with status: [" + this.status + "]");
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function}
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @constructor
    */
    function Promise(resolver, label) {
      if (!isFunction(resolver)) {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
      }

      if (!(this instanceof Promise)) {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
      }

      this._id = counter++;
      this._label = label;
      this._subscribers = [];

      if (config.instrument) {
        instrument('created', this);
      }

      if (noop !== resolver) {
        invokeResolver(resolver, this);
      }
    }

    function invokeResolver(resolver, promise) {
      function resolvePromise(value) {
        resolve(promise, value);
      }

      function rejectPromise(reason) {
        reject(promise, reason);
      }

      try {
        resolver(resolvePromise, rejectPromise);
      } catch(e) {
        rejectPromise(e);
      }
    }

    Promise.cast = cast;
    Promise.all = all;
    Promise.race = race;
    Promise.resolve = Resolve;
    Promise.reject = Reject;

    var PENDING   = void 0;
    var SEALED    = 0;
    var FULFILLED = 1;
    var REJECTED  = 2;

    function subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      subscribers[length] = child;
      subscribers[length + FULFILLED] = onFulfillment;
      subscribers[length + REJECTED]  = onRejection;
    }

    function publish(promise, settled) {
      var child, callback, subscribers = promise._subscribers, detail = promise._detail;

      if (config.instrument) {
        instrument(settled === FULFILLED ? 'fulfilled' : 'rejected', promise);
      }

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        invokeCallback(settled, child, callback, detail);
      }

      promise._subscribers = null;
    }

    Promise.prototype = {
    /**
      @property constructor
    */
      constructor: Promise,

      _id: undefined,
      _guidKey: guidKey,
      _label: undefined,

      _state: undefined,
      _detail: undefined,
      _subscribers: undefined,

      _onerror: function (reason) {
        config.trigger('error', reason);
      },

    /**

      A promise represents the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, "downstream"
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return "default name";
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `"default name"`
      });

      findUser().then(function (user) {
        throw "Found user, but still unhappy";
      }, function (reason) {
        throw "`findUser` rejected and we're unhappy";
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be "Found user, but still unhappy".  
        // If `findUser` rejected, `reason` will be "`findUser` rejected and we're unhappy".
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException("Upstream error");
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously.  This can be achieved by returning a promise in the
      fulfillment or rejection handler.  The downstream promise will then be pending
      until the returned promise is settled.  This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javacsript
      findResult().then(function(result){

      }, function(reason){

      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javacsript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong;
      });
      ```

      @method then
      @param {Function} onFulfillment
      @param {Function} onRejection
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection, label) {
        var promise = this;
        this._onerror = null;

        var thenPromise = new this.constructor(noop, label);

        if (this._state) {
          var callbacks = arguments;
          config.async(function invokePromiseCallback() {
            invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
          });
        } else {
          subscribe(this, thenPromise, onFulfillment, onRejection);
        }

        if (config.instrument) {
          instrument('chained', promise, thenPromise);
        }

        return thenPromise;
      },

    /**
      `catch` is simply sugar for `then(null, onRejection)` which makes it the same
      as the catch block, of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error("couldn't find that author");
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {

      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong;
      });
      ```

      @method catch
      @param {Function} onRejection
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection, label) {
        return this.then(null, onRejection, label);
      },

    /**
      `finally` will be invoked regardless of the promise's fate just as native
      try/catch/finally behaves

      ```js
      findAuthor() {
        if (Math.random() > 0.5) {
          throw new Error();
        }
        return new Author();
      }

      try {
        return findAuthor(); // succeed or fail
      } catch(error) {
        return findOtherAuther();
      } finally {
        // always runs
        // doesn't effect the return value
      }

      findAuthor().finally(function(){
        // author was either found, or not
      });
      ```

      @method finally
      @param {Function} callback
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'finally': function(callback, label) {
        var constructor = this.constructor;

        return this.then(function(value) {
          return constructor.cast(callback()).then(function(){
            return value;
          });
        }, function(reason) {
          return constructor.cast(callback()).then(function(){
            throw reason;
          });
        }, label);
      }
    };

    function invokeCallback(settled, promise, callback, detail) {
      var hasCallback = isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        try {
          value = callback(detail);
          succeeded = true;
        } catch(e) {
          failed = true;
          error = e;
        }
      } else {
        value = detail;
        succeeded = true;
      }

      if (handleThenable(promise, value)) {
        return;
      } else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (failed) {
        reject(promise, error);
      } else if (settled === FULFILLED) {
        resolve(promise, value);
      } else if (settled === REJECTED) {
        reject(promise, value);
      }
    }

    function handleThenable(promise, value) {
      var then = null,
      resolved;

      try {
        if (promise === value) {
          throw new TypeError("A promises callback cannot return that same promise.");
        }

        if (objectOrFunction(value)) {
          then = value.then;

          if (isFunction(then)) {
            then.call(value, function(val) {
              if (resolved) { return true; }
              resolved = true;

              if (value !== val) {
                resolve(promise, val);
              } else {
                fulfill(promise, val);
              }
            }, function(val) {
              if (resolved) { return true; }
              resolved = true;

              reject(promise, val);
            }, 'derived from: ' + (promise._label || ' unknown promise'));

            return true;
          }
        }
      } catch (error) {
        if (resolved) { return true; }
        reject(promise, error);
        return true;
      }

      return false;
    }

    function resolve(promise, value) {
      if (promise === value) {
        fulfill(promise, value);
      } else if (!handleThenable(promise, value)) {
        fulfill(promise, value);
      }
    }

    function fulfill(promise, value) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = value;

      config.async(publishFulfillment, promise);
    }

    function reject(promise, reason) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = reason;

      config.async(publishRejection, promise);
    }

    function publishFulfillment(promise) {
      publish(promise, promise._state = FULFILLED);
    }

    function publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._detail);
      }

      publish(promise, promise._state = REJECTED);
    }
  });
define("rsvp/promise/all", 
  ["../utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var isArray = __dependency1__.isArray;
    var isNonThenable = __dependency1__.isNonThenable;

    /**

      `RSVP.Promise.all` returns a new promise which is fulfilled with an array of
      fulfillment values for the passed promises, or rejects with the reason of the
      first passed promise that rejects. It casts all elements of the passed iterable
      to promises as it runs this algorithm.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.Promise.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.Promise.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @for RSVP.Promise
      @param {Array} promises
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
    */
    __exports__["default"] = function all(entries, label) {

      /*jshint validthis:true */
      var Constructor = this;

      return new Constructor(function(resolve, reject) {
        if (!isArray(entries)) {
          throw new TypeError('You must pass an array to all.');
        }

        var remaining = entries.length;
        var results = new Array(remaining);
        var entry, pending = true;

        if (remaining === 0) {
          resolve(results);
          return;
        }

        function fulfillmentAt(index) {
          return function(value) {
            results[index] = value;
            if (--remaining === 0) {
              resolve(results);
            }
          };
        }

        function onRejection(reason) {
          remaining = 0;
          reject(reason);
        }

        for (var index = 0; index < entries.length; index++) {
          entry = entries[index];
          if (isNonThenable(entry)) {
            results[index] = entry;
            if (--remaining === 0) {
              resolve(results);
            }
          } else {
            Constructor.cast(entry).then(fulfillmentAt(index), onRejection);
          }
        }
      }, label);
    };
  });
define("rsvp/promise/cast", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**

      `RSVP.Promise.cast` cast coerces its argument to a promise, or returns the
      argument if it is already a promise which shares a constructor with the caster;

      Example:

      ```javascript
      var promise = RSVP.Promise.resolve(1);
      var casted = RSVP.Promise.cast(promise);

      console.log(promise === casted); // true
      ```

      In the case of a promise whose constructor does not match, it is assimilated.
      The resulting promise will fulfill or reject based on the outcome of the
      promise being casted.

      In the case of a non-promise, a promise which will fulfill with that value is
      returned.

      Example:

      ```javascript
      var value = 1; // could be a number, boolean, string, undefined...
      var casted = RSVP.Promise.cast(value);

      console.log(value === casted); // false
      console.log(casted instanceof RSVP.Promise) // true

      casted.then(function(val) {
        val === value // => true
      });
      ```

      `RSVP.Promise.cast` is similar to `RSVP.Promise.resolve`, but `RSVP.Promise.cast` differs in the
      following ways:

      * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
      have something that could either be a promise or a value. RSVP.resolve
      will have the same effect but will create a new promise wrapper if the
      argument is a promise.
      * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
      promises of the exact class specified, so that the resulting object's `then` is
      ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

      @method cast
      @for RSVP.Promise
      @param {Object} object to be casted
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise
    */

    __exports__["default"] = function cast(object, label) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      return new Constructor(function(resolve) {
        resolve(object);
      }, label);
    };
  });
define("rsvp/promise/race", 
  ["../utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */

    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;
    var isNonThenable = __dependency1__.isNonThenable;

    /**
      `RSVP.Promise.race` returns a new promise which is settled in the same way as the
      first passed promise to settle.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.Promise.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.Promise.race` is deterministic in that only the state of the first
      completed promise matters. For example, even if other promises given to the
      `promises` array argument are resolved, but the first completed promise has
      become rejected before the other promises became fulfilled, the returned
      promise will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.Promise.race([promise1, promise2]).then(function(result){
        // Code here never runs because there are rejected promises!
      }, function(reason){
        // reason.message === "promise2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      @method race
      @for RSVP.Promise
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise which settles in the same way as the first passed
      promise to settle.
    */
    __exports__["default"] = function race(entries, label) {
      /*jshint validthis:true */
      var Constructor = this, entry;

      return new Constructor(function(resolve, reject) {
        if (!isArray(entries)) {
          throw new TypeError('You must pass an array to race.');
        }

        var pending = true;

        function onFulfillment(value) { if (pending) { pending = false; resolve(value); } }
        function onRejection(reason)  { if (pending) { pending = false; reject(reason); } }

        for (var i = 0; i < entries.length; i++) {
          entry = entries[i];
          if (isNonThenable(entry)) {
            pending = false;
            resolve(entry);
            return;
          } else {
            Constructor.cast(entry).then(onFulfillment, onRejection);
          }
        }
      }, label);
    };
  });
define("rsvp/promise/reject", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.Promise.reject` returns a promise  rejected with the passed `reason`.
      It is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.Promise.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @for RSVP.Promise
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise rejected with the given `reason`.
    */
    __exports__["default"] = function reject(reason, label) {
      /*jshint validthis:true */
      var Constructor = this;

      return new Constructor(function (resolve, reject) {
        reject(reason);
      }, label);
    };
  });
define("rsvp/promise/resolve", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.Promise.resolve` returns a promise that will become fulfilled with the passed
      `value`. It is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        resolve(1);
      });

      promise.then(function(value){
        // value === 1
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.Promise.resolve(1);

      promise.then(function(value){
        // value === 1
      });
      ```

      @method resolve
      @for RSVP.Promise
      @param {Any} value value that the returned promise will be resolved with
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    __exports__["default"] = function resolve(value, label) {
      /*jshint validthis:true */
      var Constructor = this;

      return new Constructor(function(resolve, reject) {
        resolve(value);
      }, label);
    };
  });
define("rsvp/race", 
  ["./promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];

    __exports__["default"] = function race(array, label) {
      return Promise.race(array, label);
    };
  });
define("rsvp/reject", 
  ["./promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];

    __exports__["default"] = function reject(reason, label) {
      return Promise.reject(reason, label);
    };
  });
define("rsvp/resolve", 
  ["./promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];

    __exports__["default"] = function resolve(value, label) {
      return Promise.resolve(value, label);
    };
  });
define("rsvp/rethrow", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.rethrow` will rethrow an error on the next turn of the JavaScript event
      loop in order to aid debugging.

      Promises A+ specifies that any exceptions that occur with a promise must be
      caught by the promises implementation and bubbled to the last handler. For
      this reason, it is recommended that you always specify a second rejection
      handler function to `then`. However, `RSVP.rethrow` will throw the exception
      outside of the promise, so it bubbles up to your console if in the browser,
      or domain/cause uncaught exception in Node. `rethrow` will throw the error
      again so the error can be handled by the promise.

      ```javascript
      function throws(){
        throw new Error('Whoops!');
      }

      var promise = new RSVP.Promise(function(resolve, reject){
        throws();
      });

      promise.catch(RSVP.rethrow).then(function(){
        // Code here doesn't run because the promise became rejected due to an
        // error!
      }, function (err){
        // handle the error here
      });
      ```

      The 'Whoops' error will be thrown on the next turn of the event loop
      and you can watch for it in your console. You can also handle it using a
      rejection handler given to `.then` or `.catch` on the returned promise.

      @method rethrow
      @for RSVP
      @param {Error} reason reason the promise became rejected.
      @throws Error
    */
    __exports__["default"] = function rethrow(reason) {
      setTimeout(function() {
        throw reason;
      });
      throw reason;
    };
  });
define("rsvp/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function objectOrFunction(x) {
      return typeof x === "function" || (typeof x === "object" && x !== null);
    }

    __exports__.objectOrFunction = objectOrFunction;function isFunction(x) {
      return typeof x === "function";
    }

    __exports__.isFunction = isFunction;function isNonThenable(x) {
      return !objectOrFunction(x);
    }

    __exports__.isNonThenable = isNonThenable;function isArray(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    }

    __exports__.isArray = isArray;// Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function() { return new Date().getTime(); };
    __exports__.now = now;
    var keysOf = Object.keys || function(object) {
      var result = [];

      for (var prop in object) {
        result.push(prop);
      }

      return result;
    };
    __exports__.keysOf = keysOf;
  });
define("rsvp", 
  ["./rsvp/promise","./rsvp/events","./rsvp/node","./rsvp/all","./rsvp/all_settled","./rsvp/race","./rsvp/hash","./rsvp/rethrow","./rsvp/defer","./rsvp/config","./rsvp/map","./rsvp/resolve","./rsvp/reject","./rsvp/asap","./rsvp/filter","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];
    var EventTarget = __dependency2__["default"];
    var denodeify = __dependency3__["default"];
    var all = __dependency4__["default"];
    var allSettled = __dependency5__["default"];
    var race = __dependency6__["default"];
    var hash = __dependency7__["default"];
    var rethrow = __dependency8__["default"];
    var defer = __dependency9__["default"];
    var config = __dependency10__.config;
    var configure = __dependency10__.configure;
    var map = __dependency11__["default"];
    var resolve = __dependency12__["default"];
    var reject = __dependency13__["default"];
    var asap = __dependency14__["default"];
    var filter = __dependency15__["default"];

    config.async = asap; // default async is asap;

    function async(callback, arg) {
      config.async(callback, arg);
    }

    function on() {
      config.on.apply(config, arguments);
    }

    function off() {
      config.off.apply(config, arguments);
    }

    // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
    if (typeof window !== 'undefined' && typeof window.__PROMISE_INSTRUMENTATION__ === 'object') {
      var callbacks = window.__PROMISE_INSTRUMENTATION__;
      configure('instrument', true);
      for (var eventName in callbacks) {
        if (callbacks.hasOwnProperty(eventName)) {
          on(eventName, callbacks[eventName]);
        }
      }
    }

    __exports__.Promise = Promise;
    __exports__.EventTarget = EventTarget;
    __exports__.all = all;
    __exports__.allSettled = allSettled;
    __exports__.race = race;
    __exports__.hash = hash;
    __exports__.rethrow = rethrow;
    __exports__.defer = defer;
    __exports__.denodeify = denodeify;
    __exports__.configure = configure;
    __exports__.on = on;
    __exports__.off = off;
    __exports__.resolve = resolve;
    __exports__.reject = reject;
    __exports__.async = async;
    __exports__.map = map;
    __exports__.filter = filter;
  });
global.RSVP = requireModule('rsvp');
}(window));
(function(__exports__) {
  "use strict";
  var specials = [
    '/', '.', '*', '+', '?', '|',
    '(', ')', '[', ']', '{', '}', '\\'
  ];

  var escapeRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');

  function isArray(test) {
    return Object.prototype.toString.call(test) === "[object Array]";
  }

  // A Segment represents a segment in the original route description.
  // Each Segment type provides an `eachChar` and `regex` method.
  //
  // The `eachChar` method invokes the callback with one or more character
  // specifications. A character specification consumes one or more input
  // characters.
  //
  // The `regex` method returns a regex fragment for the segment. If the
  // segment is a dynamic of star segment, the regex fragment also includes
  // a capture.
  //
  // A character specification contains:
  //
  // * `validChars`: a String with a list of all valid characters, or
  // * `invalidChars`: a String with a list of all invalid characters
  // * `repeat`: true if the character specification can repeat

  function StaticSegment(string) { this.string = string; }
  StaticSegment.prototype = {
    eachChar: function(callback) {
      var string = this.string, ch;

      for (var i=0, l=string.length; i<l; i++) {
        ch = string.charAt(i);
        callback({ validChars: ch });
      }
    },

    regex: function() {
      return this.string.replace(escapeRegex, '\\$1');
    },

    generate: function() {
      return this.string;
    }
  };

  function DynamicSegment(name) { this.name = name; }
  DynamicSegment.prototype = {
    eachChar: function(callback) {
      callback({ invalidChars: "/", repeat: true });
    },

    regex: function() {
      return "([^/]+)";
    },

    generate: function(params) {
      return params[this.name];
    }
  };

  function StarSegment(name) { this.name = name; }
  StarSegment.prototype = {
    eachChar: function(callback) {
      callback({ invalidChars: "", repeat: true });
    },

    regex: function() {
      return "(.+)";
    },

    generate: function(params) {
      return params[this.name];
    }
  };

  function EpsilonSegment() {}
  EpsilonSegment.prototype = {
    eachChar: function() {},
    regex: function() { return ""; },
    generate: function() { return ""; }
  };

  function parse(route, names, types) {
    // normalize route as not starting with a "/". Recognition will
    // also normalize.
    if (route.charAt(0) === "/") { route = route.substr(1); }

    var segments = route.split("/"), results = [];

    for (var i=0, l=segments.length; i<l; i++) {
      var segment = segments[i], match;

      if (match = segment.match(/^:([^\/]+)$/)) {
        results.push(new DynamicSegment(match[1]));
        names.push(match[1]);
        types.dynamics++;
      } else if (match = segment.match(/^\*([^\/]+)$/)) {
        results.push(new StarSegment(match[1]));
        names.push(match[1]);
        types.stars++;
      } else if(segment === "") {
        results.push(new EpsilonSegment());
      } else {
        results.push(new StaticSegment(segment));
        types.statics++;
      }
    }

    return results;
  }

  // A State has a character specification and (`charSpec`) and a list of possible
  // subsequent states (`nextStates`).
  //
  // If a State is an accepting state, it will also have several additional
  // properties:
  //
  // * `regex`: A regular expression that is used to extract parameters from paths
  //   that reached this accepting state.
  // * `handlers`: Information on how to convert the list of captures into calls
  //   to registered handlers with the specified parameters
  // * `types`: How many static, dynamic or star segments in this route. Used to
  //   decide which route to use if multiple registered routes match a path.
  //
  // Currently, State is implemented naively by looping over `nextStates` and
  // comparing a character specification against a character. A more efficient
  // implementation would use a hash of keys pointing at one or more next states.

  function State(charSpec) {
    this.charSpec = charSpec;
    this.nextStates = [];
  }

  State.prototype = {
    get: function(charSpec) {
      var nextStates = this.nextStates;

      for (var i=0, l=nextStates.length; i<l; i++) {
        var child = nextStates[i];

        var isEqual = child.charSpec.validChars === charSpec.validChars;
        isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;

        if (isEqual) { return child; }
      }
    },

    put: function(charSpec) {
      var state;

      // If the character specification already exists in a child of the current
      // state, just return that state.
      if (state = this.get(charSpec)) { return state; }

      // Make a new state for the character spec
      state = new State(charSpec);

      // Insert the new state as a child of the current state
      this.nextStates.push(state);

      // If this character specification repeats, insert the new state as a child
      // of itself. Note that this will not trigger an infinite loop because each
      // transition during recognition consumes a character.
      if (charSpec.repeat) {
        state.nextStates.push(state);
      }

      // Return the new state
      return state;
    },

    // Find a list of child states matching the next character
    match: function(ch) {
      // DEBUG "Processing `" + ch + "`:"
      var nextStates = this.nextStates,
          child, charSpec, chars;

      // DEBUG "  " + debugState(this)
      var returned = [];

      for (var i=0, l=nextStates.length; i<l; i++) {
        child = nextStates[i];

        charSpec = child.charSpec;

        if (typeof (chars = charSpec.validChars) !== 'undefined') {
          if (chars.indexOf(ch) !== -1) { returned.push(child); }
        } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
          if (chars.indexOf(ch) === -1) { returned.push(child); }
        }
      }

      return returned;
    }

    /** IF DEBUG
    , debug: function() {
      var charSpec = this.charSpec,
          debug = "[",
          chars = charSpec.validChars || charSpec.invalidChars;

      if (charSpec.invalidChars) { debug += "^"; }
      debug += chars;
      debug += "]";

      if (charSpec.repeat) { debug += "+"; }

      return debug;
    }
    END IF **/
  };

  /** IF DEBUG
  function debug(log) {
    console.log(log);
  }

  function debugState(state) {
    return state.nextStates.map(function(n) {
      if (n.nextStates.length === 0) { return "( " + n.debug() + " [accepting] )"; }
      return "( " + n.debug() + " <then> " + n.nextStates.map(function(s) { return s.debug() }).join(" or ") + " )";
    }).join(", ")
  }
  END IF **/

  // This is a somewhat naive strategy, but should work in a lot of cases
  // A better strategy would properly resolve /posts/:id/new and /posts/edit/:id.
  //
  // This strategy generally prefers more static and less dynamic matching.
  // Specifically, it
  //
  //  * prefers fewer stars to more, then
  //  * prefers using stars for less of the match to more, then
  //  * prefers fewer dynamic segments to more, then
  //  * prefers more static segments to more
  function sortSolutions(states) {
    return states.sort(function(a, b) {
      if (a.types.stars !== b.types.stars) { return a.types.stars - b.types.stars; }

      if (a.types.stars) {
        if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }
        if (a.types.dynamics !== b.types.dynamics) { return b.types.dynamics - a.types.dynamics; }
      }

      if (a.types.dynamics !== b.types.dynamics) { return a.types.dynamics - b.types.dynamics; }
      if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }

      return 0;
    });
  }

  function recognizeChar(states, ch) {
    var nextStates = [];

    for (var i=0, l=states.length; i<l; i++) {
      var state = states[i];

      nextStates = nextStates.concat(state.match(ch));
    }

    return nextStates;
  }

  var oCreate = Object.create || function(proto) {
    function F() {}
    F.prototype = proto;
    return new F();
  };

  function RecognizeResults(queryParams) {
    this.queryParams = queryParams || {};
  }
  RecognizeResults.prototype = oCreate({
    splice: Array.prototype.splice,
    slice:  Array.prototype.slice,
    push:   Array.prototype.push,
    length: 0,
    queryParams: null
  });

  function findHandler(state, path, queryParams) {
    var handlers = state.handlers, regex = state.regex;
    var captures = path.match(regex), currentCapture = 1;
    var result = new RecognizeResults(queryParams);

    for (var i=0, l=handlers.length; i<l; i++) {
      var handler = handlers[i], names = handler.names, params = {};

      for (var j=0, m=names.length; j<m; j++) {
        params[names[j]] = captures[currentCapture++];
      }

      result.push({ handler: handler.handler, params: params, isDynamic: !!names.length });
    }

    return result;
  }

  function addSegment(currentState, segment) {
    segment.eachChar(function(ch) {
      var state;

      currentState = currentState.put(ch);
    });

    return currentState;
  }

  // The main interface

  var RouteRecognizer = function() {
    this.rootState = new State();
    this.names = {};
  };


  RouteRecognizer.prototype = {
    add: function(routes, options) {
      var currentState = this.rootState, regex = "^",
          types = { statics: 0, dynamics: 0, stars: 0 },
          handlers = [], allSegments = [], name;

      var isEmpty = true;

      for (var i=0, l=routes.length; i<l; i++) {
        var route = routes[i], names = [];

        var segments = parse(route.path, names, types);

        allSegments = allSegments.concat(segments);

        for (var j=0, m=segments.length; j<m; j++) {
          var segment = segments[j];

          if (segment instanceof EpsilonSegment) { continue; }

          isEmpty = false;

          // Add a "/" for the new segment
          currentState = currentState.put({ validChars: "/" });
          regex += "/";

          // Add a representation of the segment to the NFA and regex
          currentState = addSegment(currentState, segment);
          regex += segment.regex();
        }

        var handler = { handler: route.handler, names: names };
        handlers.push(handler);
      }

      if (isEmpty) {
        currentState = currentState.put({ validChars: "/" });
        regex += "/";
      }

      currentState.handlers = handlers;
      currentState.regex = new RegExp(regex + "$");
      currentState.types = types;

      if (name = options && options.as) {
        this.names[name] = {
          segments: allSegments,
          handlers: handlers
        };
      }
    },

    handlersFor: function(name) {
      var route = this.names[name], result = [];
      if (!route) { throw new Error("There is no route named " + name); }

      for (var i=0, l=route.handlers.length; i<l; i++) {
        result.push(route.handlers[i]);
      }

      return result;
    },

    hasRoute: function(name) {
      return !!this.names[name];
    },

    generate: function(name, params) {
      var route = this.names[name], output = "";
      if (!route) { throw new Error("There is no route named " + name); }

      var segments = route.segments;

      for (var i=0, l=segments.length; i<l; i++) {
        var segment = segments[i];

        if (segment instanceof EpsilonSegment) { continue; }

        output += "/";
        output += segment.generate(params);
      }

      if (output.charAt(0) !== '/') { output = '/' + output; }

      if (params && params.queryParams) {
        output += this.generateQueryString(params.queryParams, route.handlers);
      }

      return output;
    },

    generateQueryString: function(params, handlers) {
      var pairs = [];
      var keys = [];
      for(var key in params) {
        if (params.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      keys.sort();
      for (var i = 0, len = keys.length; i < len; i++) {
        key = keys[i];
        var value = params[key];
        if (value === false || value == null) {
          continue;
        }
        var pair = key;
        if (isArray(value)) {
          for (var j = 0, l = value.length; j < l; j++) {
            var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
            pairs.push(arrayPair);
          }
        }
        else if (value !== true) {
          pair += "=" + encodeURIComponent(value);
          pairs.push(pair);
        } else {
          pairs.push(pair);
        }
      }

      if (pairs.length === 0) { return ''; }

      return "?" + pairs.join("&");
    },

    parseQueryString: function(queryString) {
      var pairs = queryString.split("&"), queryParams = {};
      for(var i=0; i < pairs.length; i++) {
        var pair      = pairs[i].split('='),
            key       = decodeURIComponent(pair[0]),
            keyLength = key.length,
            isArray = false,
            value;
        if (pair.length === 1) {
          value = true;
        } else {
          //Handle arrays
          if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
            isArray = true;
            key = key.slice(0, keyLength - 2);
            if(!queryParams[key]) {
              queryParams[key] = [];
            }
          }
          value = pair[1] ? decodeURIComponent(pair[1]) : '';
        }
        if (isArray) {
          queryParams[key].push(value);
        } else {
          queryParams[key] = value;
        }

      }
      return queryParams;
    },

    recognize: function(path) {
      var states = [ this.rootState ],
          pathLen, i, l, queryStart, queryParams = {},
          isSlashDropped = false;

      path = decodeURI(path);

      queryStart = path.indexOf('?');
      if (queryStart !== -1) {
        var queryString = path.substr(queryStart + 1, path.length);
        path = path.substr(0, queryStart);
        queryParams = this.parseQueryString(queryString);
      }

      // DEBUG GROUP path

      if (path.charAt(0) !== "/") { path = "/" + path; }

      pathLen = path.length;
      if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
        path = path.substr(0, pathLen - 1);
        isSlashDropped = true;
      }

      for (i=0, l=path.length; i<l; i++) {
        states = recognizeChar(states, path.charAt(i));
        if (!states.length) { break; }
      }

      // END DEBUG GROUP

      var solutions = [];
      for (i=0, l=states.length; i<l; i++) {
        if (states[i].handlers) { solutions.push(states[i]); }
      }

      states = sortSolutions(solutions);

      var state = solutions[0];

      if (state && state.handlers) {
        // if a trailing slash was dropped and a star segment is the last segment
        // specified, put the trailing slash back
        if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
          path = path + "/";
        }
        return findHandler(state, path, queryParams);
      }
    }
  };

  __exports__.RouteRecognizer = RouteRecognizer;

  function Target(path, matcher, delegate) {
    this.path = path;
    this.matcher = matcher;
    this.delegate = delegate;
  }

  Target.prototype = {
    to: function(target, callback) {
      var delegate = this.delegate;

      if (delegate && delegate.willAddRoute) {
        target = delegate.willAddRoute(this.matcher.target, target);
      }

      this.matcher.add(this.path, target);

      if (callback) {
        if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
        this.matcher.addChild(this.path, target, callback, this.delegate);
      }
      return this;
    }
  };

  function Matcher(target) {
    this.routes = {};
    this.children = {};
    this.target = target;
  }

  Matcher.prototype = {
    add: function(path, handler) {
      this.routes[path] = handler;
    },

    addChild: function(path, target, callback, delegate) {
      var matcher = new Matcher(target);
      this.children[path] = matcher;

      var match = generateMatch(path, matcher, delegate);

      if (delegate && delegate.contextEntered) {
        delegate.contextEntered(target, match);
      }

      callback(match);
    }
  };

  function generateMatch(startingPath, matcher, delegate) {
    return function(path, nestedCallback) {
      var fullPath = startingPath + path;

      if (nestedCallback) {
        nestedCallback(generateMatch(fullPath, matcher, delegate));
      } else {
        return new Target(startingPath + path, matcher, delegate);
      }
    };
  }

  function addRoute(routeArray, path, handler) {
    var len = 0;
    for (var i=0, l=routeArray.length; i<l; i++) {
      len += routeArray[i].path.length;
    }

    path = path.substr(len);
    var route = { path: path, handler: handler };
    routeArray.push(route);
  }

  function eachRoute(baseRoute, matcher, callback, binding) {
    var routes = matcher.routes;

    for (var path in routes) {
      if (routes.hasOwnProperty(path)) {
        var routeArray = baseRoute.slice();
        addRoute(routeArray, path, routes[path]);

        if (matcher.children[path]) {
          eachRoute(routeArray, matcher.children[path], callback, binding);
        } else {
          callback.call(binding, routeArray);
        }
      }
    }
  }

  RouteRecognizer.prototype.map = function(callback, addRouteCallback) {
    var matcher = new Matcher();

    callback(generateMatch("", matcher, this.delegate));

    eachRoute([], matcher, function(route) {
      if (addRouteCallback) { addRouteCallback(this, route); }
      else { this.add(route); }
    }, this);
  };
})(window);

(function(globals, RSVP, RouteRecognizer) {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requirejs = require = requireModule = function(name) {

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };
})();

define("router/handler-info",
  ["./utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var bind = __dependency1__.bind;
    var merge = __dependency1__.merge;
    var serialize = __dependency1__.serialize;
    var promiseLabel = __dependency1__.promiseLabel;
    var Promise = __dependency2__["default"];

    function HandlerInfo(_props) {
      var props = _props || {};
      merge(this, props);
      this.initialize(props);
    }

    HandlerInfo.prototype = {
      name: null,
      handler: null,
      params: null,
      context: null,

      // Injected by the handler info factory.
      factory: null,

      initialize: function() {},

      log: function(payload, message) {
        if (payload.log) {
          payload.log(this.name + ': ' + message);
        }
      },

      promiseLabel: function(label) {
        return promiseLabel("'" + this.name + "' " + label);
      },

      getUnresolved: function() {
        return this;
      },

      serialize: function() {
        return this.params || {};
      },

      resolve: function(shouldContinue, payload) {
        var checkForAbort  = bind(this, this.checkForAbort,      shouldContinue),
            beforeModel    = bind(this, this.runBeforeModelHook, payload),
            model          = bind(this, this.getModel,           payload),
            afterModel     = bind(this, this.runAfterModelHook,  payload),
            becomeResolved = bind(this, this.becomeResolved,     payload);

        return Promise.resolve(undefined, this.promiseLabel("Start handler"))
               .then(checkForAbort, null, this.promiseLabel("Check for abort"))
               .then(beforeModel, null, this.promiseLabel("Before model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted during 'beforeModel' hook"))
               .then(model, null, this.promiseLabel("Model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted in 'model' hook"))
               .then(afterModel, null, this.promiseLabel("After model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted in 'afterModel' hook"))
               .then(becomeResolved, null, this.promiseLabel("Become resolved"));
      },

      runBeforeModelHook: function(payload) {
        if (payload.trigger) {
          payload.trigger(true, 'willResolveModel', payload, this.handler);
        }
        return this.runSharedModelHook(payload, 'beforeModel', []);
      },

      runAfterModelHook: function(payload, resolvedModel) {
        // Stash the resolved model on the payload.
        // This makes it possible for users to swap out
        // the resolved model in afterModel.
        var name = this.name;
        this.stashResolvedModel(payload, resolvedModel);

        return this.runSharedModelHook(payload, 'afterModel', [resolvedModel])
                   .then(function() {
                     // Ignore the fulfilled value returned from afterModel.
                     // Return the value stashed in resolvedModels, which
                     // might have been swapped out in afterModel.
                     return payload.resolvedModels[name];
                   }, null, this.promiseLabel("Ignore fulfillment value and return model value"));
      },

      runSharedModelHook: function(payload, hookName, args) {
        this.log(payload, "calling " + hookName + " hook");

        if (this.queryParams) {
          args.push(this.queryParams);
        }
        args.push(payload);

        var handler = this.handler;
        var result = handler[hookName] && handler[hookName].apply(handler, args);

        if (result && result.isTransition) {
          result = null;
        }

        return Promise.resolve(result, null, this.promiseLabel("Resolve value returned from one of the model hooks"));
      },

      // overridden by subclasses
      getModel: null,

      checkForAbort: function(shouldContinue, promiseValue) {
        return Promise.resolve(shouldContinue(), this.promiseLabel("Check for abort")).then(function() {
          // We don't care about shouldContinue's resolve value;
          // pass along the original value passed to this fn.
          return promiseValue;
        }, null, this.promiseLabel("Ignore fulfillment value and continue"));
      },

      stashResolvedModel: function(payload, resolvedModel) {
        payload.resolvedModels = payload.resolvedModels || {};
        payload.resolvedModels[this.name] = resolvedModel;
      },

      becomeResolved: function(payload, resolvedContext) {
        var params = this.serialize(resolvedContext);

        if (payload) {
          this.stashResolvedModel(payload, resolvedContext);
          payload.params = payload.params || {};
          payload.params[this.name] = params;
        }

        return this.factory('resolved', {
          context: resolvedContext,
          name: this.name,
          handler: this.handler,
          params: params
        });
      },

      shouldSupercede: function(other) {
        // Prefer this newer handlerInfo over `other` if:
        // 1) The other one doesn't exist
        // 2) The names don't match
        // 3) This handler has a context that doesn't match
        //    the other one (or the other one doesn't have one).
        // 4) This handler has parameters that don't match the other.
        if (!other) { return true; }

        var contextsMatch = (other.context === this.context);
        return other.name !== this.name ||
               (this.hasOwnProperty('context') && !contextsMatch) ||
               (this.hasOwnProperty('params') && !paramsMatch(this.params, other.params));
      }
    };

    function paramsMatch(a, b) {
      if ((!a) ^ (!b)) {
        // Only one is null.
        return false;
      }

      if (!a) {
        // Both must be null.
        return true;
      }

      // Note: this assumes that both params have the same
      // number of keys, but since we're comparing the
      // same handlers, they should.
      for (var k in a) {
        if (a.hasOwnProperty(k) && a[k] !== b[k]) {
          return false;
        }
      }
      return true;
    }

    __exports__["default"] = HandlerInfo;
  });
define("router/handler-info/factory",
  ["router/handler-info/resolved-handler-info","router/handler-info/unresolved-handler-info-by-object","router/handler-info/unresolved-handler-info-by-param","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var ResolvedHandlerInfo = __dependency1__["default"];
    var UnresolvedHandlerInfoByObject = __dependency2__["default"];
    var UnresolvedHandlerInfoByParam = __dependency3__["default"];

    handlerInfoFactory.klasses = {
      resolved: ResolvedHandlerInfo,
      param: UnresolvedHandlerInfoByParam,
      object: UnresolvedHandlerInfoByObject
    };

    function handlerInfoFactory(name, props) {
      var Ctor = handlerInfoFactory.klasses[name],
          handlerInfo = new Ctor(props || {});
      handlerInfo.factory = handlerInfoFactory;
      return handlerInfo;
    }

    __exports__["default"] = handlerInfoFactory;
  });
define("router/handler-info/resolved-handler-info",
  ["../handler-info","router/utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var HandlerInfo = __dependency1__["default"];
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;
    var Promise = __dependency3__["default"];

    var ResolvedHandlerInfo = subclass(HandlerInfo, {
      resolve: function(shouldContinue, payload) {
        // A ResolvedHandlerInfo just resolved with itself.
        if (payload && payload.resolvedModels) {
          payload.resolvedModels[this.name] = this.context;
        }
        return Promise.resolve(this, this.promiseLabel("Resolve"));
      },

      getUnresolved: function() {
        return this.factory('param', {
          name: this.name,
          handler: this.handler,
          params: this.params
        });
      },

      isResolved: true
    });

    __exports__["default"] = ResolvedHandlerInfo;
  });
define("router/handler-info/unresolved-handler-info-by-object",
  ["../handler-info","router/utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var HandlerInfo = __dependency1__["default"];
    var merge = __dependency2__.merge;
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;
    var isParam = __dependency2__.isParam;
    var Promise = __dependency3__["default"];

    var UnresolvedHandlerInfoByObject = subclass(HandlerInfo, {
      getModel: function(payload) {
        this.log(payload, this.name + ": resolving provided model");
        return Promise.resolve(this.context);
      },

      initialize: function(props) {
        this.names = props.names || [];
        this.context = props.context;
      },

      /**
        @private

        Serializes a handler using its custom `serialize` method or
        by a default that looks up the expected property name from
        the dynamic segment.

        @param {Object} model the model to be serialized for this handler
      */
      serialize: function(_model) {
        var model = _model || this.context,
            names = this.names,
            handler = this.handler;

        var object = {};
        if (isParam(model)) {
          object[names[0]] = model;
          return object;
        }

        // Use custom serialize if it exists.
        if (handler.serialize) {
          return handler.serialize(model, names);
        }

        if (names.length !== 1) { return; }

        var name = names[0];

        if (/_id$/.test(name)) {
          object[name] = model.id;
        } else {
          object[name] = model;
        }
        return object;
      }
    });

    __exports__["default"] = UnresolvedHandlerInfoByObject;
  });
define("router/handler-info/unresolved-handler-info-by-param",
  ["../handler-info","router/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var HandlerInfo = __dependency1__["default"];
    var merge = __dependency2__.merge;
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;

    // Generated by URL transitions and non-dynamic route segments in named Transitions.
    var UnresolvedHandlerInfoByParam = subclass (HandlerInfo, {
      initialize: function(props) {
        this.params = props.params || {};
      },

      getModel: function(payload) {
        var fullParams = this.params;
        if (payload && payload.queryParams) {
          fullParams = {};
          merge(fullParams, this.params);
          fullParams.queryParams = payload.queryParams;
        }

        var hookName = typeof this.handler.deserialize === 'function' ?
                       'deserialize' : 'model';

        return this.runSharedModelHook(payload, hookName, [fullParams]);
      }
    });

    __exports__["default"] = UnresolvedHandlerInfoByParam;
  });
define("router/router",
  ["route-recognizer","rsvp/promise","./utils","./transition-state","./transition","./transition-intent/named-transition-intent","./transition-intent/url-transition-intent","./handler-info","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var RouteRecognizer = __dependency1__["default"];
    var Promise = __dependency2__["default"];
    var trigger = __dependency3__.trigger;
    var log = __dependency3__.log;
    var slice = __dependency3__.slice;
    var forEach = __dependency3__.forEach;
    var merge = __dependency3__.merge;
    var serialize = __dependency3__.serialize;
    var extractQueryParams = __dependency3__.extractQueryParams;
    var getChangelist = __dependency3__.getChangelist;
    var promiseLabel = __dependency3__.promiseLabel;
    var TransitionState = __dependency4__["default"];
    var logAbort = __dependency5__.logAbort;
    var Transition = __dependency5__.Transition;
    var TransitionAborted = __dependency5__.TransitionAborted;
    var NamedTransitionIntent = __dependency6__["default"];
    var URLTransitionIntent = __dependency7__["default"];
    var ResolvedHandlerInfo = __dependency8__.ResolvedHandlerInfo;

    var pop = Array.prototype.pop;

    function Router() {
      this.recognizer = new RouteRecognizer();
      this.reset();
    }

    Router.prototype = {

      /**
        The main entry point into the router. The API is essentially
        the same as the `map` method in `route-recognizer`.

        This method extracts the String handler at the last `.to()`
        call and uses it as the name of the whole route.

        @param {Function} callback
      */
      map: function(callback) {
        this.recognizer.delegate = this.delegate;

        this.recognizer.map(callback, function(recognizer, routes) {
          for (var i = routes.length - 1, proceed = true; i >= 0 && proceed; --i) {
            var route = routes[i];
            recognizer.add(routes, { as: route.handler });
            proceed = route.path === '/' || route.path === '' || route.handler.slice(-6) === '.index';
          }
        });
      },

      hasRoute: function(route) {
        return this.recognizer.hasRoute(route);
      },

      queryParamsTransition: function(changelist, wasTransitioning, oldState, newState) {
        var router = this;

        // This is a little hacky but we need some way of storing
        // changed query params given that no activeTransition
        // is guaranteed to have occurred.
        this._changedQueryParams = changelist.changed;
        for (var k in changelist.removed) {
          if (changelist.removed.hasOwnProperty(k)) {
            this._changedQueryParams[k] = null;
          }
        }
        fireQueryParamDidChange(this, newState, changelist);
        this._changedQueryParams = null;

        if (!wasTransitioning && this.activeTransition) {
          // One of the handlers in queryParamsDidChange
          // caused a transition. Just return that transition.
          return this.activeTransition;
        } else {
          // Running queryParamsDidChange didn't change anything.
          // Just update query params and be on our way.

          // We have to return a noop transition that will
          // perform a URL update at the end. This gives
          // the user the ability to set the url update
          // method (default is replaceState).
          var newTransition = new Transition(this);
          newTransition.queryParamsOnly = true;

          oldState.queryParams = finalizeQueryParamChange(this, newState.handlerInfos, newState.queryParams, newTransition);

          newTransition.promise = newTransition.promise.then(function(result) {
            updateURL(newTransition, oldState, true);
            if (router.didTransition) {
              router.didTransition(router.currentHandlerInfos);
            }
            return result;
          }, null, promiseLabel("Transition complete"));
          return newTransition;
        }
      },

      // NOTE: this doesn't really belong here, but here
      // it shall remain until our ES6 transpiler can
      // handle cyclical deps.
      transitionByIntent: function(intent, isIntermediate) {

        var wasTransitioning = !!this.activeTransition;
        var oldState = wasTransitioning ? this.activeTransition.state : this.state;
        var newTransition;
        var router = this;

        try {
          var newState = intent.applyToState(oldState, this.recognizer, this.getHandler, isIntermediate);
          var queryParamChangelist = getChangelist(oldState.queryParams, newState.queryParams);

          if (handlerInfosEqual(newState.handlerInfos, oldState.handlerInfos)) {

            // This is a no-op transition. See if query params changed.
            if (queryParamChangelist) {
              newTransition = this.queryParamsTransition(queryParamChangelist, wasTransitioning, oldState, newState);
              if (newTransition) {
                return newTransition;
              }
            }

            // No-op. No need to create a new transition.
            return new Transition(this);
          }

          if (isIntermediate) {
            setupContexts(this, newState);
            return;
          }

          // Create a new transition to the destination route.
          newTransition = new Transition(this, intent, newState);

          // Abort and usurp any previously active transition.
          if (this.activeTransition) {
            this.activeTransition.abort();
          }
          this.activeTransition = newTransition;

          // Transition promises by default resolve with resolved state.
          // For our purposes, swap out the promise to resolve
          // after the transition has been finalized.
          newTransition.promise = newTransition.promise.then(function(result) {
            return finalizeTransition(newTransition, result.state);
          }, null, promiseLabel("Settle transition promise when transition is finalized"));

          if (!wasTransitioning) {
            notifyExistingHandlers(this, newState, newTransition);
          }

          fireQueryParamDidChange(this, newState, queryParamChangelist);

          return newTransition;
        } catch(e) {
          return new Transition(this, intent, null, e);
        }
      },

      /**
        Clears the current and target route handlers and triggers exit
        on each of them starting at the leaf and traversing up through
        its ancestors.
      */
      reset: function() {
        if (this.state) {
          forEach(this.state.handlerInfos, function(handlerInfo) {
            var handler = handlerInfo.handler;
            if (handler.exit) {
              handler.exit();
            }
          });
        }

        this.state = new TransitionState();
        this.currentHandlerInfos = null;
      },

      activeTransition: null,

      /**
        var handler = handlerInfo.handler;
        The entry point for handling a change to the URL (usually
        via the back and forward button).

        Returns an Array of handlers and the parameters associated
        with those parameters.

        @param {String} url a URL to process

        @return {Array} an Array of `[handler, parameter]` tuples
      */
      handleURL: function(url) {
        // Perform a URL-based transition, but don't change
        // the URL afterward, since it already happened.
        var args = slice.call(arguments);
        if (url.charAt(0) !== '/') { args[0] = '/' + url; }

        return doTransition(this, args).method(null);
      },

      /**
        Hook point for updating the URL.

        @param {String} url a URL to update to
      */
      updateURL: function() {
        throw new Error("updateURL is not implemented");
      },

      /**
        Hook point for replacing the current URL, i.e. with replaceState

        By default this behaves the same as `updateURL`

        @param {String} url a URL to update to
      */
      replaceURL: function(url) {
        this.updateURL(url);
      },

      /**
        Transition into the specified named route.

        If necessary, trigger the exit callback on any handlers
        that are no longer represented by the target route.

        @param {String} name the name of the route
      */
      transitionTo: function(name) {
        return doTransition(this, arguments);
      },

      intermediateTransitionTo: function(name) {
        doTransition(this, arguments, true);
      },

      refresh: function(pivotHandler) {


        var state = this.activeTransition ? this.activeTransition.state : this.state;
        var handlerInfos = state.handlerInfos;
        var params = {};
        for (var i = 0, len = handlerInfos.length; i < len; ++i) {
          var handlerInfo = handlerInfos[i];
          params[handlerInfo.name] = handlerInfo.params || {};
        }

        log(this, "Starting a refresh transition");
        var intent = new NamedTransitionIntent({
          name: handlerInfos[handlerInfos.length - 1].name,
          pivotHandler: pivotHandler || handlerInfos[0].handler,
          contexts: [], // TODO collect contexts...?
          queryParams: this._changedQueryParams || state.queryParams || {}
        });

        return this.transitionByIntent(intent, false);
      },

      /**
        Identical to `transitionTo` except that the current URL will be replaced
        if possible.

        This method is intended primarily for use with `replaceState`.

        @param {String} name the name of the route
      */
      replaceWith: function(name) {
        return doTransition(this, arguments).method('replace');
      },

      /**
        Take a named route and context objects and generate a
        URL.

        @param {String} name the name of the route to generate
          a URL for
        @param {...Object} objects a list of objects to serialize

        @return {String} a URL
      */
      generate: function(handlerName) {

        var partitionedArgs = extractQueryParams(slice.call(arguments, 1)),
          suppliedParams = partitionedArgs[0],
          queryParams = partitionedArgs[1];

        // Construct a TransitionIntent with the provided params
        // and apply it to the present state of the router.
        var intent = new NamedTransitionIntent({ name: handlerName, contexts: suppliedParams });
        var state = intent.applyToState(this.state, this.recognizer, this.getHandler);
        var params = {};

        for (var i = 0, len = state.handlerInfos.length; i < len; ++i) {
          var handlerInfo = state.handlerInfos[i];
          var handlerParams = handlerInfo.serialize();
          merge(params, handlerParams);
        }
        params.queryParams = queryParams;

        return this.recognizer.generate(handlerName, params);
      },

      applyIntent: function(handlerName, contexts) {
        var intent = new NamedTransitionIntent({
          name: handlerName,
          contexts: contexts
        });

        var state = this.activeTransition && this.activeTransition.state || this.state;
        return intent.applyToState(state, this.recognizer, this.getHandler);
      },

      isActiveIntent: function(handlerName, contexts, queryParams) {
        var targetHandlerInfos = this.state.handlerInfos,
            found = false, names, object, handlerInfo, handlerObj, i, len;

        if (!targetHandlerInfos.length) { return false; }

        var targetHandler = targetHandlerInfos[targetHandlerInfos.length - 1].name;
        var recogHandlers = this.recognizer.handlersFor(targetHandler);

        var index = 0;
        for (len = recogHandlers.length; index < len; ++index) {
          handlerInfo = targetHandlerInfos[index];
          if (handlerInfo.name === handlerName) { break; }
        }

        if (index === recogHandlers.length) {
          // The provided route name isn't even in the route hierarchy.
          return false;
        }

        var state = new TransitionState();
        state.handlerInfos = targetHandlerInfos.slice(0, index + 1);
        recogHandlers = recogHandlers.slice(0, index + 1);

        var intent = new NamedTransitionIntent({
          name: targetHandler,
          contexts: contexts
        });

        var newState = intent.applyToHandlers(state, recogHandlers, this.getHandler, targetHandler, true, true);

        var handlersEqual = handlerInfosEqual(newState.handlerInfos, state.handlerInfos);
        if (!queryParams || !handlersEqual) {
          return handlersEqual;
        }

        // Get a hash of QPs that will still be active on new route
        var activeQPsOnNewHandler = {};
        merge(activeQPsOnNewHandler, queryParams);

        var activeQueryParams  = this.state.queryParams;
        for (var key in activeQueryParams) {
          if (activeQueryParams.hasOwnProperty(key) &&
              activeQPsOnNewHandler.hasOwnProperty(key)) {
            activeQPsOnNewHandler[key] = activeQueryParams[key];
          }
        }

        return handlersEqual && !getChangelist(activeQPsOnNewHandler, queryParams);
      },

      isActive: function(handlerName) {
        var partitionedArgs = extractQueryParams(slice.call(arguments, 1));
        return this.isActiveIntent(handlerName, partitionedArgs[0], partitionedArgs[1]);
      },

      trigger: function(name) {
        var args = slice.call(arguments);
        trigger(this, this.currentHandlerInfos, false, args);
      },

      /**
        Hook point for logging transition status updates.

        @param {String} message The message to log.
      */
      log: null,

      _willChangeContextEvent: 'willChangeContext',
      _triggerWillChangeContext: function(handlerInfos, newTransition) {
        trigger(this, handlerInfos, true, [this._willChangeContextEvent, newTransition]);
      },

      _triggerWillLeave: function(handlerInfos, newTransition, leavingChecker) {
        trigger(this, handlerInfos, true, ['willLeave', newTransition, leavingChecker]);
      }
    };

    /**
      @private

      Fires queryParamsDidChange event
    */
    function fireQueryParamDidChange(router, newState, queryParamChangelist) {
      // If queryParams changed trigger event
      if (queryParamChangelist) {

        // This is a little hacky but we need some way of storing
        // changed query params given that no activeTransition
        // is guaranteed to have occurred.
        router._changedQueryParams = queryParamChangelist.changed;
        for (var i in queryParamChangelist.removed) {
          if (queryParamChangelist.removed.hasOwnProperty(i)) {
            router._changedQueryParams[i] = null;
          }
        }
        trigger(router, newState.handlerInfos, true, ['queryParamsDidChange', queryParamChangelist.changed, queryParamChangelist.all, queryParamChangelist.removed]);
        router._changedQueryParams = null;
      }
    }

    /**
      @private

      Takes an Array of `HandlerInfo`s, figures out which ones are
      exiting, entering, or changing contexts, and calls the
      proper handler hooks.

      For example, consider the following tree of handlers. Each handler is
      followed by the URL segment it handles.

      ```
      |~index ("/")
      | |~posts ("/posts")
      | | |-showPost ("/:id")
      | | |-newPost ("/new")
      | | |-editPost ("/edit")
      | |~about ("/about/:id")
      ```

      Consider the following transitions:

      1. A URL transition to `/posts/1`.
         1. Triggers the `*model` callbacks on the
            `index`, `posts`, and `showPost` handlers
         2. Triggers the `enter` callback on the same
         3. Triggers the `setup` callback on the same
      2. A direct transition to `newPost`
         1. Triggers the `exit` callback on `showPost`
         2. Triggers the `enter` callback on `newPost`
         3. Triggers the `setup` callback on `newPost`
      3. A direct transition to `about` with a specified
         context object
         1. Triggers the `exit` callback on `newPost`
            and `posts`
         2. Triggers the `serialize` callback on `about`
         3. Triggers the `enter` callback on `about`
         4. Triggers the `setup` callback on `about`

      @param {Router} transition
      @param {TransitionState} newState
    */
    function setupContexts(router, newState, transition) {
      var partition = partitionHandlers(router.state, newState);

      forEach(partition.exited, function(handlerInfo) {
        var handler = handlerInfo.handler;
        delete handler.context;
        if (handler.reset) { handler.reset(true, transition); }
        if (handler.exit) { handler.exit(transition); }
      });

      var oldState = router.oldState = router.state;
      router.state = newState;
      var currentHandlerInfos = router.currentHandlerInfos = partition.unchanged.slice();

      try {
        forEach(partition.reset, function(handlerInfo) {
          var handler = handlerInfo.handler;
          if (handler.reset) { handler.reset(false, transition); }
        });

        forEach(partition.updatedContext, function(handlerInfo) {
          return handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, false, transition);
        });

        forEach(partition.entered, function(handlerInfo) {
          return handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, true, transition);
        });
      } catch(e) {
        router.state = oldState;
        router.currentHandlerInfos = oldState.handlerInfos;
        throw e;
      }

      router.state.queryParams = finalizeQueryParamChange(router, currentHandlerInfos, newState.queryParams, transition);
    }


    /**
      @private

      Helper method used by setupContexts. Handles errors or redirects
      that may happen in enter/setup.
    */
    function handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, enter, transition) {

      var handler = handlerInfo.handler,
          context = handlerInfo.context;

      if (enter && handler.enter) { handler.enter(transition); }
      if (transition && transition.isAborted) {
        throw new TransitionAborted();
      }

      handler.context = context;
      if (handler.contextDidChange) { handler.contextDidChange(); }

      if (handler.setup) { handler.setup(context, transition); }
      if (transition && transition.isAborted) {
        throw new TransitionAborted();
      }

      currentHandlerInfos.push(handlerInfo);

      return true;
    }


    /**
      @private

      This function is called when transitioning from one URL to
      another to determine which handlers are no longer active,
      which handlers are newly active, and which handlers remain
      active but have their context changed.

      Take a list of old handlers and new handlers and partition
      them into four buckets:

      * unchanged: the handler was active in both the old and
        new URL, and its context remains the same
      * updated context: the handler was active in both the
        old and new URL, but its context changed. The handler's
        `setup` method, if any, will be called with the new
        context.
      * exited: the handler was active in the old URL, but is
        no longer active.
      * entered: the handler was not active in the old URL, but
        is now active.

      The PartitionedHandlers structure has four fields:

      * `updatedContext`: a list of `HandlerInfo` objects that
        represent handlers that remain active but have a changed
        context
      * `entered`: a list of `HandlerInfo` objects that represent
        handlers that are newly active
      * `exited`: a list of `HandlerInfo` objects that are no
        longer active.
      * `unchanged`: a list of `HanderInfo` objects that remain active.

      @param {Array[HandlerInfo]} oldHandlers a list of the handler
        information for the previous URL (or `[]` if this is the
        first handled transition)
      @param {Array[HandlerInfo]} newHandlers a list of the handler
        information for the new URL

      @return {Partition}
    */
    function partitionHandlers(oldState, newState) {
      var oldHandlers = oldState.handlerInfos;
      var newHandlers = newState.handlerInfos;

      var handlers = {
            updatedContext: [],
            exited: [],
            entered: [],
            unchanged: []
          };

      var handlerChanged, contextChanged, i, l;

      for (i=0, l=newHandlers.length; i<l; i++) {
        var oldHandler = oldHandlers[i], newHandler = newHandlers[i];

        if (!oldHandler || oldHandler.handler !== newHandler.handler) {
          handlerChanged = true;
        }

        if (handlerChanged) {
          handlers.entered.push(newHandler);
          if (oldHandler) { handlers.exited.unshift(oldHandler); }
        } else if (contextChanged || oldHandler.context !== newHandler.context) {
          contextChanged = true;
          handlers.updatedContext.push(newHandler);
        } else {
          handlers.unchanged.push(oldHandler);
        }
      }

      for (i=newHandlers.length, l=oldHandlers.length; i<l; i++) {
        handlers.exited.unshift(oldHandlers[i]);
      }

      handlers.reset = handlers.updatedContext.slice();
      handlers.reset.reverse();

      return handlers;
    }

    function updateURL(transition, state, inputUrl) {
      var urlMethod = transition.urlMethod;

      if (!urlMethod) {
        return;
      }

      var router = transition.router,
          handlerInfos = state.handlerInfos,
          handlerName = handlerInfos[handlerInfos.length - 1].name,
          params = {};

      for (var i = handlerInfos.length - 1; i >= 0; --i) {
        var handlerInfo = handlerInfos[i];
        merge(params, handlerInfo.params);
        if (handlerInfo.handler.inaccessibleByURL) {
          urlMethod = null;
        }
      }

      if (urlMethod) {
        params.queryParams = transition._visibleQueryParams || state.queryParams;
        var url = router.recognizer.generate(handlerName, params);

        if (urlMethod === 'replace') {
          router.replaceURL(url);
        } else {
          router.updateURL(url);
        }
      }
    }

    /**
      @private

      Updates the URL (if necessary) and calls `setupContexts`
      to update the router's array of `currentHandlerInfos`.
     */
    function finalizeTransition(transition, newState) {

      try {
        log(transition.router, transition.sequence, "Resolved all models on destination route; finalizing transition.");

        var router = transition.router,
            handlerInfos = newState.handlerInfos,
            seq = transition.sequence;

        // Run all the necessary enter/setup/exit hooks
        setupContexts(router, newState, transition);

        // Check if a redirect occurred in enter/setup
        if (transition.isAborted) {
          // TODO: cleaner way? distinguish b/w targetHandlerInfos?
          router.state.handlerInfos = router.currentHandlerInfos;
          return Promise.reject(logAbort(transition));
        }

        updateURL(transition, newState, transition.intent.url);

        transition.isActive = false;
        router.activeTransition = null;

        trigger(router, router.currentHandlerInfos, true, ['didTransition']);

        if (router.didTransition) {
          router.didTransition(router.currentHandlerInfos);
        }

        log(router, transition.sequence, "TRANSITION COMPLETE.");

        // Resolve with the final handler.
        return handlerInfos[handlerInfos.length - 1].handler;
      } catch(e) {
        if (!(e instanceof TransitionAborted)) {
          //var erroneousHandler = handlerInfos.pop();
          var infos = transition.state.handlerInfos;
          transition.trigger(true, 'error', e, transition, infos[infos.length-1].handler);
          transition.abort();
        }

        throw e;
      }
    }

    /**
      @private

      Begins and returns a Transition based on the provided
      arguments. Accepts arguments in the form of both URL
      transitions and named transitions.

      @param {Router} router
      @param {Array[Object]} args arguments passed to transitionTo,
        replaceWith, or handleURL
    */
    function doTransition(router, args, isIntermediate) {
      // Normalize blank transitions to root URL transitions.
      var name = args[0] || '/';

      var lastArg = args[args.length-1];
      var queryParams = {};
      if (lastArg && lastArg.hasOwnProperty('queryParams')) {
        queryParams = pop.call(args).queryParams;
      }

      var intent;
      if (args.length === 0) {

        log(router, "Updating query params");

        // A query param update is really just a transition
        // into the route you're already on.
        var handlerInfos = router.state.handlerInfos;
        intent = new NamedTransitionIntent({
          name: handlerInfos[handlerInfos.length - 1].name,
          contexts: [],
          queryParams: queryParams
        });

      } else if (name.charAt(0) === '/') {

        log(router, "Attempting URL transition to " + name);
        intent = new URLTransitionIntent({ url: name });

      } else {

        log(router, "Attempting transition to " + name);
        intent = new NamedTransitionIntent({
          name: args[0],
          contexts: slice.call(args, 1),
          queryParams: queryParams
        });
      }

      return router.transitionByIntent(intent, isIntermediate);
    }

    function handlerInfosEqual(handlerInfos, otherHandlerInfos) {
      if (handlerInfos.length !== otherHandlerInfos.length) {
        return false;
      }

      for (var i = 0, len = handlerInfos.length; i < len; ++i) {
        if (handlerInfos[i] !== otherHandlerInfos[i]) {
          return false;
        }
      }
      return true;
    }

    function finalizeQueryParamChange(router, resolvedHandlers, newQueryParams, transition) {
      // We fire a finalizeQueryParamChange event which
      // gives the new route hierarchy a chance to tell
      // us which query params it's consuming and what
      // their final values are. If a query param is
      // no longer consumed in the final route hierarchy,
      // its serialized segment will be removed
      // from the URL.

      for (var k in newQueryParams) {
        if (newQueryParams.hasOwnProperty(k) &&
            newQueryParams[k] === null) {
          delete newQueryParams[k];
        }
      }

      var finalQueryParamsArray = [];
      trigger(router, resolvedHandlers, true, ['finalizeQueryParamChange', newQueryParams, finalQueryParamsArray, transition]);

      if (transition) {
        transition._visibleQueryParams = {};
      }

      var finalQueryParams = {};
      for (var i = 0, len = finalQueryParamsArray.length; i < len; ++i) {
        var qp = finalQueryParamsArray[i];
        finalQueryParams[qp.key] = qp.value;
        if (transition && qp.visible !== false) {
          transition._visibleQueryParams[qp.key] = qp.value;
        }
      }
      return finalQueryParams;
    }

    function notifyExistingHandlers(router, newState, newTransition) {
      var oldHandlers = router.state.handlerInfos,
          changing = [],
          leavingIndex = null,
          leaving, leavingChecker, i, oldHandler, newHandler;

      for (i = 0; i < oldHandlers.length; i++) {
        oldHandler = oldHandlers[i];
        newHandler = newState.handlerInfos[i];

        if (!newHandler || oldHandler.name !== newHandler.name) {
          leavingIndex = i;
          break;
        }

        if (!newHandler.isResolved) {
          changing.push(oldHandler);
        }
      }

      if (leavingIndex !== null) {
        leaving = oldHandlers.slice(leavingIndex, oldHandlers.length);
        leavingChecker = function(name) {
          for (var h = 0; h < leaving.length; h++) {
            if (leaving[h].name === name) {
              return true;
            }
          }
          return false;
        };

        router._triggerWillLeave(leaving, newTransition, leavingChecker);
      }

      if (changing.length > 0) {
        router._triggerWillChangeContext(changing, newTransition);
      }

      trigger(router, oldHandlers, true, ['willTransition', newTransition]);
    }

    __exports__["default"] = Router;
  });
define("router/transition-intent",
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var merge = __dependency1__.merge;

    function TransitionIntent(props) {
      this.initialize(props);

      // TODO: wat
      this.data = this.data || {};
    }

    TransitionIntent.prototype = {
      initialize: null,
      applyToState: null
    };

    __exports__["default"] = TransitionIntent;
  });
define("router/transition-intent/named-transition-intent",
  ["../transition-intent","../transition-state","../handler-info/factory","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var TransitionIntent = __dependency1__["default"];
    var TransitionState = __dependency2__["default"];
    var handlerInfoFactory = __dependency3__["default"];
    var isParam = __dependency4__.isParam;
    var extractQueryParams = __dependency4__.extractQueryParams;
    var merge = __dependency4__.merge;
    var subclass = __dependency4__.subclass;

    __exports__["default"] = subclass(TransitionIntent, {
      name: null,
      pivotHandler: null,
      contexts: null,
      queryParams: null,

      initialize: function(props) {
        this.name = props.name;
        this.pivotHandler = props.pivotHandler;
        this.contexts = props.contexts || [];
        this.queryParams = props.queryParams;
      },

      applyToState: function(oldState, recognizer, getHandler, isIntermediate) {

        var partitionedArgs     = extractQueryParams([this.name].concat(this.contexts)),
          pureArgs              = partitionedArgs[0],
          queryParams           = partitionedArgs[1],
          handlers              = recognizer.handlersFor(pureArgs[0]);

        var targetRouteName = handlers[handlers.length-1].handler;

        return this.applyToHandlers(oldState, handlers, getHandler, targetRouteName, isIntermediate);
      },

      applyToHandlers: function(oldState, handlers, getHandler, targetRouteName, isIntermediate, checkingIfActive) {

        var i;
        var newState = new TransitionState();
        var objects = this.contexts.slice(0);

        var invalidateIndex = handlers.length;

        // Pivot handlers are provided for refresh transitions
        if (this.pivotHandler) {
          for (i = 0; i < handlers.length; ++i) {
            if (getHandler(handlers[i].handler) === this.pivotHandler) {
              invalidateIndex = i;
              break;
            }
          }
        }

        var pivotHandlerFound = !this.pivotHandler;

        for (i = handlers.length - 1; i >= 0; --i) {
          var result = handlers[i];
          var name = result.handler;
          var handler = getHandler(name);

          var oldHandlerInfo = oldState.handlerInfos[i];
          var newHandlerInfo = null;

          if (result.names.length > 0) {
            if (i >= invalidateIndex) {
              newHandlerInfo = this.createParamHandlerInfo(name, handler, result.names, objects, oldHandlerInfo);
            } else {
              newHandlerInfo = this.getHandlerInfoForDynamicSegment(name, handler, result.names, objects, oldHandlerInfo, targetRouteName, i);
            }
          } else {
            // This route has no dynamic segment.
            // Therefore treat as a param-based handlerInfo
            // with empty params. This will cause the `model`
            // hook to be called with empty params, which is desirable.
            newHandlerInfo = this.createParamHandlerInfo(name, handler, result.names, objects, oldHandlerInfo);
          }

          if (checkingIfActive) {
            // If we're performing an isActive check, we want to
            // serialize URL params with the provided context, but
            // ignore mismatches between old and new context.
            newHandlerInfo = newHandlerInfo.becomeResolved(null, newHandlerInfo.context);
            var oldContext = oldHandlerInfo && oldHandlerInfo.context;
            if (result.names.length > 0 && newHandlerInfo.context === oldContext) {
              // If contexts match in isActive test, assume params also match.
              // This allows for flexibility in not requiring that every last
              // handler provide a `serialize` method
              newHandlerInfo.params = oldHandlerInfo && oldHandlerInfo.params;
            }
            newHandlerInfo.context = oldContext;
          }

          var handlerToUse = oldHandlerInfo;
          if (i >= invalidateIndex || newHandlerInfo.shouldSupercede(oldHandlerInfo)) {
            invalidateIndex = Math.min(i, invalidateIndex);
            handlerToUse = newHandlerInfo;
          }

          if (isIntermediate && !checkingIfActive) {
            handlerToUse = handlerToUse.becomeResolved(null, handlerToUse.context);
          }

          newState.handlerInfos.unshift(handlerToUse);
        }

        if (objects.length > 0) {
          throw new Error("More context objects were passed than there are dynamic segments for the route: " + targetRouteName);
        }

        if (!isIntermediate) {
          this.invalidateChildren(newState.handlerInfos, invalidateIndex);
        }

        merge(newState.queryParams, this.queryParams || {});

        return newState;
      },

      invalidateChildren: function(handlerInfos, invalidateIndex) {
        for (var i = invalidateIndex, l = handlerInfos.length; i < l; ++i) {
          var handlerInfo = handlerInfos[i];
          handlerInfos[i] = handlerInfos[i].getUnresolved();
        }
      },

      getHandlerInfoForDynamicSegment: function(name, handler, names, objects, oldHandlerInfo, targetRouteName, i) {

        var numNames = names.length;
        var objectToUse;
        if (objects.length > 0) {

          // Use the objects provided for this transition.
          objectToUse = objects[objects.length - 1];
          if (isParam(objectToUse)) {
            return this.createParamHandlerInfo(name, handler, names, objects, oldHandlerInfo);
          } else {
            objects.pop();
          }
        } else if (oldHandlerInfo && oldHandlerInfo.name === name) {
          // Reuse the matching oldHandlerInfo
          return oldHandlerInfo;
        } else {
          if (this.preTransitionState) {
            var preTransitionHandlerInfo = this.preTransitionState.handlerInfos[i];
            objectToUse = preTransitionHandlerInfo && preTransitionHandlerInfo.context;
          } else {
            // Ideally we should throw this error to provide maximal
            // information to the user that not enough context objects
            // were provided, but this proves too cumbersome in Ember
            // in cases where inner template helpers are evaluated
            // before parent helpers un-render, in which cases this
            // error somewhat prematurely fires.
            //throw new Error("Not enough context objects were provided to complete a transition to " + targetRouteName + ". Specifically, the " + name + " route needs an object that can be serialized into its dynamic URL segments [" + names.join(', ') + "]");
            return oldHandlerInfo;
          }
        }

        return handlerInfoFactory('object', {
          name: name,
          handler: handler,
          context: objectToUse,
          names: names
        });
      },

      createParamHandlerInfo: function(name, handler, names, objects, oldHandlerInfo) {
        var params = {};

        // Soak up all the provided string/numbers
        var numNames = names.length;
        while (numNames--) {

          // Only use old params if the names match with the new handler
          var oldParams = (oldHandlerInfo && name === oldHandlerInfo.name && oldHandlerInfo.params) || {};

          var peek = objects[objects.length - 1];
          var paramName = names[numNames];
          if (isParam(peek)) {
            params[paramName] = "" + objects.pop();
          } else {
            // If we're here, this means only some of the params
            // were string/number params, so try and use a param
            // value from a previous handler.
            if (oldParams.hasOwnProperty(paramName)) {
              params[paramName] = oldParams[paramName];
            } else {
              throw new Error("You didn't provide enough string/numeric parameters to satisfy all of the dynamic segments for route " + name);
            }
          }
        }

        return handlerInfoFactory('param', {
          name: name,
          handler: handler,
          params: params
        });
      }
    });
  });
define("router/transition-intent/url-transition-intent",
  ["../transition-intent","../transition-state","../handler-info/factory","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var TransitionIntent = __dependency1__["default"];
    var TransitionState = __dependency2__["default"];
    var handlerInfoFactory = __dependency3__["default"];
    var oCreate = __dependency4__.oCreate;
    var merge = __dependency4__.merge;
    var subclass = __dependency4__.subclass;

    __exports__["default"] = subclass(TransitionIntent, {
      url: null,

      initialize: function(props) {
        this.url = props.url;
      },

      applyToState: function(oldState, recognizer, getHandler) {
        var newState = new TransitionState();

        var results = recognizer.recognize(this.url),
            queryParams = {},
            i, len;

        if (!results) {
          throw new UnrecognizedURLError(this.url);
        }

        var statesDiffer = false;

        for (i = 0, len = results.length; i < len; ++i) {
          var result = results[i];
          var name = result.handler;
          var handler = getHandler(name);

          if (handler.inaccessibleByURL) {
            throw new UnrecognizedURLError(this.url);
          }

          var newHandlerInfo = handlerInfoFactory('param', {
            name: name,
            handler: handler,
            params: result.params
          });

          var oldHandlerInfo = oldState.handlerInfos[i];
          if (statesDiffer || newHandlerInfo.shouldSupercede(oldHandlerInfo)) {
            statesDiffer = true;
            newState.handlerInfos[i] = newHandlerInfo;
          } else {
            newState.handlerInfos[i] = oldHandlerInfo;
          }
        }

        merge(newState.queryParams, results.queryParams);

        return newState;
      }
    });

    /**
      Promise reject reasons passed to promise rejection
      handlers for failed transitions.
     */
    function UnrecognizedURLError(message) {
      this.message = (message || "UnrecognizedURLError");
      this.name = "UnrecognizedURLError";
    }
  });
define("router/transition-state",
  ["./handler-info","./utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var ResolvedHandlerInfo = __dependency1__.ResolvedHandlerInfo;
    var forEach = __dependency2__.forEach;
    var promiseLabel = __dependency2__.promiseLabel;
    var Promise = __dependency3__["default"];

    function TransitionState(other) {
      this.handlerInfos = [];
      this.queryParams = {};
      this.params = {};
    }

    TransitionState.prototype = {
      handlerInfos: null,
      queryParams: null,
      params: null,

      promiseLabel: function(label) {
        var targetName = '';
        forEach(this.handlerInfos, function(handlerInfo) {
          if (targetName !== '') {
            targetName += '.';
          }
          targetName += handlerInfo.name;
        });
        return promiseLabel("'" + targetName + "': " + label);
      },

      resolve: function(shouldContinue, payload) {
        var self = this;
        // First, calculate params for this state. This is useful
        // information to provide to the various route hooks.
        var params = this.params;
        forEach(this.handlerInfos, function(handlerInfo) {
          params[handlerInfo.name] = handlerInfo.params || {};
        });

        payload = payload || {};
        payload.resolveIndex = 0;

        var currentState = this;
        var wasAborted = false;

        // The prelude RSVP.resolve() asyncs us into the promise land.
        return Promise.resolve(null, this.promiseLabel("Start transition"))
        .then(resolveOneHandlerInfo, null, this.promiseLabel('Resolve handler'))['catch'](handleError, this.promiseLabel('Handle error'));

        function innerShouldContinue() {
          return Promise.resolve(shouldContinue(), promiseLabel("Check if should continue"))['catch'](function(reason) {
            // We distinguish between errors that occurred
            // during resolution (e.g. beforeModel/model/afterModel),
            // and aborts due to a rejecting promise from shouldContinue().
            wasAborted = true;
            return Promise.reject(reason);
          }, promiseLabel("Handle abort"));
        }

        function handleError(error) {
          // This is the only possible
          // reject value of TransitionState#resolve
          var handlerInfos = currentState.handlerInfos;
          var errorHandlerIndex = payload.resolveIndex >= handlerInfos.length ?
                                  handlerInfos.length - 1 : payload.resolveIndex;
          return Promise.reject({
            error: error,
            handlerWithError: currentState.handlerInfos[errorHandlerIndex].handler,
            wasAborted: wasAborted,
            state: currentState
          });
        }

        function proceed(resolvedHandlerInfo) {
          var wasAlreadyResolved = currentState.handlerInfos[payload.resolveIndex].isResolved;

          // Swap the previously unresolved handlerInfo with
          // the resolved handlerInfo
          currentState.handlerInfos[payload.resolveIndex++] = resolvedHandlerInfo;

          if (!wasAlreadyResolved) {
            // Call the redirect hook. The reason we call it here
            // vs. afterModel is so that redirects into child
            // routes don't re-run the model hooks for this
            // already-resolved route.
            var handler = resolvedHandlerInfo.handler;
            if (handler && handler.redirect) {
              handler.redirect(resolvedHandlerInfo.context, payload);
            }
          }

          // Proceed after ensuring that the redirect hook
          // didn't abort this transition by transitioning elsewhere.
          return innerShouldContinue().then(resolveOneHandlerInfo, null, promiseLabel('Resolve handler'));
        }

        function resolveOneHandlerInfo() {
          if (payload.resolveIndex === currentState.handlerInfos.length) {
            // This is is the only possible
            // fulfill value of TransitionState#resolve
            return {
              error: null,
              state: currentState
            };
          }

          var handlerInfo = currentState.handlerInfos[payload.resolveIndex];

          return handlerInfo.resolve(innerShouldContinue, payload)
                            .then(proceed, null, promiseLabel('Proceed'));
        }
      }
    };

    __exports__["default"] = TransitionState;
  });
define("router/transition",
  ["rsvp/promise","./handler-info","./utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];
    var ResolvedHandlerInfo = __dependency2__.ResolvedHandlerInfo;
    var trigger = __dependency3__.trigger;
    var slice = __dependency3__.slice;
    var log = __dependency3__.log;
    var promiseLabel = __dependency3__.promiseLabel;

    /**
      @private

      A Transition is a thennable (a promise-like object) that represents
      an attempt to transition to another route. It can be aborted, either
      explicitly via `abort` or by attempting another transition while a
      previous one is still underway. An aborted transition can also
      be `retry()`d later.
     */
    function Transition(router, intent, state, error) {
      var transition = this;
      this.state = state || router.state;
      this.intent = intent;
      this.router = router;
      this.data = this.intent && this.intent.data || {};
      this.resolvedModels = {};
      this.queryParams = {};

      if (error) {
        this.promise = Promise.reject(error);
        return;
      }

      if (state) {
        this.params = state.params;
        this.queryParams = state.queryParams;
        this.handlerInfos = state.handlerInfos;

        var len = state.handlerInfos.length;
        if (len) {
          this.targetName = state.handlerInfos[state.handlerInfos.length-1].name;
        }

        for (var i = 0; i < len; ++i) {
          var handlerInfo = state.handlerInfos[i];

          // TODO: this all seems hacky
          if (!handlerInfo.isResolved) { break; }
          this.pivotHandler = handlerInfo.handler;
        }

        this.sequence = Transition.currentSequence++;
        this.promise = state.resolve(checkForAbort, this)['catch'](function(result) {
          if (result.wasAborted || transition.isAborted) {
            return Promise.reject(logAbort(transition));
          } else {
            transition.trigger('error', result.error, transition, result.handlerWithError);
            transition.abort();
            return Promise.reject(result.error);
          }
        }, promiseLabel('Handle Abort'));
      } else {
        this.promise = Promise.resolve(this.state);
        this.params = {};
      }

      function checkForAbort() {
        if (transition.isAborted) {
          return Promise.reject(undefined, promiseLabel("Transition aborted - reject"));
        }
      }
    }

    Transition.currentSequence = 0;

    Transition.prototype = {
      targetName: null,
      urlMethod: 'update',
      intent: null,
      params: null,
      pivotHandler: null,
      resolveIndex: 0,
      handlerInfos: null,
      resolvedModels: null,
      isActive: true,
      state: null,
      queryParamsOnly: false,

      isTransition: true,

      isExiting: function(handler) {
        var handlerInfos = this.handlerInfos;
        for (var i = 0, len = handlerInfos.length; i < len; ++i) {
          var handlerInfo = handlerInfos[i];
          if (handlerInfo.name === handler || handlerInfo.handler === handler) {
            return false;
          }
        }
        return true;
      },

      /**
        @public

        The Transition's internal promise. Calling `.then` on this property
        is that same as calling `.then` on the Transition object itself, but
        this property is exposed for when you want to pass around a
        Transition's promise, but not the Transition object itself, since
        Transition object can be externally `abort`ed, while the promise
        cannot.
       */
      promise: null,

      /**
        @public

        Custom state can be stored on a Transition's `data` object.
        This can be useful for decorating a Transition within an earlier
        hook and shared with a later hook. Properties set on `data` will
        be copied to new transitions generated by calling `retry` on this
        transition.
       */
      data: null,

      /**
        @public

        A standard promise hook that resolves if the transition
        succeeds and rejects if it fails/redirects/aborts.

        Forwards to the internal `promise` property which you can
        use in situations where you want to pass around a thennable,
        but not the Transition itself.

        @param {Function} success
        @param {Function} failure
       */
      then: function(success, failure) {
        return this.promise.then(success, failure);
      },

      /**
        @public

        Aborts the Transition. Note you can also implicitly abort a transition
        by initiating another transition while a previous one is underway.
       */
      abort: function() {
        if (this.isAborted) { return this; }
        log(this.router, this.sequence, this.targetName + ": transition was aborted");
        this.intent.preTransitionState = this.router.state;
        this.isAborted = true;
        this.isActive = false;
        this.router.activeTransition = null;
        return this;
      },

      /**
        @public

        Retries a previously-aborted transition (making sure to abort the
        transition if it's still active). Returns a new transition that
        represents the new attempt to transition.
       */
      retry: function() {
        // TODO: add tests for merged state retry()s
        this.abort();
        return this.router.transitionByIntent(this.intent, false);
      },

      /**
        @public

        Sets the URL-changing method to be employed at the end of a
        successful transition. By default, a new Transition will just
        use `updateURL`, but passing 'replace' to this method will
        cause the URL to update using 'replaceWith' instead. Omitting
        a parameter will disable the URL change, allowing for transitions
        that don't update the URL at completion (this is also used for
        handleURL, since the URL has already changed before the
        transition took place).

        @param {String} method the type of URL-changing method to use
          at the end of a transition. Accepted values are 'replace',
          falsy values, or any other non-falsy value (which is
          interpreted as an updateURL transition).

        @return {Transition} this transition
       */
      method: function(method) {
        this.urlMethod = method;
        return this;
      },

      /**
        @public

        Fires an event on the current list of resolved/resolving
        handlers within this transition. Useful for firing events
        on route hierarchies that haven't fully been entered yet.

        Note: This method is also aliased as `send`

        @param {Boolean} [ignoreFailure=false] a boolean specifying whether unhandled events throw an error
        @param {String} name the name of the event to fire
       */
      trigger: function (ignoreFailure) {
        var args = slice.call(arguments);
        if (typeof ignoreFailure === 'boolean') {
          args.shift();
        } else {
          // Throw errors on unhandled trigger events by default
          ignoreFailure = false;
        }
        trigger(this.router, this.state.handlerInfos.slice(0, this.resolveIndex + 1), ignoreFailure, args);
      },

      /**
        @public

        Transitions are aborted and their promises rejected
        when redirects occur; this method returns a promise
        that will follow any redirects that occur and fulfill
        with the value fulfilled by any redirecting transitions
        that occur.

        @return {Promise} a promise that fulfills with the same
          value that the final redirecting transition fulfills with
       */
      followRedirects: function() {
        var router = this.router;
        return this.promise['catch'](function(reason) {
          if (router.activeTransition) {
            return router.activeTransition.followRedirects();
          }
          return Promise.reject(reason);
        });
      },

      toString: function() {
        return "Transition (sequence " + this.sequence + ")";
      },

      /**
        @private
       */
      log: function(message) {
        log(this.router, this.sequence, message);
      }
    };

    // Alias 'trigger' as 'send'
    Transition.prototype.send = Transition.prototype.trigger;

    /**
      @private

      Logs and returns a TransitionAborted error.
     */
    function logAbort(transition) {
      log(transition.router, transition.sequence, "detected abort.");
      return new TransitionAborted();
    }

    function TransitionAborted(message) {
      this.message = (message || "TransitionAborted");
      this.name = "TransitionAborted";
    }

    __exports__.Transition = Transition;
    __exports__.logAbort = logAbort;
    __exports__.TransitionAborted = TransitionAborted;
  });
define("router/utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    var slice = Array.prototype.slice;

    var _isArray;
    if (!Array.isArray) {
      _isArray = function (x) {
        return Object.prototype.toString.call(x) === "[object Array]";
      };
    } else {
      _isArray = Array.isArray;
    }

    var isArray = _isArray;
    __exports__.isArray = isArray;
    function merge(hash, other) {
      for (var prop in other) {
        if (other.hasOwnProperty(prop)) { hash[prop] = other[prop]; }
      }
    }

    var oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };
    __exports__.oCreate = oCreate;
    /**
      @private

      Extracts query params from the end of an array
    **/
    function extractQueryParams(array) {
      var len = (array && array.length), head, queryParams;

      if(len && len > 0 && array[len - 1] && array[len - 1].hasOwnProperty('queryParams')) {
        queryParams = array[len - 1].queryParams;
        head = slice.call(array, 0, len - 1);
        return [head, queryParams];
      } else {
        return [array, null];
      }
    }

    __exports__.extractQueryParams = extractQueryParams;/**
      @private

      Coerces query param properties and array elements into strings.
    **/
    function coerceQueryParamsToString(queryParams) {
      for (var key in queryParams) {
        if (typeof queryParams[key] === 'number') {
          queryParams[key] = '' + queryParams[key];
        } else if (isArray(queryParams[key])) {
          for (var i = 0, l = queryParams[key].length; i < l; i++) {
            queryParams[key][i] = '' + queryParams[key][i];
          }
        }
      }
    }
    /**
      @private
     */
    function log(router, sequence, msg) {
      if (!router.log) { return; }

      if (arguments.length === 3) {
        router.log("Transition #" + sequence + ": " + msg);
      } else {
        msg = sequence;
        router.log(msg);
      }
    }

    __exports__.log = log;function bind(context, fn) {
      var boundArgs = arguments;
      return function(value) {
        var args = slice.call(boundArgs, 2);
        args.push(value);
        return fn.apply(context, args);
      };
    }

    __exports__.bind = bind;function isParam(object) {
      return (typeof object === "string" || object instanceof String || typeof object === "number" || object instanceof Number);
    }


    function forEach(array, callback) {
      for (var i=0, l=array.length; i<l && false !== callback(array[i]); i++) { }
    }

    __exports__.forEach = forEach;function trigger(router, handlerInfos, ignoreFailure, args) {
      if (router.triggerEvent) {
        router.triggerEvent(handlerInfos, ignoreFailure, args);
        return;
      }

      var name = args.shift();

      if (!handlerInfos) {
        if (ignoreFailure) { return; }
        throw new Error("Could not trigger event '" + name + "'. There are no active handlers");
      }

      var eventWasHandled = false;

      for (var i=handlerInfos.length-1; i>=0; i--) {
        var handlerInfo = handlerInfos[i],
            handler = handlerInfo.handler;

        if (handler.events && handler.events[name]) {
          if (handler.events[name].apply(handler, args) === true) {
            eventWasHandled = true;
          } else {
            return;
          }
        }
      }

      if (!eventWasHandled && !ignoreFailure) {
        throw new Error("Nothing handled the event '" + name + "'.");
      }
    }

    __exports__.trigger = trigger;function getChangelist(oldObject, newObject) {
      var key;
      var results = {
        all: {},
        changed: {},
        removed: {}
      };

      merge(results.all, newObject);

      var didChange = false;
      coerceQueryParamsToString(oldObject);
      coerceQueryParamsToString(newObject);

      // Calculate removals
      for (key in oldObject) {
        if (oldObject.hasOwnProperty(key)) {
          if (!newObject.hasOwnProperty(key)) {
            didChange = true;
            results.removed[key] = oldObject[key];
          }
        }
      }

      // Calculate changes
      for (key in newObject) {
        if (newObject.hasOwnProperty(key)) {
          if (isArray(oldObject[key]) && isArray(newObject[key])) {
            if (oldObject[key].length !== newObject[key].length) {
              results.changed[key] = newObject[key];
              didChange = true;
            } else {
              for (var i = 0, l = oldObject[key].length; i < l; i++) {
                if (oldObject[key][i] !== newObject[key][i]) {
                  results.changed[key] = newObject[key];
                  didChange = true;
                }
              }
            }
          }
          else {
            if (oldObject[key] !== newObject[key]) {
              results.changed[key] = newObject[key];
              didChange = true;
            }
          }
        }
      }

      return didChange && results;
    }

    __exports__.getChangelist = getChangelist;function promiseLabel(label) {
      return 'Router: ' + label;
    }

    __exports__.promiseLabel = promiseLabel;function subclass(parentConstructor, proto) {
      function C(props) {
        parentConstructor.call(this, props || {});
      }
      C.prototype = oCreate(parentConstructor.prototype);
      merge(C.prototype, proto);
      return C;
    }

    __exports__.subclass = subclass;__exports__.merge = merge;
    __exports__.slice = slice;
    __exports__.isParam = isParam;
    __exports__.coerceQueryParamsToString = coerceQueryParamsToString;
  });
define("router",
  ["./router/router","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Router = __dependency1__["default"];

    __exports__["default"] = Router;
  });define("route-recognizer", [], function() { return {"default": RouteRecognizer}; });
define("rsvp", [], function() { return RSVP;});
define("rsvp/promise", [], function() { return {"default": RSVP.Promise}; });
window.Router = requireModule('router');
}(window, window.RSVP, window.RouteRecognizer));

window.jQuery = $;

/*!
 * jQuery UI Widget 1.10.4+amd
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/jQuery.widget/
 */

(function (factory) {
    if (typeof define === "function" && define.amd) {
        // Register as an anonymous AMD module:
        define(["jquery"], factory);
    } else {
        // Browser globals:
        factory(jQuery);
    }
}(function( $, undefined ) {

var uuid = 0,
  slice = Array.prototype.slice,
  _cleanData = $.cleanData;
$.cleanData = function( elems ) {
  for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
    try {
      $( elem ).triggerHandler( "remove" );
    // http://bugs.jquery.com/ticket/8235
    } catch( e ) {}
  }
  _cleanData( elems );
};

$.widget = function( name, base, prototype ) {
  var fullName, existingConstructor, constructor, basePrototype,
    // proxiedPrototype allows the provided prototype to remain unmodified
    // so that it can be used as a mixin for multiple widgets (#8876)
    proxiedPrototype = {},
    namespace = name.split( "." )[ 0 ];

  name = name.split( "." )[ 1 ];
  fullName = namespace + "-" + name;

  if ( !prototype ) {
    prototype = base;
    base = $.Widget;
  }

  // create selector for plugin
  $.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
    return !!$.data( elem, fullName );
  };

  $[ namespace ] = $[ namespace ] || {};
  existingConstructor = $[ namespace ][ name ];
  constructor = $[ namespace ][ name ] = function( options, element ) {
    // allow instantiation without "new" keyword
    if ( !this._createWidget ) {
      return new constructor( options, element );
    }

    // allow instantiation without initializing for simple inheritance
    // must use "new" keyword (the code above always passes args)
    if ( arguments.length ) {
      this._createWidget( options, element );
    }
  };
  // extend with the existing constructor to carry over any static properties
  $.extend( constructor, existingConstructor, {
    version: prototype.version,
    // copy the object used to create the prototype in case we need to
    // redefine the widget later
    _proto: $.extend( {}, prototype ),
    // track widgets that inherit from this widget in case this widget is
    // redefined after a widget inherits from it
    _childConstructors: []
  });

  basePrototype = new base();
  // we need to make the options hash a property directly on the new instance
  // otherwise we'll modify the options hash on the prototype that we're
  // inheriting from
  basePrototype.options = $.widget.extend( {}, basePrototype.options );
  $.each( prototype, function( prop, value ) {
    if ( !$.isFunction( value ) ) {
      proxiedPrototype[ prop ] = value;
      return;
    }
    proxiedPrototype[ prop ] = (function() {
      var _super = function() {
          return base.prototype[ prop ].apply( this, arguments );
        },
        _superApply = function( args ) {
          return base.prototype[ prop ].apply( this, args );
        };
      return function() {
        var __super = this._super,
          __superApply = this._superApply,
          returnValue;

        this._super = _super;
        this._superApply = _superApply;

        returnValue = value.apply( this, arguments );

        this._super = __super;
        this._superApply = __superApply;

        return returnValue;
      };
    })();
  });
  constructor.prototype = $.widget.extend( basePrototype, {
    // TODO: remove support for widgetEventPrefix
    // always use the name + a colon as the prefix, e.g., draggable:start
    // don't prefix for widgets that aren't DOM-based
    widgetEventPrefix: existingConstructor ? (basePrototype.widgetEventPrefix || name) : name
  }, proxiedPrototype, {
    constructor: constructor,
    namespace: namespace,
    widgetName: name,
    widgetFullName: fullName
  });

  // If this widget is being redefined then we need to find all widgets that
  // are inheriting from it and redefine all of them so that they inherit from
  // the new version of this widget. We're essentially trying to replace one
  // level in the prototype chain.
  if ( existingConstructor ) {
    $.each( existingConstructor._childConstructors, function( i, child ) {
      var childPrototype = child.prototype;

      // redefine the child widget using the same prototype that was
      // originally used, but inherit from the new version of the base
      $.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
    });
    // remove the list of existing child constructors from the old constructor
    // so the old child constructors can be garbage collected
    delete existingConstructor._childConstructors;
  } else {
    base._childConstructors.push( constructor );
  }

  $.widget.bridge( name, constructor );
};

$.widget.extend = function( target ) {
  var input = slice.call( arguments, 1 ),
    inputIndex = 0,
    inputLength = input.length,
    key,
    value;
  for ( ; inputIndex < inputLength; inputIndex++ ) {
    for ( key in input[ inputIndex ] ) {
      value = input[ inputIndex ][ key ];
      if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
        // Clone objects
        if ( $.isPlainObject( value ) ) {
          target[ key ] = $.isPlainObject( target[ key ] ) ?
            $.widget.extend( {}, target[ key ], value ) :
            // Don't extend strings, arrays, etc. with objects
            $.widget.extend( {}, value );
        // Copy everything else by reference
        } else {
          target[ key ] = value;
        }
      }
    }
  }
  return target;
};

$.widget.bridge = function( name, object ) {
  var fullName = object.prototype.widgetFullName || name;
  $.fn[ name ] = function( options ) {
    var isMethodCall = typeof options === "string",
      args = slice.call( arguments, 1 ),
      returnValue = this;

    // allow multiple hashes to be passed on init
    options = !isMethodCall && args.length ?
      $.widget.extend.apply( null, [ options ].concat(args) ) :
      options;

    if ( isMethodCall ) {
      this.each(function() {
        var methodValue,
          instance = $.data( this, fullName );
        if ( !instance ) {
          return $.error( "cannot call methods on " + name + " prior to initialization; " +
            "attempted to call method '" + options + "'" );
        }
        if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
          return $.error( "no such method '" + options + "' for " + name + " widget instance" );
        }
        methodValue = instance[ options ].apply( instance, args );
        if ( methodValue !== instance && methodValue !== undefined ) {
          returnValue = methodValue && methodValue.jquery ?
            returnValue.pushStack( methodValue.get() ) :
            methodValue;
          return false;
        }
      });
    } else {
      this.each(function() {
        var instance = $.data( this, fullName );
        if ( instance ) {
          instance.option( options || {} )._init();
        } else {
          $.data( this, fullName, new object( options, this ) );
        }
      });
    }

    return returnValue;
  };
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
  widgetName: "widget",
  widgetEventPrefix: "",
  defaultElement: "<div>",
  options: {
    disabled: false,

    // callbacks
    create: null
  },
  _createWidget: function( options, element ) {
    element = $( element || this.defaultElement || this )[ 0 ];
    this.element = $( element );
    this.uuid = uuid++;
    this.eventNamespace = "." + this.widgetName + this.uuid;
    this.options = $.widget.extend( {},
      this.options,
      this._getCreateOptions(),
      options );

    this.bindings = $();
    this.hoverable = $();
    this.focusable = $();

    if ( element !== this ) {
      $.data( element, this.widgetFullName, this );
      this._on( true, this.element, {
        remove: function( event ) {
          if ( event.target === element ) {
            this.destroy();
          }
        }
      });
      this.document = $( element.style ?
        // element within the document
        element.ownerDocument :
        // element is window or document
        element.document || element );
      this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
    }

    this._create();
    this._trigger( "create", null, this._getCreateEventData() );
    this._init();
  },
  _getCreateOptions: $.noop,
  _getCreateEventData: $.noop,
  _create: $.noop,
  _init: $.noop,

  destroy: function() {
    this._destroy();
    // we can probably remove the unbind calls in 2.0
    // all event bindings should go through this._on()
    this.element
      .unbind( this.eventNamespace )
      // 1.9 BC for #7810
      // TODO remove dual storage
      .removeData( this.widgetName )
      .removeData( this.widgetFullName )
      // support: jquery <1.6.3
      // http://bugs.jquery.com/ticket/9413
      .removeData( $.camelCase( this.widgetFullName ) );
    this.widget()
      .unbind( this.eventNamespace )
      .removeAttr( "aria-disabled" )
      .removeClass(
        this.widgetFullName + "-disabled " +
        "ui-state-disabled" );

    // clean up events and states
    this.bindings.unbind( this.eventNamespace );
    this.hoverable.removeClass( "ui-state-hover" );
    this.focusable.removeClass( "ui-state-focus" );
  },
  _destroy: $.noop,

  widget: function() {
    return this.element;
  },

  option: function( key, value ) {
    var options = key,
      parts,
      curOption,
      i;

    if ( arguments.length === 0 ) {
      // don't return a reference to the internal hash
      return $.widget.extend( {}, this.options );
    }

    if ( typeof key === "string" ) {
      // handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
      options = {};
      parts = key.split( "." );
      key = parts.shift();
      if ( parts.length ) {
        curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
        for ( i = 0; i < parts.length - 1; i++ ) {
          curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
          curOption = curOption[ parts[ i ] ];
        }
        key = parts.pop();
        if ( arguments.length === 1 ) {
          return curOption[ key ] === undefined ? null : curOption[ key ];
        }
        curOption[ key ] = value;
      } else {
        if ( arguments.length === 1 ) {
          return this.options[ key ] === undefined ? null : this.options[ key ];
        }
        options[ key ] = value;
      }
    }

    this._setOptions( options );

    return this;
  },
  _setOptions: function( options ) {
    var key;

    for ( key in options ) {
      this._setOption( key, options[ key ] );
    }

    return this;
  },
  _setOption: function( key, value ) {
    this.options[ key ] = value;

    if ( key === "disabled" ) {
      this.widget()
        .toggleClass( this.widgetFullName + "-disabled ui-state-disabled", !!value )
        .attr( "aria-disabled", value );
      this.hoverable.removeClass( "ui-state-hover" );
      this.focusable.removeClass( "ui-state-focus" );
    }

    return this;
  },

  enable: function() {
    return this._setOption( "disabled", false );
  },
  disable: function() {
    return this._setOption( "disabled", true );
  },

  _on: function( suppressDisabledCheck, element, handlers ) {
    var delegateElement,
      instance = this;

    // no suppressDisabledCheck flag, shuffle arguments
    if ( typeof suppressDisabledCheck !== "boolean" ) {
      handlers = element;
      element = suppressDisabledCheck;
      suppressDisabledCheck = false;
    }

    // no element argument, shuffle and use this.element
    if ( !handlers ) {
      handlers = element;
      element = this.element;
      delegateElement = this.widget();
    } else {
      // accept selectors, DOM elements
      element = delegateElement = $( element );
      this.bindings = this.bindings.add( element );
    }

    $.each( handlers, function( event, handler ) {
      function handlerProxy() {
        // allow widgets to customize the disabled handling
        // - disabled as an array instead of boolean
        // - disabled class as method for disabling individual parts
        if ( !suppressDisabledCheck &&
            ( instance.options.disabled === true ||
              $( this ).hasClass( "ui-state-disabled" ) ) ) {
          return;
        }
        return ( typeof handler === "string" ? instance[ handler ] : handler )
          .apply( instance, arguments );
      }

      // copy the guid so direct unbinding works
      if ( typeof handler !== "string" ) {
        handlerProxy.guid = handler.guid =
          handler.guid || handlerProxy.guid || $.guid++;
      }

      var match = event.match( /^(\w+)\s*(.*)$/ ),
        eventName = match[1] + instance.eventNamespace,
        selector = match[2];
      if ( selector ) {
        delegateElement.delegate( selector, eventName, handlerProxy );
      } else {
        element.bind( eventName, handlerProxy );
      }
    });
  },

  _off: function( element, eventName ) {
    eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) + this.eventNamespace;
    element.unbind( eventName ).undelegate( eventName );
  },

  _delay: function( handler, delay ) {
    function handlerProxy() {
      return ( typeof handler === "string" ? instance[ handler ] : handler )
        .apply( instance, arguments );
    }
    var instance = this;
    return setTimeout( handlerProxy, delay || 0 );
  },

  _hoverable: function( element ) {
    this.hoverable = this.hoverable.add( element );
    this._on( element, {
      mouseenter: function( event ) {
        $( event.currentTarget ).addClass( "ui-state-hover" );
      },
      mouseleave: function( event ) {
        $( event.currentTarget ).removeClass( "ui-state-hover" );
      }
    });
  },

  _focusable: function( element ) {
    this.focusable = this.focusable.add( element );
    this._on( element, {
      focusin: function( event ) {
        $( event.currentTarget ).addClass( "ui-state-focus" );
      },
      focusout: function( event ) {
        $( event.currentTarget ).removeClass( "ui-state-focus" );
      }
    });
  },

  _trigger: function( type, event, data ) {
    var prop, orig,
      callback = this.options[ type ];

    data = data || {};
    event = $.Event( event );
    event.type = ( type === this.widgetEventPrefix ?
      type :
      this.widgetEventPrefix + type ).toLowerCase();
    // the original event may come from any element
    // so we need to reset the target on the new event
    event.target = this.element[ 0 ];

    // copy original event properties over to the new event
    orig = event.originalEvent;
    if ( orig ) {
      for ( prop in orig ) {
        if ( !( prop in event ) ) {
          event[ prop ] = orig[ prop ];
        }
      }
    }

    this.element.trigger( event, data );
    return !( $.isFunction( callback ) &&
      callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
      event.isDefaultPrevented() );
  }
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
  $.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
    if ( typeof options === "string" ) {
      options = { effect: options };
    }
    var hasOptions,
      effectName = !options ?
        method :
        options === true || typeof options === "number" ?
          defaultEffect :
          options.effect || defaultEffect;
    options = options || {};
    if ( typeof options === "number" ) {
      options = { duration: options };
    }
    hasOptions = !$.isEmptyObject( options );
    options.complete = callback;
    if ( options.delay ) {
      element.delay( options.delay );
    }
    if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
      element[ method ]( options );
    } else if ( effectName !== method && element[ effectName ] ) {
      element[ effectName ]( options.duration, options.easing, callback );
    } else {
      element.queue(function( next ) {
        $( this )[ method ]();
        if ( callback ) {
          callback.call( element[ 0 ] );
        }
        next();
      });
    }
  };
});

}));
/*
 * jQuery Iframe Transport Plugin 1.8.2
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/* global define, window, document */

(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define(['jquery'], factory);
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    // Helper variable to create unique names for the transport iframes:
    var counter = 0;

    // The iframe transport accepts four additional options:
    // options.fileInput: a jQuery collection of file input fields
    // options.paramName: the parameter name for the file form data,
    //  overrides the name property of the file input field(s),
    //  can be a string or an array of strings.
    // options.formData: an array of objects with name and value properties,
    //  equivalent to the return data of .serializeArray(), e.g.:
    //  [{name: 'a', value: 1}, {name: 'b', value: 2}]
    // options.initialIframeSrc: the URL of the initial iframe src,
    //  by default set to "javascript:false;"
    $.ajaxTransport('iframe', function (options) {
        if (options.async) {
            // javascript:false as initial iframe src
            // prevents warning popups on HTTPS in IE6:
            /*jshint scripturl: true */
            var initialIframeSrc = options.initialIframeSrc || 'javascript:false;',
            /*jshint scripturl: false */
                form,
                iframe,
                addParamChar;
            return {
                send: function (_, completeCallback) {
                    form = $('<form style="display:none;"></form>');
                    form.attr('accept-charset', options.formAcceptCharset);
                    addParamChar = /\?/.test(options.url) ? '&' : '?';
                    // XDomainRequest only supports GET and POST:
                    if (options.type === 'DELETE') {
                        options.url = options.url + addParamChar + '_method=DELETE';
                        options.type = 'POST';
                    } else if (options.type === 'PUT') {
                        options.url = options.url + addParamChar + '_method=PUT';
                        options.type = 'POST';
                    } else if (options.type === 'PATCH') {
                        options.url = options.url + addParamChar + '_method=PATCH';
                        options.type = 'POST';
                    }
                    // IE versions below IE8 cannot set the name property of
                    // elements that have already been added to the DOM,
                    // so we set the name along with the iframe HTML markup:
                    counter += 1;
                    iframe = $(
                        '<iframe src="' + initialIframeSrc +
                            '" name="iframe-transport-' + counter + '"></iframe>'
                    ).bind('load', function () {
                        var fileInputClones,
                            paramNames = $.isArray(options.paramName) ?
                                    options.paramName : [options.paramName];
                        iframe
                            .unbind('load')
                            .bind('load', function () {
                                var response;
                                // Wrap in a try/catch block to catch exceptions thrown
                                // when trying to access cross-domain iframe contents:
                                try {
                                    response = iframe.contents();
                                    // Google Chrome and Firefox do not throw an
                                    // exception when calling iframe.contents() on
                                    // cross-domain requests, so we unify the response:
                                    if (!response.length || !response[0].firstChild) {
                                        throw new Error();
                                    }
                                } catch (e) {
                                    response = undefined;
                                }
                                // The complete callback returns the
                                // iframe content document as response object:
                                completeCallback(
                                    200,
                                    'success',
                                    {'iframe': response}
                                );
                                // Fix for IE endless progress bar activity bug
                                // (happens on form submits to iframe targets):
                                $('<iframe src="' + initialIframeSrc + '"></iframe>')
                                    .appendTo(form);
                                window.setTimeout(function () {
                                    // Removing the form in a setTimeout call
                                    // allows Chrome's developer tools to display
                                    // the response result
                                    form.remove();
                                }, 0);
                            });
                        form
                            .prop('target', iframe.prop('name'))
                            .prop('action', options.url)
                            .prop('method', options.type);
                        if (options.formData) {
                            $.each(options.formData, function (index, field) {
                                $('<input type="hidden"/>')
                                    .prop('name', field.name)
                                    // .val(field.value)
                                    .appendTo(form);
                            });
                        }
                        if (options.fileInput && options.fileInput.length &&
                                options.type === 'POST') {
                            fileInputClones = options.fileInput.clone();
                            // Insert a clone for each file input field:
                            options.fileInput.after(function (index) {
                                return fileInputClones[index];
                            });
                            if (options.paramName) {
                                options.fileInput.each(function (index) {
                                    $(this).prop(
                                        'name',
                                        paramNames[index] || options.paramName
                                    );
                                });
                            }
                            // Appending the file input fields to the hidden form
                            // removes them from their original location:
                            form
                                .append(options.fileInput)
                                .prop('enctype', 'multipart/form-data')
                                // enctype must be set as encoding for IE:
                                .prop('encoding', 'multipart/form-data');
                            // Remove the HTML5 form attribute from the input(s):
                            options.fileInput.removeAttr('form');
                        }
                        form.submit();
                        // Insert the file input fields at their original location
                        // by replacing the clones with the originals:
                        if (fileInputClones && fileInputClones.length) {
                            options.fileInput.each(function (index, input) {
                                var clone = $(fileInputClones[index]);
                                // Restore the original name and form properties:
                                $(input)
                                    .prop('name', clone.prop('name'))
                                    .attr('form', clone.attr('form'));
                                clone.replaceWith(input);
                            });
                        }
                    });
                    form.append(iframe).appendTo(document.body);
                },
                abort: function () {
                    if (iframe) {
                        // javascript:false as iframe src aborts the request
                        // and prevents warning popups on HTTPS in IE6.
                        // concat is used to avoid the "Script URL" JSLint error:
                        iframe
                            .unbind('load')
                            .prop('src', initialIframeSrc);
                    }
                    if (form) {
                        form.remove();
                    }
                }
            };
        }
    });

    // The iframe transport returns the iframe content document as response.
    // The following adds converters from iframe to text, json, html, xml
    // and script.
    // Please note that the Content-Type for JSON responses has to be text/plain
    // or text/html, if the browser doesn't include application/json in the
    // Accept header, else IE will show a download dialog.
    // The Content-Type for XML responses on the other hand has to be always
    // application/xml or text/xml, so IE properly parses the XML response.
    // See also
    // https://github.com/blueimp/jQuery-File-Upload/wiki/Setup#content-type-negotiation
    $.ajaxSetup({
        converters: {
            'iframe text': function (iframe) {
                return iframe && $(iframe[0].body).text();
            },
            'iframe json': function (iframe) {
                return iframe && $.parseJSON($(iframe[0].body).text());
            },
            'iframe html': function (iframe) {
                return iframe && $(iframe[0].body).html();
            },
            'iframe xml': function (iframe) {
                var xmlDoc = iframe && iframe[0];
                return xmlDoc && $.isXMLDoc(xmlDoc) ? xmlDoc :
                        $.parseXML((xmlDoc.XMLDocument && xmlDoc.XMLDocument.xml) ||
                            $(xmlDoc.body).html());
            },
            'iframe script': function (iframe) {
                return iframe && $.globalEval($(iframe[0].body).text());
            }
        }
    });

}));
/*
 * jQuery File Upload Plugin 5.40.1
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/* jshint nomen:false */
/* global define, window, document, location, Blob, FormData */

(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define([
            'jquery',
            'jquery.ui.widget'
        ], factory);
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    // Detect file input support, based on
    // http://viljamis.com/blog/2012/file-upload-support-on-mobile/
    $.support.fileInput = !(new RegExp(
        // Handle devices which give false positives for the feature detection:
        '(Android (1\\.[0156]|2\\.[01]))' +
            '|(Windows Phone (OS 7|8\\.0))|(XBLWP)|(ZuneWP)|(WPDesktop)' +
            '|(w(eb)?OSBrowser)|(webOS)' +
            '|(Kindle/(1\\.0|2\\.[05]|3\\.0))'
    ).test(window.navigator.userAgent) ||
        // Feature detection for all other devices:
        $('<input type="file">').prop('disabled'));

    // The FileReader API is not actually used, but works as feature detection,
    // as some Safari versions (5?) support XHR file uploads via the FormData API,
    // but not non-multipart XHR file uploads.
    // window.XMLHttpRequestUpload is not available on IE10, so we check for
    // window.ProgressEvent instead to detect XHR2 file upload capability:
    $.support.xhrFileUpload = !!(window.ProgressEvent && window.FileReader);
    $.support.xhrFormDataFileUpload = !!window.FormData;

    // Detect support for Blob slicing (required for chunked uploads):
    $.support.blobSlice = window.Blob && (Blob.prototype.slice ||
        Blob.prototype.webkitSlice || Blob.prototype.mozSlice);

    // The fileupload widget listens for change events on file input fields defined
    // via fileInput setting and paste or drop events of the given dropZone.
    // In addition to the default jQuery Widget methods, the fileupload widget
    // exposes the "add" and "send" methods, to add or directly send files using
    // the fileupload API.
    // By default, files added via file input selection, paste, drag & drop or
    // "add" method are uploaded immediately, but it is possible to override
    // the "add" callback option to queue file uploads.
    $.widget('blueimp.fileupload', {

        options: {
            // The drop target element(s), by the default the complete document.
            // Set to null to disable drag & drop support:
            dropZone: $(document),
            // The paste target element(s), by the default the complete document.
            // Set to null to disable paste support:
            pasteZone: $(document),
            // The file input field(s), that are listened to for change events.
            // If undefined, it is set to the file input fields inside
            // of the widget element on plugin initialization.
            // Set to null to disable the change listener.
            fileInput: undefined,
            // By default, the file input field is replaced with a clone after
            // each input field change event. This is required for iframe transport
            // queues and allows change events to be fired for the same file
            // selection, but can be disabled by setting the following option to false:
            replaceFileInput: true,
            // The parameter name for the file form data (the request argument name).
            // If undefined or empty, the name property of the file input field is
            // used, or "files[]" if the file input name property is also empty,
            // can be a string or an array of strings:
            paramName: undefined,
            // By default, each file of a selection is uploaded using an individual
            // request for XHR type uploads. Set to false to upload file
            // selections in one request each:
            singleFileUploads: true,
            // To limit the number of files uploaded with one XHR request,
            // set the following option to an integer greater than 0:
            limitMultiFileUploads: undefined,
            // The following option limits the number of files uploaded with one
            // XHR request to keep the request size under or equal to the defined
            // limit in bytes:
            limitMultiFileUploadSize: undefined,
            // Multipart file uploads add a number of bytes to each uploaded file,
            // therefore the following option adds an overhead for each file used
            // in the limitMultiFileUploadSize configuration:
            limitMultiFileUploadSizeOverhead: 512,
            // Set the following option to true to issue all file upload requests
            // in a sequential order:
            sequentialUploads: false,
            // To limit the number of concurrent uploads,
            // set the following option to an integer greater than 0:
            limitConcurrentUploads: undefined,
            // Set the following option to true to force iframe transport uploads:
            forceIframeTransport: false,
            // Set the following option to the location of a redirect url on the
            // origin server, for cross-domain iframe transport uploads:
            redirect: undefined,
            // The parameter name for the redirect url, sent as part of the form
            // data and set to 'redirect' if this option is empty:
            redirectParamName: undefined,
            // Set the following option to the location of a postMessage window,
            // to enable postMessage transport uploads:
            postMessage: undefined,
            // By default, XHR file uploads are sent as multipart/form-data.
            // The iframe transport is always using multipart/form-data.
            // Set to false to enable non-multipart XHR uploads:
            multipart: true,
            // To upload large files in smaller chunks, set the following option
            // to a preferred maximum chunk size. If set to 0, null or undefined,
            // or the browser does not support the required Blob API, files will
            // be uploaded as a whole.
            maxChunkSize: undefined,
            // When a non-multipart upload or a chunked multipart upload has been
            // aborted, this option can be used to resume the upload by setting
            // it to the size of the already uploaded bytes. This option is most
            // useful when modifying the options object inside of the "add" or
            // "send" callbacks, as the options are cloned for each file upload.
            uploadedBytes: undefined,
            // By default, failed (abort or error) file uploads are removed from the
            // global progress calculation. Set the following option to false to
            // prevent recalculating the global progress data:
            recalculateProgress: true,
            // Interval in milliseconds to calculate and trigger progress events:
            progressInterval: 100,
            // Interval in milliseconds to calculate progress bitrate:
            bitrateInterval: 500,
            // By default, uploads are started automatically when adding files:
            autoUpload: true,

            // Error and info messages:
            messages: {
                uploadedBytes: 'Uploaded bytes exceed file size'
            },

            // Translation function, gets the message key to be translated
            // and an object with context specific data as arguments:
            i18n: function (message, context) {
                message = this.messages[message] || message.toString();
                if (context) {
                    $.each(context, function (key, value) {
                        message = message.replace('{' + key + '}', value);
                    });
                }
                return message;
            },

            // Additional form data to be sent along with the file uploads can be set
            // using this option, which accepts an array of objects with name and
            // value properties, a function returning such an array, a FormData
            // object (for XHR file uploads), or a simple object.
            // The form of the first fileInput is given as parameter to the function:
            formData: function (form) {
                return form.serializeArray();
            },

            // The add callback is invoked as soon as files are added to the fileupload
            // widget (via file input selection, drag & drop, paste or add API call).
            // If the singleFileUploads option is enabled, this callback will be
            // called once for each file in the selection for XHR file uploads, else
            // once for each file selection.
            //
            // The upload starts when the submit method is invoked on the data parameter.
            // The data object contains a files property holding the added files
            // and allows you to override plugin options as well as define ajax settings.
            //
            // Listeners for this callback can also be bound the following way:
            // .bind('fileuploadadd', func);
            //
            // data.submit() returns a Promise object and allows to attach additional
            // handlers using jQuery's Deferred callbacks:
            // data.submit().done(func).fail(func).always(func);
            add: function (e, data) {
                if (e.isDefaultPrevented()) {
                    return false;
                }
                if (data.autoUpload || (data.autoUpload !== false &&
                        $(this).fileupload('option', 'autoUpload'))) {
                    data.process().done(function () {
                        data.submit();
                    });
                }
            },

            // Other callbacks:

            // Callback for the submit event of each file upload:
            // submit: function (e, data) {}, // .bind('fileuploadsubmit', func);

            // Callback for the start of each file upload request:
            // send: function (e, data) {}, // .bind('fileuploadsend', func);

            // Callback for successful uploads:
            // done: function (e, data) {}, // .bind('fileuploaddone', func);

            // Callback for failed (abort or error) uploads:
            // fail: function (e, data) {}, // .bind('fileuploadfail', func);

            // Callback for completed (success, abort or error) requests:
            // always: function (e, data) {}, // .bind('fileuploadalways', func);

            // Callback for upload progress events:
            // progress: function (e, data) {}, // .bind('fileuploadprogress', func);

            // Callback for global upload progress events:
            // progressall: function (e, data) {}, // .bind('fileuploadprogressall', func);

            // Callback for uploads start, equivalent to the global ajaxStart event:
            // start: function (e) {}, // .bind('fileuploadstart', func);

            // Callback for uploads stop, equivalent to the global ajaxStop event:
            // stop: function (e) {}, // .bind('fileuploadstop', func);

            // Callback for change events of the fileInput(s):
            // change: function (e, data) {}, // .bind('fileuploadchange', func);

            // Callback for paste events to the pasteZone(s):
            // paste: function (e, data) {}, // .bind('fileuploadpaste', func);

            // Callback for drop events of the dropZone(s):
            // drop: function (e, data) {}, // .bind('fileuploaddrop', func);

            // Callback for dragover events of the dropZone(s):
            // dragover: function (e) {}, // .bind('fileuploaddragover', func);

            // Callback for the start of each chunk upload request:
            // chunksend: function (e, data) {}, // .bind('fileuploadchunksend', func);

            // Callback for successful chunk uploads:
            // chunkdone: function (e, data) {}, // .bind('fileuploadchunkdone', func);

            // Callback for failed (abort or error) chunk uploads:
            // chunkfail: function (e, data) {}, // .bind('fileuploadchunkfail', func);

            // Callback for completed (success, abort or error) chunk upload requests:
            // chunkalways: function (e, data) {}, // .bind('fileuploadchunkalways', func);

            // The plugin options are used as settings object for the ajax calls.
            // The following are jQuery ajax settings required for the file uploads:
            processData: false,
            contentType: false,
            cache: false
        },

        // A list of options that require reinitializing event listeners and/or
        // special initialization code:
        _specialOptions: [
            'fileInput',
            'dropZone',
            'pasteZone',
            'multipart',
            'forceIframeTransport'
        ],

        _blobSlice: $.support.blobSlice && function () {
            var slice = this.slice || this.webkitSlice || this.mozSlice;
            return slice.apply(this, arguments);
        },

        _BitrateTimer: function () {
            this.timestamp = ((Date.now) ? Date.now() : (new Date()).getTime());
            this.loaded = 0;
            this.bitrate = 0;
            this.getBitrate = function (now, loaded, interval) {
                var timeDiff = now - this.timestamp;
                if (!this.bitrate || !interval || timeDiff > interval) {
                    this.bitrate = (loaded - this.loaded) * (1000 / timeDiff) * 8;
                    this.loaded = loaded;
                    this.timestamp = now;
                }
                return this.bitrate;
            };
        },

        _isXHRUpload: function (options) {
            return !options.forceIframeTransport &&
                ((!options.multipart && $.support.xhrFileUpload) ||
                $.support.xhrFormDataFileUpload);
        },

        _getFormData: function (options) {
            var formData;
            if ($.type(options.formData) === 'function') {
                return options.formData(options.form);
            }
            if ($.isArray(options.formData)) {
                return options.formData;
            }
            if ($.type(options.formData) === 'object') {
                formData = [];
                $.each(options.formData, function (name, value) {
                    formData.push({name: name, value: value});
                });
                return formData;
            }
            return [];
        },

        _getTotal: function (files) {
            var total = 0;
            $.each(files, function (index, file) {
                total += file.size || 1;
            });
            return total;
        },

        _initProgressObject: function (obj) {
            var progress = {
                loaded: 0,
                total: 0,
                bitrate: 0
            };
            if (obj._progress) {
                $.extend(obj._progress, progress);
            } else {
                obj._progress = progress;
            }
        },

        _initResponseObject: function (obj) {
            var prop;
            if (obj._response) {
                for (prop in obj._response) {
                    if (obj._response.hasOwnProperty(prop)) {
                        delete obj._response[prop];
                    }
                }
            } else {
                obj._response = {};
            }
        },

        _onProgress: function (e, data) {
            if (e.lengthComputable) {
                var now = ((Date.now) ? Date.now() : (new Date()).getTime()),
                    loaded;
                if (data._time && data.progressInterval &&
                        (now - data._time < data.progressInterval) &&
                        e.loaded !== e.total) {
                    return;
                }
                data._time = now;
                loaded = Math.floor(
                    e.loaded / e.total * (data.chunkSize || data._progress.total)
                ) + (data.uploadedBytes || 0);
                // Add the difference from the previously loaded state
                // to the global loaded counter:
                this._progress.loaded += (loaded - data._progress.loaded);
                this._progress.bitrate = this._bitrateTimer.getBitrate(
                    now,
                    this._progress.loaded,
                    data.bitrateInterval
                );
                data._progress.loaded = data.loaded = loaded;
                data._progress.bitrate = data.bitrate = data._bitrateTimer.getBitrate(
                    now,
                    loaded,
                    data.bitrateInterval
                );
                // Trigger a custom progress event with a total data property set
                // to the file size(s) of the current upload and a loaded data
                // property calculated accordingly:
                this._trigger(
                    'progress',
                    $.Event('progress', {delegatedEvent: e}),
                    data
                );
                // Trigger a global progress event for all current file uploads,
                // including ajax calls queued for sequential file uploads:
                this._trigger(
                    'progressall',
                    $.Event('progressall', {delegatedEvent: e}),
                    this._progress
                );
            }
        },

        _initProgressListener: function (options) {
            var that = this,
                xhr = options.xhr ? options.xhr() : $.ajaxSettings.xhr();
            // Accesss to the native XHR object is required to add event listeners
            // for the upload progress event:
            if (xhr.upload) {
                $(xhr.upload).bind('progress', function (e) {
                    var oe = e.originalEvent;
                    // Make sure the progress event properties get copied over:
                    e.lengthComputable = oe.lengthComputable;
                    e.loaded = oe.loaded;
                    e.total = oe.total;
                    that._onProgress(e, options);
                });
                options.xhr = function () {
                    return xhr;
                };
            }
        },

        _isInstanceOf: function (type, obj) {
            // Cross-frame instanceof check
            return Object.prototype.toString.call(obj) === '[object ' + type + ']';
        },

        _initXHRData: function (options) {
            var that = this,
                formData,
                file = options.files[0],
                // Ignore non-multipart setting if not supported:
                multipart = options.multipart || !$.support.xhrFileUpload,
                paramName = $.type(options.paramName) === 'array' ?
                    options.paramName[0] : options.paramName;
            options.headers = $.extend({}, options.headers);
            if (options.contentRange) {
                options.headers['Content-Range'] = options.contentRange;
            }
            if (!multipart || options.blob || !this._isInstanceOf('File', file)) {
                options.headers['Content-Disposition'] = 'attachment; filename="' +
                    encodeURI(file.name) + '"';
            }
            if (!multipart) {
                options.contentType = file.type || 'application/octet-stream';
                options.data = options.blob || file;
            } else if ($.support.xhrFormDataFileUpload) {
                if (options.postMessage) {
                    // window.postMessage does not allow sending FormData
                    // objects, so we just add the File/Blob objects to
                    // the formData array and let the postMessage window
                    // create the FormData object out of this array:
                    formData = this._getFormData(options);
                    if (options.blob) {
                        formData.push({
                            name: paramName,
                            value: options.blob
                        });
                    } else {
                        $.each(options.files, function (index, file) {
                            formData.push({
                                name: ($.type(options.paramName) === 'array' &&
                                    options.paramName[index]) || paramName,
                                value: file
                            });
                        });
                    }
                } else {
                    if (that._isInstanceOf('FormData', options.formData)) {
                        formData = options.formData;
                    } else {
                        formData = new FormData();
                        $.each(this._getFormData(options), function (index, field) {
                            formData.append(field.name, field.value);
                        });
                    }
                    if (options.blob) {
                        formData.append(paramName, options.blob, file.name);
                    } else {
                        $.each(options.files, function (index, file) {
                            // This check allows the tests to run with
                            // dummy objects:
                            if (that._isInstanceOf('File', file) ||
                                    that._isInstanceOf('Blob', file)) {
                                formData.append(
                                    ($.type(options.paramName) === 'array' &&
                                        options.paramName[index]) || paramName,
                                    file,
                                    file.uploadName || file.name
                                );
                            }
                        });
                    }
                }
                options.data = formData;
            }
            // Blob reference is not needed anymore, free memory:
            options.blob = null;
        },

        _initIframeSettings: function (options) {
            var targetHost = $('<a></a>').prop('href', options.url).prop('host');
            // Setting the dataType to iframe enables the iframe transport:
            options.dataType = 'iframe ' + (options.dataType || '');
            // The iframe transport accepts a serialized array as form data:
            options.formData = this._getFormData(options);
            // Add redirect url to form data on cross-domain uploads:
            if (options.redirect && targetHost && targetHost !== location.host) {
                options.formData.push({
                    name: options.redirectParamName || 'redirect',
                    value: options.redirect
                });
            }
        },

        _initDataSettings: function (options) {
            if (this._isXHRUpload(options)) {
                if (!this._chunkedUpload(options, true)) {
                    if (!options.data) {
                        this._initXHRData(options);
                    }
                    this._initProgressListener(options);
                }
                if (options.postMessage) {
                    // Setting the dataType to postmessage enables the
                    // postMessage transport:
                    options.dataType = 'postmessage ' + (options.dataType || '');
                }
            } else {
                this._initIframeSettings(options);
            }
        },

        _getParamName: function (options) {
            var fileInput = $(options.fileInput),
                paramName = options.paramName;
            if (!paramName) {
                paramName = [];
                fileInput.each(function () {
                    var input = $(this),
                        name = input.prop('name') || 'files[]',
                        i = (input.prop('files') || [1]).length;
                    while (i) {
                        paramName.push(name);
                        i -= 1;
                    }
                });
                if (!paramName.length) {
                    paramName = [fileInput.prop('name') || 'files[]'];
                }
            } else if (!$.isArray(paramName)) {
                paramName = [paramName];
            }
            return paramName;
        },

        _initFormSettings: function (options) {
            // Retrieve missing options from the input field and the
            // associated form, if available:
            if (!options.form || !options.form.length) {
                options.form = $(options.fileInput.prop('form'));
                // If the given file input doesn't have an associated form,
                // use the default widget file input's form:
                if (!options.form.length) {
                    options.form = $(this.options.fileInput.prop('form'));
                }
            }
            options.paramName = this._getParamName(options);
            if (!options.url) {
                options.url = options.form.prop('action') || location.href;
            }
            // The HTTP request method must be "POST" or "PUT":
            options.type = (options.type ||
                ($.type(options.form.prop('method')) === 'string' &&
                    options.form.prop('method')) || ''
                ).toUpperCase();
            if (options.type !== 'POST' && options.type !== 'PUT' &&
                    options.type !== 'PATCH') {
                options.type = 'POST';
            }
            if (!options.formAcceptCharset) {
                options.formAcceptCharset = options.form.attr('accept-charset');
            }
        },

        _getAJAXSettings: function (data) {
            var options = $.extend({}, this.options, data);
            this._initFormSettings(options);
            this._initDataSettings(options);
            return options;
        },

        // jQuery 1.6 doesn't provide .state(),
        // while jQuery 1.8+ removed .isRejected() and .isResolved():
        _getDeferredState: function (deferred) {
            if (deferred.state) {
                return deferred.state();
            }
            if (deferred.isResolved()) {
                return 'resolved';
            }
            if (deferred.isRejected()) {
                return 'rejected';
            }
            return 'pending';
        },

        // Maps jqXHR callbacks to the equivalent
        // methods of the given Promise object:
        _enhancePromise: function (promise) {
            promise.success = promise.done;
            promise.error = promise.fail;
            promise.complete = promise.always;
            return promise;
        },

        // Creates and returns a Promise object enhanced with
        // the jqXHR methods abort, success, error and complete:
        _getXHRPromise: function (resolveOrReject, context, args) {
            var dfd = $.Deferred(),
                promise = dfd.promise();
            context = context || this.options.context || promise;
            if (resolveOrReject === true) {
                dfd.resolveWith(context, args);
            } else if (resolveOrReject === false) {
                dfd.rejectWith(context, args);
            }
            promise.abort = dfd.promise;
            return this._enhancePromise(promise);
        },

        // Adds convenience methods to the data callback argument:
        _addConvenienceMethods: function (e, data) {
            var that = this,
                getPromise = function (args) {
                    return $.Deferred().resolveWith(that, args).promise();
                };
            data.process = function (resolveFunc, rejectFunc) {
                if (resolveFunc || rejectFunc) {
                    data._processQueue = this._processQueue =
                        (this._processQueue || getPromise([this])).pipe(
                            function () {
                                if (data.errorThrown) {
                                    return $.Deferred()
                                        .rejectWith(that, [data]).promise();
                                }
                                return getPromise(arguments);
                            }
                        ).pipe(resolveFunc, rejectFunc);
                }
                return this._processQueue || getPromise([this]);
            };
            data.submit = function () {
                if (this.state() !== 'pending') {
                    data.jqXHR = this.jqXHR =
                        (that._trigger(
                            'submit',
                            $.Event('submit', {delegatedEvent: e}),
                            this
                        ) !== false) && that._onSend(e, this);
                }
                return this.jqXHR || that._getXHRPromise();
            };
            data.abort = function () {
                if (this.jqXHR) {
                    return this.jqXHR.abort();
                }
                this.errorThrown = 'abort';
                that._trigger('fail', null, this);
                return that._getXHRPromise(false);
            };
            data.state = function () {
                if (this.jqXHR) {
                    return that._getDeferredState(this.jqXHR);
                }
                if (this._processQueue) {
                    return that._getDeferredState(this._processQueue);
                }
            };
            data.processing = function () {
                return !this.jqXHR && this._processQueue && that
                    ._getDeferredState(this._processQueue) === 'pending';
            };
            data.progress = function () {
                return this._progress;
            };
            data.response = function () {
                return this._response;
            };
        },

        // Parses the Range header from the server response
        // and returns the uploaded bytes:
        _getUploadedBytes: function (jqXHR) {
            var range = jqXHR.getResponseHeader('Range'),
                parts = range && range.split('-'),
                upperBytesPos = parts && parts.length > 1 &&
                    parseInt(parts[1], 10);
            return upperBytesPos && upperBytesPos + 1;
        },

        // Uploads a file in multiple, sequential requests
        // by splitting the file up in multiple blob chunks.
        // If the second parameter is true, only tests if the file
        // should be uploaded in chunks, but does not invoke any
        // upload requests:
        _chunkedUpload: function (options, testOnly) {
            options.uploadedBytes = options.uploadedBytes || 0;
            var that = this,
                file = options.files[0],
                fs = file.size,
                ub = options.uploadedBytes,
                mcs = options.maxChunkSize || fs,
                slice = this._blobSlice,
                dfd = $.Deferred(),
                promise = dfd.promise(),
                jqXHR,
                upload;
            if (!(this._isXHRUpload(options) && slice && (ub || mcs < fs)) ||
                    options.data) {
                return false;
            }
            if (testOnly) {
                return true;
            }
            if (ub >= fs) {
                file.error = options.i18n('uploadedBytes');
                return this._getXHRPromise(
                    false,
                    options.context,
                    [null, 'error', file.error]
                );
            }
            // The chunk upload method:
            upload = function () {
                // Clone the options object for each chunk upload:
                var o = $.extend({}, options),
                    currentLoaded = o._progress.loaded;
                o.blob = slice.call(
                    file,
                    ub,
                    ub + mcs,
                    file.type
                );
                // Store the current chunk size, as the blob itself
                // will be dereferenced after data processing:
                o.chunkSize = o.blob.size;
                // Expose the chunk bytes position range:
                o.contentRange = 'bytes ' + ub + '-' +
                    (ub + o.chunkSize - 1) + '/' + fs;
                // Process the upload data (the blob and potential form data):
                that._initXHRData(o);
                // Add progress listeners for this chunk upload:
                that._initProgressListener(o);
                jqXHR = ((that._trigger('chunksend', null, o) !== false && $.ajax(o)) ||
                        that._getXHRPromise(false, o.context))
                    .done(function (result, textStatus, jqXHR) {
                        ub = that._getUploadedBytes(jqXHR) ||
                            (ub + o.chunkSize);
                        // Create a progress event if no final progress event
                        // with loaded equaling total has been triggered
                        // for this chunk:
                        if (currentLoaded + o.chunkSize - o._progress.loaded) {
                            that._onProgress($.Event('progress', {
                                lengthComputable: true,
                                loaded: ub - o.uploadedBytes,
                                total: ub - o.uploadedBytes
                            }), o);
                        }
                        options.uploadedBytes = o.uploadedBytes = ub;
                        o.result = result;
                        o.textStatus = textStatus;
                        o.jqXHR = jqXHR;
                        that._trigger('chunkdone', null, o);
                        that._trigger('chunkalways', null, o);
                        if (ub < fs) {
                            // File upload not yet complete,
                            // continue with the next chunk:
                            upload();
                        } else {
                            dfd.resolveWith(
                                o.context,
                                [result, textStatus, jqXHR]
                            );
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        o.jqXHR = jqXHR;
                        o.textStatus = textStatus;
                        o.errorThrown = errorThrown;
                        that._trigger('chunkfail', null, o);
                        that._trigger('chunkalways', null, o);
                        dfd.rejectWith(
                            o.context,
                            [jqXHR, textStatus, errorThrown]
                        );
                    });
            };
            this._enhancePromise(promise);
            promise.abort = function () {
                return jqXHR.abort();
            };
            upload();
            return promise;
        },

        _beforeSend: function (e, data) {
            if (this._active === 0) {
                // the start callback is triggered when an upload starts
                // and no other uploads are currently running,
                // equivalent to the global ajaxStart event:
                this._trigger('start');
                // Set timer for global bitrate progress calculation:
                this._bitrateTimer = new this._BitrateTimer();
                // Reset the global progress values:
                this._progress.loaded = this._progress.total = 0;
                this._progress.bitrate = 0;
            }
            // Make sure the container objects for the .response() and
            // .progress() methods on the data object are available
            // and reset to their initial state:
            this._initResponseObject(data);
            this._initProgressObject(data);
            data._progress.loaded = data.loaded = data.uploadedBytes || 0;
            data._progress.total = data.total = this._getTotal(data.files) || 1;
            data._progress.bitrate = data.bitrate = 0;
            this._active += 1;
            // Initialize the global progress values:
            this._progress.loaded += data.loaded;
            this._progress.total += data.total;
        },

        _onDone: function (result, textStatus, jqXHR, options) {
            var total = options._progress.total,
                response = options._response;
            if (options._progress.loaded < total) {
                // Create a progress event if no final progress event
                // with loaded equaling total has been triggered:
                this._onProgress($.Event('progress', {
                    lengthComputable: true,
                    loaded: total,
                    total: total
                }), options);
            }
            response.result = options.result = result;
            response.textStatus = options.textStatus = textStatus;
            response.jqXHR = options.jqXHR = jqXHR;
            this._trigger('done', null, options);
        },

        _onFail: function (jqXHR, textStatus, errorThrown, options) {
            var response = options._response;
            if (options.recalculateProgress) {
                // Remove the failed (error or abort) file upload from
                // the global progress calculation:
                this._progress.loaded -= options._progress.loaded;
                this._progress.total -= options._progress.total;
            }
            response.jqXHR = options.jqXHR = jqXHR;
            response.textStatus = options.textStatus = textStatus;
            response.errorThrown = options.errorThrown = errorThrown;
            this._trigger('fail', null, options);
        },

        _onAlways: function (jqXHRorResult, textStatus, jqXHRorError, options) {
            // jqXHRorResult, textStatus and jqXHRorError are added to the
            // options object via done and fail callbacks
            this._trigger('always', null, options);
        },

        _onSend: function (e, data) {
            if (!data.submit) {
                this._addConvenienceMethods(e, data);
            }
            var that = this,
                jqXHR,
                aborted,
                slot,
                pipe,
                options = that._getAJAXSettings(data),
                send = function () {
                    that._sending += 1;
                    // Set timer for bitrate progress calculation:
                    options._bitrateTimer = new that._BitrateTimer();
                    jqXHR = jqXHR || (
                        ((aborted || that._trigger(
                            'send',
                            $.Event('send', {delegatedEvent: e}),
                            options
                        ) === false) &&
                        that._getXHRPromise(false, options.context, aborted)) ||
                        that._chunkedUpload(options) || $.ajax(options)
                    ).done(function (result, textStatus, jqXHR) {
                        that._onDone(result, textStatus, jqXHR, options);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        that._onFail(jqXHR, textStatus, errorThrown, options);
                    }).always(function (jqXHRorResult, textStatus, jqXHRorError) {
                        that._onAlways(
                            jqXHRorResult,
                            textStatus,
                            jqXHRorError,
                            options
                        );
                        that._sending -= 1;
                        that._active -= 1;
                        if (options.limitConcurrentUploads &&
                                options.limitConcurrentUploads > that._sending) {
                            // Start the next queued upload,
                            // that has not been aborted:
                            var nextSlot = that._slots.shift();
                            while (nextSlot) {
                                if (that._getDeferredState(nextSlot) === 'pending') {
                                    nextSlot.resolve();
                                    break;
                                }
                                nextSlot = that._slots.shift();
                            }
                        }
                        if (that._active === 0) {
                            // The stop callback is triggered when all uploads have
                            // been completed, equivalent to the global ajaxStop event:
                            that._trigger('stop');
                        }
                    });
                    return jqXHR;
                };
            this._beforeSend(e, options);
            if (this.options.sequentialUploads ||
                    (this.options.limitConcurrentUploads &&
                    this.options.limitConcurrentUploads <= this._sending)) {
                if (this.options.limitConcurrentUploads > 1) {
                    slot = $.Deferred();
                    this._slots.push(slot);
                    pipe = slot.pipe(send);
                } else {
                    this._sequence = this._sequence.pipe(send, send);
                    pipe = this._sequence;
                }
                // Return the piped Promise object, enhanced with an abort method,
                // which is delegated to the jqXHR object of the current upload,
                // and jqXHR callbacks mapped to the equivalent Promise methods:
                pipe.abort = function () {
                    aborted = [undefined, 'abort', 'abort'];
                    if (!jqXHR) {
                        if (slot) {
                            slot.rejectWith(options.context, aborted);
                        }
                        return send();
                    }
                    return jqXHR.abort();
                };
                return this._enhancePromise(pipe);
            }
            return send();
        },

        _onAdd: function (e, data) {
            var that = this,
                result = true,
                options = $.extend({}, this.options, data),
                files = data.files,
                filesLength = files.length,
                limit = options.limitMultiFileUploads,
                limitSize = options.limitMultiFileUploadSize,
                overhead = options.limitMultiFileUploadSizeOverhead,
                batchSize = 0,
                paramName = this._getParamName(options),
                paramNameSet,
                paramNameSlice,
                fileSet,
                i,
                j = 0;
            if (limitSize && (!filesLength || files[0].size === undefined)) {
                limitSize = undefined;
            }
            if (!(options.singleFileUploads || limit || limitSize) ||
                    !this._isXHRUpload(options)) {
                fileSet = [files];
                paramNameSet = [paramName];
            } else if (!(options.singleFileUploads || limitSize) && limit) {
                fileSet = [];
                paramNameSet = [];
                for (i = 0; i < filesLength; i += limit) {
                    fileSet.push(files.slice(i, i + limit));
                    paramNameSlice = paramName.slice(i, i + limit);
                    if (!paramNameSlice.length) {
                        paramNameSlice = paramName;
                    }
                    paramNameSet.push(paramNameSlice);
                }
            } else if (!options.singleFileUploads && limitSize) {
                fileSet = [];
                paramNameSet = [];
                for (i = 0; i < filesLength; i = i + 1) {
                    batchSize += files[i].size + overhead;
                    if (i + 1 === filesLength ||
                            ((batchSize + files[i + 1].size + overhead) > limitSize) ||
                            (limit && i + 1 - j >= limit)) {
                        fileSet.push(files.slice(j, i + 1));
                        paramNameSlice = paramName.slice(j, i + 1);
                        if (!paramNameSlice.length) {
                            paramNameSlice = paramName;
                        }
                        paramNameSet.push(paramNameSlice);
                        j = i + 1;
                        batchSize = 0;
                    }
                }
            } else {
                paramNameSet = paramName;
            }
            data.originalFiles = files;
            $.each(fileSet || files, function (index, element) {
                var newData = $.extend({}, data);
                newData.files = fileSet ? element : [element];
                newData.paramName = paramNameSet[index];
                that._initResponseObject(newData);
                that._initProgressObject(newData);
                that._addConvenienceMethods(e, newData);
                result = that._trigger(
                    'add',
                    $.Event('add', {delegatedEvent: e}),
                    newData
                );
                return result;
            });
            return result;
        },

        _replaceFileInput: function (input) {
            var inputClone = input.clone(true);
            $('<form></form>').append(inputClone)[0].reset();
            // Detaching allows to insert the fileInput on another form
            // without loosing the file input value:
            input.after(inputClone).detach();
            // Avoid memory leaks with the detached file input:
            $.cleanData(input.unbind('remove'));
            // Replace the original file input element in the fileInput
            // elements set with the clone, which has been copied including
            // event handlers:
            this.options.fileInput = this.options.fileInput.map(function (i, el) {
                if (el === input[0]) {
                    return inputClone[0];
                }
                return el;
            });
            // If the widget has been initialized on the file input itself,
            // override this.element with the file input clone:
            if (input[0] === this.element[0]) {
                this.element = inputClone;
            }
        },

        _handleFileTreeEntry: function (entry, path) {
            var that = this,
                dfd = $.Deferred(),
                errorHandler = function (e) {
                    if (e && !e.entry) {
                        e.entry = entry;
                    }
                    // Since $.when returns immediately if one
                    // Deferred is rejected, we use resolve instead.
                    // This allows valid files and invalid items
                    // to be returned together in one set:
                    dfd.resolve([e]);
                },
                dirReader;
            path = path || '';
            if (entry.isFile) {
                if (entry._file) {
                    // Workaround for Chrome bug #149735
                    entry._file.relativePath = path;
                    dfd.resolve(entry._file);
                } else {
                    entry.file(function (file) {
                        file.relativePath = path;
                        dfd.resolve(file);
                    }, errorHandler);
                }
            } else if (entry.isDirectory) {
                dirReader = entry.createReader();
                dirReader.readEntries(function (entries) {
                    that._handleFileTreeEntries(
                        entries,
                        path + entry.name + '/'
                    ).done(function (files) {
                        dfd.resolve(files);
                    }).fail(errorHandler);
                }, errorHandler);
            } else {
                // Return an empy list for file system items
                // other than files or directories:
                dfd.resolve([]);
            }
            return dfd.promise();
        },

        _handleFileTreeEntries: function (entries, path) {
            var that = this;
            return $.when.apply(
                $,
                $.map(entries, function (entry) {
                    return that._handleFileTreeEntry(entry, path);
                })
            ).pipe(function () {
                return Array.prototype.concat.apply(
                    [],
                    arguments
                );
            });
        },

        _getDroppedFiles: function (dataTransfer) {
            dataTransfer = dataTransfer || {};
            var items = dataTransfer.items;
            if (items && items.length && (items[0].webkitGetAsEntry ||
                    items[0].getAsEntry)) {
                return this._handleFileTreeEntries(
                    $.map(items, function (item) {
                        var entry;
                        if (item.webkitGetAsEntry) {
                            entry = item.webkitGetAsEntry();
                            if (entry) {
                                // Workaround for Chrome bug #149735:
                                entry._file = item.getAsFile();
                            }
                            return entry;
                        }
                        return item.getAsEntry();
                    })
                );
            }
            return $.Deferred().resolve(
                $.makeArray(dataTransfer.files)
            ).promise();
        },

        _getSingleFileInputFiles: function (fileInput) {
            fileInput = $(fileInput);
            var entries = fileInput.prop('webkitEntries') ||
                    fileInput.prop('entries'),
                files,
                value;
            if (entries && entries.length) {
                return this._handleFileTreeEntries(entries);
            }
            files = $.makeArray(fileInput.prop('files'));
            if (!files.length) {
                value = fileInput.prop('value');
                if (!value) {
                    return $.Deferred().resolve([]).promise();
                }
                // If the files property is not available, the browser does not
                // support the File API and we add a pseudo File object with
                // the input value as name with path information removed:
                files = [{name: value.replace(/^.*\\/, '')}];
            } else if (files[0].name === undefined && files[0].fileName) {
                // File normalization for Safari 4 and Firefox 3:
                $.each(files, function (index, file) {
                    file.name = file.fileName;
                    file.size = file.fileSize;
                });
            }
            return $.Deferred().resolve(files).promise();
        },

        _getFileInputFiles: function (fileInput) {
            if (!(fileInput instanceof $) || fileInput.length === 1) {
                return this._getSingleFileInputFiles(fileInput);
            }
            return $.when.apply(
                $,
                $.map(fileInput, this._getSingleFileInputFiles)
            ).pipe(function () {
                return Array.prototype.concat.apply(
                    [],
                    arguments
                );
            });
        },

        _onChange: function (e) {
            var that = this,
                data = {
                    fileInput: $(e.target),
                    form: $(e.target.form)
                };
            this._getFileInputFiles(data.fileInput).always(function (files) {
                data.files = files;
                if (that.options.replaceFileInput) {
                    that._replaceFileInput(data.fileInput);
                }
                if (that._trigger(
                        'change',
                        $.Event('change', {delegatedEvent: e}),
                        data
                    ) !== false) {
                    that._onAdd(e, data);
                }
            });
        },

        _onPaste: function (e) {
            var items = e.originalEvent && e.originalEvent.clipboardData &&
                    e.originalEvent.clipboardData.items,
                data = {files: []};
            if (items && items.length) {
                $.each(items, function (index, item) {
                    var file = item.getAsFile && item.getAsFile();
                    if (file) {
                        data.files.push(file);
                    }
                });
                if (this._trigger(
                        'paste',
                        $.Event('paste', {delegatedEvent: e}),
                        data
                    ) !== false) {
                    this._onAdd(e, data);
                }
            }
        },

        _onDrop: function (e) {
            e.dataTransfer = e.originalEvent && e.originalEvent.dataTransfer;
            var that = this,
                dataTransfer = e.dataTransfer,
                data = {};
            if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                e.preventDefault();
                this._getDroppedFiles(dataTransfer).always(function (files) {
                    data.files = files;
                    if (that._trigger(
                            'drop',
                            $.Event('drop', {delegatedEvent: e}),
                            data
                        ) !== false) {
                        that._onAdd(e, data);
                    }
                });
            }
        },

        _onDragOver: function (e) {
            e.dataTransfer = e.originalEvent && e.originalEvent.dataTransfer;
            var dataTransfer = e.dataTransfer;
            if (dataTransfer && $.inArray('Files', dataTransfer.types) !== -1 &&
                    this._trigger(
                        'dragover',
                        $.Event('dragover', {delegatedEvent: e})
                    ) !== false) {
                e.preventDefault();
                dataTransfer.dropEffect = 'copy';
            }
        },

        _initEventHandlers: function () {
            if (this._isXHRUpload(this.options)) {
                this._on(this.options.dropZone, {
                    dragover: this._onDragOver,
                    drop: this._onDrop
                });
                this._on(this.options.pasteZone, {
                    paste: this._onPaste
                });
            }
            if ($.support.fileInput) {
                this._on(this.options.fileInput, {
                    change: this._onChange
                });
            }
        },

        _destroyEventHandlers: function () {
            this._off(this.options.dropZone, 'dragover drop');
            this._off(this.options.pasteZone, 'paste');
            this._off(this.options.fileInput, 'change');
        },

        _setOption: function (key, value) {
            var reinit = $.inArray(key, this._specialOptions) !== -1;
            if (reinit) {
                this._destroyEventHandlers();
            }
            this._super(key, value);
            if (reinit) {
                this._initSpecialOptions();
                this._initEventHandlers();
            }
        },

        _initSpecialOptions: function () {
            var options = this.options;
            if (options.fileInput === undefined) {
                options.fileInput = this.element.is('input[type="file"]') ?
                        this.element : this.element.find('input[type="file"]');
            } else if (!(options.fileInput instanceof $)) {
                options.fileInput = $(options.fileInput);
            }
            if (!(options.dropZone instanceof $)) {
                options.dropZone = $(options.dropZone);
            }
            if (!(options.pasteZone instanceof $)) {
                options.pasteZone = $(options.pasteZone);
            }
        },

        _getRegExp: function (str) {
            var parts = str.split('/'),
                modifiers = parts.pop();
            parts.shift();
            return new RegExp(parts.join('/'), modifiers);
        },

        _isRegExpOption: function (key, value) {
            return key !== 'url' && $.type(value) === 'string' &&
                /^\/.*\/[igm]{0,3}$/.test(value);
        },

        _initDataAttributes: function () {
            var that = this,
                options = this.options,
                clone = $(this.element[0].cloneNode(false));
            // Initialize options set via HTML5 data-attributes:
            $.each(
                clone.data(),
                function (key, value) {
                    var dataAttributeName = 'data-' +
                        // Convert camelCase to hyphen-ated key:
                        key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                    if (clone.attr(dataAttributeName)) {
                        if (that._isRegExpOption(key, value)) {
                            value = that._getRegExp(value);
                        }
                        options[key] = value;
                    }
                }
            );
        },

        _create: function () {
            this._initDataAttributes();
            this._initSpecialOptions();
            this._slots = [];
            this._sequence = this._getXHRPromise(true);
            this._sending = this._active = 0;
            this._initProgressObject(this);
            this._initEventHandlers();
        },

        // This method is exposed to the widget API and allows to query
        // the number of active uploads:
        active: function () {
            return this._active;
        },

        // This method is exposed to the widget API and allows to query
        // the widget upload progress.
        // It returns an object with loaded, total and bitrate properties
        // for the running uploads:
        progress: function () {
            return this._progress;
        },

        // This method is exposed to the widget API and allows adding files
        // using the fileupload API. The data parameter accepts an object which
        // must have a files property and can contain additional options:
        // .fileupload('add', {files: filesList});
        add: function (data) {
            var that = this;
            if (!data || this.options.disabled) {
                return;
            }
            if (data.fileInput && !data.files) {
                this._getFileInputFiles(data.fileInput).always(function (files) {
                    data.files = files;
                    that._onAdd(null, data);
                });
            } else {
                data.files = $.makeArray(data.files);
                this._onAdd(null, data);
            }
        },

        // This method is exposed to the widget API and allows sending files
        // using the fileupload API. The data parameter accepts an object which
        // must have a files or fileInput property and can contain additional options:
        // .fileupload('send', {files: filesList});
        // The method returns a Promise object for the file upload call.
        send: function (data) {
            if (data && !this.options.disabled) {
                if (data.fileInput && !data.files) {
                    var that = this,
                        dfd = $.Deferred(),
                        promise = dfd.promise(),
                        jqXHR,
                        aborted;
                    promise.abort = function () {
                        aborted = true;
                        if (jqXHR) {
                            return jqXHR.abort();
                        }
                        dfd.reject(null, 'abort', 'abort');
                        return promise;
                    };
                    this._getFileInputFiles(data.fileInput).always(
                        function (files) {
                            if (aborted) {
                                return;
                            }
                            if (!files.length) {
                                dfd.reject();
                                return;
                            }
                            data.files = files;
                            jqXHR = that._onSend(null, data).then(
                                function (result, textStatus, jqXHR) {
                                    dfd.resolve(result, textStatus, jqXHR);
                                },
                                function (jqXHR, textStatus, errorThrown) {
                                    dfd.reject(jqXHR, textStatus, errorThrown);
                                }
                            );
                        }
                    );
                    return this._enhancePromise(promise);
                }
                data.files = $.makeArray(data.files);
                if (data.files.length) {
                    return this._onSend(null, data);
                }
            }
            return this._getXHRPromise(false, data && data.context);
        }

    });

}));
