we use a type where we need flexible unions, and interfaces where we want extendable object contracts.

# remove any stale install

npm uninstall onnxruntime-node

# reinstall the native binding for your architecture

npm install onnxruntime-node@latest --build-from-source

# or fallback to npm rebuild if it’s already present:

npm rebuild onnxruntime-node --build-from-source
