define([], function(){
	return function(obj) {
obj || (obj = {});
var __t, __p = '';
with (obj) {
__p += 'define(' +
((__t = ( imports )) == null ? '' : __t) +
', function(' +
((__t = ( args )) == null ? '' : __t) +
'){\n	var zoneOpts = ' +
((__t = ( zoneOpts )) == null ? '' : __t) +
';\n	var useZones = zoneOpts.useZones;\n	var tokens = ' +
((__t = ( intermediate )) == null ? '' : __t) +
';\n	var renderer = stache(tokens);\n\n	var isNode = typeof process === "object" &&\n		{}.toString.call(process) === "[object process]";\n	var isNW = (function(){\n		try{var nr = loader._nodeRequire; return nr && nr(\'nw.gui\') !== \'undefined\';}catch(e){return false;}\n	})();\n	var isElectron = isNode && !!process.versions.electron;\n\n	/**\n	 * @function render\n	 * @hide\n	 * @description Call the stache renderer function with Scope and Options.\n	 * @signature `render(scope, options)`\n	 * @param {can-view-scope} scope A can-view-scope object.\n	 * @param {can-view-scope.Options} options An option object.\n	 * @return {DocumentFragment} The result of calling a can-stache renderer,\n	 * a document fragment.\n	 */\n	function render(scope, options){\n		var moduleOptions = { module: module };\n		options = (options && options.add) ? options.add(moduleOptions) :\n			moduleOptions;\n		return renderer(scope, options);\n	}\n\n	/**\n	 * @function connectViewModel\n	 * @description Create a new instance of the provided ViewModel, set it\n	 * as the route\'s data, and call route.start().\n	 * @signature `connectViewModel()`\n	 * @return {Map} an instance of some map type.\n	 */\n	function connectViewModel() {\n		var ViewModel = context.ViewModel;\n\n		if(!ViewModel) {\n			var message  = "done-autorender cannot start without a ViewModel. " +\n				"Please ensure your template contains an export for your " +\n				"application\'s ViewModel. https://github.com/donejs/autorender#viewmodel";\n			console.error(message);\n			return;\n		}\n\n		var viewModel = context.state = new ViewModel();\n		domData.set.call(document.documentElement, "viewModel", viewModel);\n\n		route.data = viewModel;\n		route.start();\n		return viewModel;\n	}\n\n	/**\n	 * @function connectViewModelAndAttach\n	 * @description Render the stache template, then update the\n	 * DOM to reflect these changes. Save the state of the ViewModel instance\n	 * so that it can be reused to do rerenders in case of live-reload. This is\n	 * the main entry point of rendering, and happens upon page load.\n	 * @signature `connectViewModelAndAttach()`\n	 **/\n	function connectViewModelAndAttach() {\n		connectViewModel();\n		return renderAndAttach();\n	}\n\n	/**\n	 * @function reattachWithZone\n	 * @description Create a Zone for reattach.\n	 * @signature `reattachWithZone()`\n	 **/\n	function reattachWithZone() {\n		new Zone({\n			plugins: [xhrZone]\n		}).run(function(){\n			var viewModel = connectViewModel();\n			var result = renderInZone(viewModel);\n\n			var incremental = document.documentElement.dataset.incrementallyRendered === "";\n\n			// If incrementally rendering, attach right away. IR hydration will\n			// handle reattachment.\n			if(incremental) {\n				attach(result);\n			} else {\n				result.promise.then(attach);\n			}\n		});\n	}\n\n	var tagsToIgnore = { "SCRIPT": true, "STYLE": true, "LINK": true };\n\n	/**\n	 * Call a callback for each child Node within a parent, skipping\n	 * elements that should not be touched because of their side-effects.\n	 */\n	function eachChild(parent, callback){\n		var nodes = Array.prototype.slice.call(childNodes(parent)),\n			i = 0, len = nodes.length,\n			node, ignoreTag;\n\n		for(; i < len; i++) {\n			node = nodes[i];\n			ignoreTag = tagsToIgnore[node.nodeName];\n			if(!ignoreTag) {\n				// Returning false breaks the loop\n				if(callback(node) === false) {\n					break;\n				}\n			}\n		}\n	}\n\n	/**\n	 * Remove an element\n	 */\n	function remove(el) {\n		mutate.removeChild.call(el.parentNode, el);\n	}\n\n	/**\n	 * Creates a function that will append to a parent Element.\n	 */\n	function appendTo(parent){\n		return function(el){\n			mutate.appendChild.call(parent, el);\n		}\n	}\n\n	/**\n	 * @function attach\n	 * @hide\n	 * @description Receives the completely rendered DocumentFragment and\n	 * attaches the parts from the head into the document.head, the body into\n	 * document.body.\n	 * @signature `attach(result)`\n	 * @param {RenderResult} The result of rendering within a Zone.\n	 */\n	function attach(result){\n		var frag = result.fragment;\n\n		// If already attached skip this part.\n		if(document.documentElement.hasAttribute("data-attached")) {\n			return;\n		}\n\n		var head = document.head;\n		var body = document.body;\n\n		// Move elements from the fragment\'s head to the document head.\n		eachChild(head, remove);\n\n		var fragHead = frag.querySelector("head");\n		eachChild(fragHead, appendTo(head));\n\n		// Move elements from the fragment\'s body to the document body.\n		eachChild(body, remove);\n\n		var fragBody = frag.querySelector("body");\n		eachChild(fragBody, appendTo(body));\n		document.documentElement.setAttribute("data-attached", "");\n	}\n\n\n	/**\n	 * @function renderAndAttach\n	 * @hide\n	 * @description Render the template with a Zone, wait for all asynchronous\n	 * events to complete, and then attach the DocumentFragment to the page.\n	 * @signature `renderAndAttach()`\n	 * @return {Promise} A Promise that resolves after the template has been\n	 * attached to the DOM.\n	 */\n	function renderAndAttach(){\n		var viewModel = context.state;\n		return useZones\n			? renderInZone(viewModel).promise.then(attach)\n			: renderNoZone(viewModel).then(attach);\n	}\n\n	/**\n	 * @function renderIntoZone\n	 * @hide\n	 * @description Render a viewModel in a Zone context, returning the\n	 * Zone promise.\n	 * @signature `renderIntoZone(viewModel)`\n	 * @param {Object} viewModel\n	 * @return {RenderResult} the promise that resolves when asynchronousity\n	 * within the Zone is complete, and the fragment generated.\n	 */\n	function renderInZone(viewModel){\n		function getZonePlugins() {\n			var plugins = [xhrZone];\n			if(zoneOpts.useDebug) {\n				var timeout = zoneOpts.timeout;\n				var opts = {\n					break: zoneOpts.debugBrk\n				};\n\n				plugins.push(debugZone(timeout, opts));\n			}\n			return plugins;\n		}\n\n		function logDebugInfo() {\n			var warn = Function.prototype.bind.call(console.warn, console);\n			var zoneData = zone.data;\n			if(zoneData.debugInfo) {\n				zoneData.debugInfo.forEach(function(info){\n					warn(info.task, info.stack);\n				});\n			}\n		}\n\n		var fragment;\n		var zone = new Zone({\n			plugins: getZonePlugins()\n		});\n		var zonePromise = zone.run(function(){\n			fragment = render(viewModel, {});\n		}).then(function(zoneData){\n			return {\n				fragment: fragment,\n				zoneData: zoneData\n			};\n		})\n		.then(null, function(err){\n			if(err.timeout) {\n				logDebugInfo();\n				var error = new Error("Timeout of " + err.timeout + " exceeded");\n				throw error;\n			} else {\n				throw err;\n			}\n		});\n\n		return {\n			promise: zonePromise,\n			fragment: fragment,\n			zoneData: zone.data\n		};\n	}\n\n	/**\n	 * @function renderNoZone\n	 * @hide\n	 * @description Render a viewModel without a Zone.\n	 * @signature `renderIntoZone(viewModel)`\n	 * @param {Object} viewModel\n	 * @return {RenderResult} the promise that resolves immediately with a fragment.\n	 */\n	function renderNoZone(viewModel){\n		var fragment = render(viewModel, {});\n		return Promise.resolve({ fragment: fragment });\n	}\n\n	/**\n	 * @function renderIntoDocument\n	 * @description This is used in SSR, it provides a fresh document\n	 * and viewModel, and this function calls the stache renderer and updates\n	 * the document with the result.\n	 * @signature `renderIntoDocument(document, viewModel)`\n	 * @param {Document} document\n	 * @param {Object} viewModel\n	**/\n	function renderIntoDocument(document, viewModel) {\n		var frag = render(viewModel, {});\n\n		var firstChild = frag.firstChild;\n		var documentElement = document.documentElement;\n\n		// If there is an <html> element, which there usually is,\n		// replace the existing documentElement, otherwise just append the fragment\n		if(firstChild && firstChild.nodeName === "HTML") {\n			mutate.replaceChild.call(document, firstChild, documentElement);\n		} else {\n			mutate.appendChild.call(documentElement, frag);\n		}\n	}\n\n	if(typeof steal !== \'undefined\' && (isNW || isElectron || !isNode)) {\n		steal.done().then(function() {\n			if(steal.loader.autorenderAutostart !== false) {\n				if (useZones){\n					reattachWithZone();\n				} else {\n					connectViewModelAndAttach();\n				}\n			}\n		});\n	}\n\n	var context = Object.create(Function.prototype, {\n		' +
((__t = ( ases )) == null ? '' : __t) +
'\n		ownerDocument: {\n			get: function(){\n				return document;\n			}\n		},\n		renderAndAttach: {\n			value: renderAndAttach\n		},\n		renderInZone: {\n			value: renderInZone\n		},\n		ViewModel: {\n			get: function(){\n				return this.viewModel;\n			}\n		}\n	});\n\n	var defaultProperties = ["env", "request"];\n\n	/**\n	 * @function setupDefaultViewModelProps\n	 * @hide\n	 * @description Given a ViewModel constructor, ensure that the\n	 * default properties like `env` and `request` are not serialized\n	 */\n	function setupDefaultViewModelProps(ViewModel) {\n		if(canReflect.isConstructorLike(ViewModel)) {\n			var proto = ViewModel.prototype;\n			if(!canReflect.hasOwnKey(proto, defaultProperties[0])) {\n				defaultProperties.forEach(function(prop){\n					canReflect.defineInstanceKey(ViewModel, prop, {\n						enumerable: false\n					});\n				});\n			}\n		}\n	}\n\n	/**\n	 * @function createViewModelAndRender\n	 * @hide\n	 * @description Create an instance of the ViewModel and render it with\n	 * the renderIntoDocument function.\n	 * @param {node.IncomingMessage} request A request object, from Node.js\n	 */\n	function createViewModelAndRender(request) {\n		// Check if we were called with .call/apply, otherwise use the\n		// context within the scope. This is for testing.\n		var ctx = context.isPrototypeOf(this) ? this : context;\n\n		var document = ctx.ownerDocument;\n		var ViewModel = ctx.ViewModel;\n\n		if(!ViewModel) {\n			var msg = "done-autorender cannot render your application " +\n							"without a viewModel defined. " +\n							"See the guide for information. " +\n							"http://donejs.com/Guide.html#section_Createatemplateandmainfile";\n			throw new Error(msg);\n		}\n\n		setupDefaultViewModelProps(ViewModel);\n\n		var pathname = new URL(fullUrl(request)).pathname;\n		var params = Object.assign(route.deparam(pathname), {\n			env: Object.assign({}, process.env),\n			request: request\n		});\n\n		var viewModel = new ViewModel(params);\n\n		if(!Object.isSealed(viewModel) &&\n			!canReflect.getKeyValue(viewModel, "statusCode") &&\n			!isEmptyObject(route.routes)) {\n			// fix: support root-url (i.e \'/\') in production-mode\n			if(typeof params.route === "string") {\n				canReflect.setKeyValue(viewModel, "statusCode", 200);\n			} else {\n				canReflect.setKeyValue(viewModel, "statusCode", 404);\n				canReflect.setKeyValue(viewModel, "statusMessage", "Not found");\n			}\n		}\n\n		route.data = viewModel;\n		route.start();\n\n		renderIntoDocument(document, viewModel);\n	}\n\n	Object.setPrototypeOf(createViewModelAndRender, context);\n\n	return createViewModelAndRender;\n});\n';

}
return __p
}
});