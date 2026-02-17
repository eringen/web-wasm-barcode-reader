mergeInto(LibraryManager.library, {
    js_output_result: function (symbol, data, polygon, polygon_size) {
        // function provided by Emscripten to convert WASM heap string pointers to JS strings.
        const Pointer_stringify = Module["UTF8ToString"];

        // View into WASM heap — valid for the duration of this synchronous call.
        const coordinates = new Int32Array(
            Module["HEAP32"].buffer,
            polygon,
            polygon_size * 2
        );

        // call the downstream processing function that should have been set by the client code
        const downstreamProcessor = Module["processResult"];
        if (downstreamProcessor == null) {
            return;
        }
        downstreamProcessor(
            Pointer_stringify(symbol),
            Pointer_stringify(data),
            coordinates
        );
    }
});