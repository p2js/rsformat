#### format

- format only escapes colors in debug formatting and not manually inserted
- nested rsstrings carry debug colors
- pretty print is non-compact and adds prefix
- ordinals work
- fill/align works
- pad with 0s works
- pad with 0s does not use fill characters
- signs work for numbers and strings
- precision works

- ref works properly
- ref errors on self-reference

#### print
- eprint variants equivalent to print variants but for different streams
- Print to stream works with custom streams and parameters
```js
const writable = new Writable({
    write(chunk, encoding, callback) {
    // Implementation
    },
});
```
- dbg prints and returns values